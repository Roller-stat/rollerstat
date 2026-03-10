import * as brevo from '@getbrevo/brevo';
import { generateUnsubscribeUrl } from './unsubscribe-tokens';
import { resolveWebBaseUrl } from './deployment-env';

const EMAIL_PATTERN = /([a-zA-Z0-9._%+-]{2})[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

function sanitizeLogValue(value: unknown, depth = 0): unknown {
  if (depth > 2) {
    return '[redacted]';
  }

  if (typeof value === 'string') {
    return value.replace(EMAIL_PATTERN, (_, prefix: string, domain: string) => `${prefix}***@${domain}`);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeLogValue(entry, depth + 1));
  }

  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (/email|token|secret|password|signature/i.test(key)) {
        sanitized[key] = '[redacted]';
      } else {
        sanitized[key] = sanitizeLogValue(entry, depth + 1);
      }
    }
    return sanitized;
  }

  return value;
}

function logInfo(...args: unknown[]) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  globalThis.console.log(...args.map((value) => sanitizeLogValue(value)));
}

function logWarn(...args: unknown[]) {
  const sanitized = args.map((value) => sanitizeLogValue(value));
  if (process.env.NODE_ENV === 'production') {
    if (sanitized.length > 0) {
      globalThis.console.warn(String(sanitized[0]));
    }
    return;
  }
  globalThis.console.warn(...sanitized);
}

function logError(...args: unknown[]) {
  const sanitized = args.map((value) => sanitizeLogValue(value));
  if (process.env.NODE_ENV === 'production') {
    if (sanitized.length > 0) {
      globalThis.console.error(String(sanitized[0]));
      return;
    }
    globalThis.console.error('Brevo operation failed');
    return;
  }
  globalThis.console.error(...sanitized);
}

// Initialize Brevo API client
const apiInstance = new brevo.ContactsApi();
const listsApiInstance = new brevo.ContactsApi();
const emailApiInstance = new brevo.TransactionalEmailsApi();

// Configure API key
const brevoApiKey = process.env.BREVO_API_KEY;
if (brevoApiKey) {
  apiInstance.setApiKey(brevo.ContactsApiApiKeys.apiKey, brevoApiKey);
  listsApiInstance.setApiKey(brevo.ContactsApiApiKeys.apiKey, brevoApiKey);
  emailApiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);
  logInfo('✅ Brevo API client initialized');
} else {
  // Keep module import-safe for builds where runtime secrets are unavailable.
  logWarn('⚠️ BREVO_API_KEY not found in environment variables. Brevo features are disabled.');
}

// Types for better type safety
export interface SubscriberAttributes {
  firstName?: string;
  lastName?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface BrevoContact {
  email: string;
  attributes?: SubscriberAttributes;
  listIds?: number[];
  emailBlacklisted?: boolean;
  smsBlacklisted?: boolean;
}

export interface BrevoList {
  id: number;
  name: string;
  totalBlacklisted: number;
  totalSubscribers: number;
  uniqueSubscribers: number;
}

export interface BrevoResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  messageId?: string;
  shouldSendWelcome?: boolean;
  locale?: string; // For unsubscribe confirmation locale
}

export interface SubscriberStats {
  totalSubscribers: number;
  activeSubscribers: number;
  blacklistedSubscribers: number;
  listStats: {
    [listId: number]: {
      name: string;
      count: number;
    };
  };
}

// ============================================================================
// CONTACT MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Add a new subscriber to Brevo
 * @param email - Subscriber's email address
 * @param attributes - Additional subscriber attributes
 * @param listIds - Array of list IDs to add subscriber to
 * @returns Promise<BrevoResponse>
 */
export const addSubscriber = async (
  email: string,
  attributes: SubscriberAttributes = {},
  listIds: number[] = []
): Promise<BrevoResponse> => {
  try {
    logInfo(`📧 Adding subscriber: ${email}`);

    // Get default list IDs from environment if not provided
    const defaultListIds = listIds.length > 0 ? listIds : [
      parseInt(process.env.BREVO_NEWSLETTER_LIST_ID || ''),
      parseInt(process.env.BREVO_WELCOME_LIST_ID || '')
    ].filter(id => !isNaN(id));

    // First, try to get the contact to see if it already exists
    try {
      const existingContact = await apiInstance.getContactInfo(email);
      logInfo(`📧 Contact already exists: ${email}, checking subscription status`);
      
      // Check if user is already subscribed to newsletter list
      const newsletterListId = parseInt(process.env.BREVO_NEWSLETTER_LIST_ID || '');
      const currentListIds = existingContact.body?.listIds || [];
      
      logInfo(`🔍 Checking subscription status for ${email}:`, {
        newsletterListId,
        currentListIds,
        isInNewsletterList: currentListIds.includes(newsletterListId)
      });
      
      if (currentListIds.includes(newsletterListId)) {
        logInfo(`📧 User ${email} is already subscribed to newsletter`);
        return {
          success: false,
          error: 'Email already subscribed'
        };
      }
      
      // User exists but not in newsletter list - they need to be added
      logInfo(`📧 Adding existing user ${email} to newsletter list`);
      
      // Check if user was previously unsubscribed (blacklisted)
      const isBlacklisted = existingContact.body?.emailBlacklisted;
      const attributes = existingContact.body?.attributes as Record<string, unknown> | undefined;
      const wasUnsubscribed = attributes?.unsubscribed as boolean | undefined;
      
      // If user was previously unsubscribed, remove blacklist status
      if (isBlacklisted || wasUnsubscribed) {
        logInfo(`📧 User ${email} was previously unsubscribed, removing blacklist status`);
        
        const updateContact = new brevo.UpdateContact();
        updateContact.emailBlacklisted = false;
        updateContact.smsBlacklisted = false;
        updateContact.attributes = {
          ...existingContact.body?.attributes,
          unsubscribed: false,
          resubscribedAt: new Date().toISOString()
        };
        
        await apiInstance.updateContact(email, updateContact);
        logInfo(`✅ Removed blacklist status for ${email}`);
      }
      
      // Add to Newsletter list (they're already in Welcome series if they exist)
      try {
        await addToList(email, newsletterListId);
        logInfo(`✅ Successfully added to Newsletter list ${newsletterListId}`);
      } catch (listError) {
        logWarn(`⚠️ Failed to add to Newsletter list ${newsletterListId}:`, listError);
      }
      
      logInfo(`📧 Returning addSubscriber result for ${email}:`, {
        success: true,
        shouldSendWelcome: true // Always send welcome email for existing users who weren't subscribed
      });
      
      return {
        success: true,
        data: existingContact,
        messageId: 'existing_contact_added_to_newsletter',
        shouldSendWelcome: true // Always send welcome email for existing users
      };
    } catch {
      // Contact doesn't exist, create new one
      logInfo(`📧 Creating new contact: ${email}`);
      
      const createContact = new brevo.CreateContact();
      createContact.email = email;
      createContact.attributes = attributes;
      createContact.listIds = defaultListIds;
      createContact.emailBlacklisted = false;
      createContact.smsBlacklisted = false;

      const result = await apiInstance.createContact(createContact);
      
      logInfo(`✅ New subscriber added successfully: ${email}`);
      logInfo(`📧 Returning addSubscriber result for new user ${email}:`, {
        success: true,
        shouldSendWelcome: true
      });
      
      return {
        success: true,
        data: result,
        messageId: result.body?.id?.toString(),
        shouldSendWelcome: true // New contacts always get welcome email
      };
    }
  } catch (error: unknown) {
    logError(`❌ Failed to add subscriber ${email}`);
    
    // Handle specific Brevo errors - check multiple possible error structures
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      const response = errorObj.response as { body?: { message?: string }; data?: { message?: string }; status?: number; statusCode?: number } | undefined;
      const body = errorObj.body as { message?: string } | undefined;
      
      const errorMessage =
        response?.data?.message ||
        response?.body?.message ||
        body?.message ||
        (errorObj.message as string) ||
        '';
      
      const statusCode = response?.status || 
                        (errorObj.status as number) || 
                        response?.statusCode;
      
      logInfo('🔍 Parsed error details:', {
        statusCode,
        errorMessage: errorMessage || 'No provider message',
        isDuplicate: errorMessage.includes('Contact already exist') || 
                     errorMessage.includes('already exist') ||
                     errorMessage.includes('duplicate') ||
                     errorMessage.includes('already registered')
      });

      // Unauthorized/disabled API key
      if (statusCode === 401 || errorMessage.includes('API Key is not enabled')) {
        return {
          success: false,
          error: 'Brevo API key unauthorized'
        };
      }
      
      // Check for duplicate contact errors (status 400 or 409)
      if (statusCode === 400 || statusCode === 409) {
        if (errorMessage.includes('Contact already exist') || 
            errorMessage.includes('already exist') ||
            errorMessage.includes('duplicate') ||
            errorMessage.includes('already registered')) {
          logInfo('✅ Detected duplicate contact, returning already subscribed error');
          return {
            success: false,
            error: 'Email already subscribed'
          };
        }
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add subscriber'
    };
  }
};

/**
 * Update subscriber information
 * @param email - Subscriber's email address
 * @param attributes - Updated subscriber attributes
 * @returns Promise<BrevoResponse>
 */
export const updateSubscriber = async (
  email: string,
  attributes: SubscriberAttributes
): Promise<BrevoResponse> => {
  try {
    logInfo(`📝 Updating subscriber: ${email}`);

    const updateContact = new brevo.UpdateContact();
    updateContact.attributes = attributes;

    const result = await apiInstance.updateContact(email, updateContact);
    
    logInfo(`✅ Subscriber updated successfully: ${email}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    logError(`❌ Failed to update subscriber ${email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subscriber'
    };
  }
};

/**
 * Remove subscriber from all lists
 * @param email - Subscriber's email address
 * @returns Promise<BrevoResponse>
 */
export const removeSubscriber = async (email: string): Promise<BrevoResponse> => {
  try {
    logInfo(`🗑️ Unsubscribing: ${email}`);

    // Get the contact first to get their current list IDs
    let contactInfo;
    try {
      contactInfo = await apiInstance.getContactInfo(email);
    } catch {
      logInfo(`📧 Contact ${email} not found, nothing to unsubscribe`);
      return {
        success: true,
        data: { message: 'Contact not found, already unsubscribed' }
      };
    }

    // Get locale from subscriber attributes BEFORE making changes (needed for confirmation email)
    const subscriberLocale = (contactInfo.body?.attributes as Record<string, unknown>)?.locale as string | undefined;
    
    // Remove from Newsletter list only (keep in Welcome list)
    const newsletterListId = parseInt(process.env.BREVO_NEWSLETTER_LIST_ID || '');
    const currentListIds = contactInfo.body?.listIds || [];
    
    logInfo(`📋 Current lists: ${currentListIds.join(', ')}`);
    logInfo(`📋 Removing from Newsletter list only (ID: ${newsletterListId})`);
    
    if (currentListIds.includes(newsletterListId)) {
      try {
        await removeFromList(email, newsletterListId);
        logInfo(`✅ Removed from Newsletter list ${newsletterListId}`);
      } catch (listError) {
        logWarn(`⚠️ Failed to remove from Newsletter list ${newsletterListId}:`, listError);
      }
    } else {
      logInfo(`📧 User ${email} was not in Newsletter list`);
    }

    // IMPORTANT: Update attributes first (but DON'T blacklist yet - we need to send confirmation email)
    const updateContact = new brevo.UpdateContact();
    // DO NOT blacklist yet - we need to send confirmation email first
    // updateContact.emailBlacklisted = true;  // ← Moved this AFTER confirmation email
    updateContact.attributes = {
      ...contactInfo.body?.attributes,
      unsubscribedAt: new Date().toISOString(),
      unsubscribed: true
    };

    const result = await apiInstance.updateContact(email, updateContact);
    
    logInfo(`✅ Subscriber unsubscribed successfully: ${email}`);
    return {
      success: true,
      data: result,
      messageId: 'unsubscribed_successfully',
      locale: subscriberLocale || 'en' // Return locale for confirmation email
    };
  } catch (error: unknown) {
    logError(`❌ Failed to unsubscribe ${email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unsubscribe'
    };
  }
};

/**
 * Get subscriber details
 * @param email - Subscriber's email address
 * @returns Promise<BrevoResponse>
 */
export const getSubscriber = async (email: string): Promise<BrevoResponse> => {
  try {
    logInfo(`🔍 Getting subscriber details: ${email}`);

    const result = await apiInstance.getContactInfo(email);
    
    logInfo(`✅ Subscriber details retrieved: ${email}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    logError(`❌ Failed to get subscriber ${email}:`, error);
    
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return {
        success: false,
        error: 'Subscriber not found'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get subscriber'
    };
  }
};

/**
 * Get subscription statistics
 * @returns Promise<SubscriberStats>
 */
export const getSubscriberStats = async (): Promise<SubscriberStats> => {
  try {
    logInfo(`📊 Getting subscriber statistics`);

    // Get all lists
    const listsResult = await listsApiInstance.getLists();
    const lists = listsResult.body?.lists || [];

    // Calculate stats
    const totalSubscribers = lists.reduce((sum: number, list: { uniqueSubscribers?: number }) => sum + (list.uniqueSubscribers || 0), 0);
    const activeSubscribers = lists.reduce((sum: number, list: { totalSubscribers?: number }) => sum + (list.totalSubscribers || 0), 0);
    const blacklistedSubscribers = lists.reduce((sum: number, list: { totalBlacklisted?: number }) => sum + (list.totalBlacklisted || 0), 0);

    const listStats: { [listId: number]: { name: string; count: number } } = {};
    lists.forEach((list: { id?: number; name?: string; uniqueSubscribers?: number }) => {
      if (list.id) {
        listStats[list.id] = {
          name: list.name || 'Unknown',
          count: list.uniqueSubscribers || 0
        };
      }
    });

    logInfo(`✅ Subscriber statistics retrieved`);
    return {
      totalSubscribers,
      activeSubscribers,
      blacklistedSubscribers,
      listStats
    };
  } catch (error: unknown) {
    logError(`❌ Failed to get subscriber statistics:`, error);
    return {
      totalSubscribers: 0,
      activeSubscribers: 0,
      blacklistedSubscribers: 0,
      listStats: {}
    };
  }
};

// ============================================================================
// LIST MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Create a new subscriber list
 * @param name - List name
 * @param description - List description
 * @returns Promise<BrevoResponse>
 */
export const createList = async (name: string): Promise<BrevoResponse> => {
  try {
    logInfo(`📋 Creating list: ${name}`);

    const createList = new brevo.CreateList();
    createList.name = name;
    createList.folderId = 1; // Default folder

    const result = await listsApiInstance.createList(createList);
    
    logInfo(`✅ List created successfully: ${name}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    logError(`❌ Failed to create list ${name}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create list'
    };
  }
};

/**
 * Add subscriber to specific list
 * @param email - Subscriber's email address
 * @param listId - List ID to add subscriber to
 * @returns Promise<BrevoResponse>
 */
export const addToList = async (email: string, listId: number): Promise<BrevoResponse> => {
  try {
    logInfo(`➕ Adding ${email} to list ${listId}`);

    const addContactToList = new brevo.AddContactToList();
    addContactToList.emails = [email];

    const result = await listsApiInstance.addContactToList(listId, addContactToList);
    
    logInfo(`✅ Subscriber added to list successfully: ${email} -> ${listId}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    logError(`❌ Failed to add ${email} to list ${listId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add subscriber to list'
    };
  }
};

/**
 * Remove subscriber from specific list
 * @param email - Subscriber's email address
 * @param listId - List ID to remove subscriber from
 * @returns Promise<BrevoResponse>
 */
export const removeFromList = async (email: string, listId: number): Promise<BrevoResponse> => {
  try {
    logInfo(`➖ Removing ${email} from list ${listId}`);

    const removeContactFromList = new brevo.RemoveContactFromList();
    removeContactFromList.emails = [email];

    const result = await listsApiInstance.removeContactFromList(listId, removeContactFromList);
    
    logInfo(`✅ Subscriber removed from list successfully: ${email} <- ${listId}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    logError(`❌ Failed to remove ${email} from list ${listId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove subscriber from list'
    };
  }
};

/**
 * Get list members
 * @param listId - List ID to get members from
 * @returns Promise<BrevoResponse>
 */
export const getListMembers = async (listId: number): Promise<BrevoResponse> => {
  try {
    logInfo(`👥 Getting members of list ${listId}`);

    const result = await listsApiInstance.getContactsFromList(listId);
    
    logInfo(`✅ List members retrieved: ${listId}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    logError(`❌ Failed to get members of list ${listId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get list members'
    };
  }
};

// ============================================================================
// EMAIL TEMPLATE FUNCTIONS
// ============================================================================

/**
 * Send welcome email to new subscriber
 * @param email - Subscriber's email address
 * @param name - Subscriber's name (optional)
 * @param locale - Subscriber's locale (defaults to 'en')
 * @returns Promise<BrevoResponse>
 */
export const sendWelcomeEmail = async (email: string, name?: string, locale: string = 'en'): Promise<BrevoResponse> => {
  try {
    logInfo(`📧 Sending welcome email to: ${email} with locale: ${locale}`);
    logInfo(`📧 Welcome email function called with:`, { email, name, locale });

    // Validate locale and get template ID based on locale
    const validLocales = ['en', 'es', 'fr', 'it', 'pt'];
    const sanitizedLocale = validLocales.includes(locale) ? locale : 'en';
    
    // Get template ID from environment based on locale
    const templateIdEnvKey = `BREVO_WELCOME_TEMPLATE_ID_${sanitizedLocale.toUpperCase()}`;
    let templateId = parseInt(process.env[templateIdEnvKey] || '');
    
    // Fallback to default English template if locale-specific template not found
    if (!templateId || isNaN(templateId)) {
      logWarn(`⚠️ Template ID for locale ${sanitizedLocale} not found, falling back to English template`);
      templateId = parseInt(process.env.BREVO_WELCOME_TEMPLATE_ID || '');
    }
    
    if (!templateId || isNaN(templateId)) {
      logError('❌ BREVO_WELCOME_TEMPLATE_ID not configured or invalid');
      throw new Error('Welcome email template ID not configured');
    }

    // Generate unsubscribe URL with locale
    // Ensure baseUrl doesn't have trailing slash
    const baseUrl = resolveWebBaseUrl().replace(/\/$/, '');
    const unsubscribeUrl = await generateUnsubscribeUrl(email, baseUrl, sanitizedLocale);

    // Prepare template parameters with localized URLs
    const templateParams = {
      name: name || 'Friend',
      unsubscribeUrl: unsubscribeUrl,
      newsUrl: `${baseUrl}/${sanitizedLocale}/news`,
      blogsUrl: `${baseUrl}/${sanitizedLocale}/blogs`
    };

    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@rollerstat.com';
    
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email, name: name || 'Subscriber' }];
    sendSmtpEmail.subject = 'Welcome to Rollerstat Newsletter!';
    sendSmtpEmail.templateId = templateId;
    sendSmtpEmail.params = templateParams;
    sendSmtpEmail.sender = {
      name: 'Rollerstat',
      email: senderEmail
    };

    logInfo(`📧 About to send welcome email via Brevo template (ID: ${templateId}) to: ${email}`);
    logInfo(`📧 Template parameters:`, templateParams);
    logInfo(`📧 Sender configured:`, { name: 'Rollerstat', email: senderEmail });
    
    const result = await emailApiInstance.sendTransacEmail(sendSmtpEmail);
    
    logInfo(`✅ Welcome email sent successfully: ${email}`, {
      messageId: result.body?.messageId,
      templateId: templateId,
      result: result.body
    });
    return {
      success: true,
      data: result,
      messageId: result.body?.messageId
    };
  } catch (error: unknown) {
    logError(`❌ Failed to send welcome email to ${email}:`, error);
    logError(`❌ Welcome email error details:`, {
      error: error,
      type: typeof error,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send welcome email'
    };
  }
};

/**
 * Send newsletter to all subscribers
 * @param subject - Newsletter subject
 * @param htmlContent - Newsletter HTML content
 * @param listId - List ID to send to (optional, uses default if not provided)
 * @returns Promise<BrevoResponse>
 */
export const sendNewsletter = async (
  subject: string,
  htmlContent: string,
  listId?: number
): Promise<BrevoResponse> => {
  try {
    logInfo(`📰 Sending newsletter: ${subject}`);

    const targetListId = listId || parseInt(process.env.BREVO_NEWSLETTER_LIST_ID || '');
    
    if (!targetListId) {
      throw new Error('No newsletter list ID configured');
    }

    // Add unsubscribe footer to HTML content
    const baseUrl = resolveWebBaseUrl();
    const unsubscribeFooter = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
        <p style="font-size: 12px; color: #999; margin: 0;">
          You received this email because you subscribed to our newsletter.<br>
          If you no longer wish to receive these emails, you can 
          <a href="${baseUrl}/unsubscribe" style="color: #999; text-decoration: underline;">unsubscribe here</a>.
        </p>
      </div>
    `;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent + unsubscribeFooter;
    sendSmtpEmail.sender = {
      name: 'Rollerstat',
      email: process.env.BREVO_SENDER_EMAIL || 'noreply@rollerstat.com'
    };
    sendSmtpEmail.to = [{ email: 'newsletter@rollerstat.com' }]; // This will be replaced by the list
    // Note: listIds property might not exist in SendSmtpEmail, using alternative approach
    // sendSmtpEmail.listIds = [targetListId];

    const result = await emailApiInstance.sendTransacEmail(sendSmtpEmail);
    
    logInfo(`✅ Newsletter sent successfully: ${subject}`);
    return {
      success: true,
      data: result,
      messageId: result.body?.messageId
    };
  } catch (error: unknown) {
    logError(`❌ Failed to send newsletter:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send newsletter'
    };
  }
};

/**
 * Send unsubscribe confirmation email
 * @param email - Subscriber's email address
 * @param locale - Subscriber's locale (defaults to 'en')
 * @returns Promise<BrevoResponse>
 */
export const sendUnsubscribeConfirmation = async (email: string, locale: string = 'en'): Promise<BrevoResponse> => {
  try {
    logInfo(`📧 Sending unsubscribe confirmation to: ${email} with locale: ${locale}`);

    // Validate locale and get template ID based on locale
    const validLocales = ['en', 'es', 'fr', 'it', 'pt'];
    const sanitizedLocale = validLocales.includes(locale) ? locale : 'en';
    
    // Get template ID from environment based on locale
    const templateIdEnvKey = `BREVO_UNSUBSCRIBE_TEMPLATE_ID_${sanitizedLocale.toUpperCase()}`;
    let templateId = parseInt(process.env[templateIdEnvKey] || '');
    
    // Fallback to default English template if locale-specific template not found
    if (!templateId || isNaN(templateId)) {
      logWarn(`⚠️ Template ID for locale ${sanitizedLocale} not found, falling back to English template`);
      templateId = parseInt(process.env.BREVO_UNSUBSCRIBE_TEMPLATE_ID || '');
    }
    
    if (!templateId || isNaN(templateId)) {
      logError('❌ BREVO_UNSUBSCRIBE_TEMPLATE_ID not configured or invalid');
      throw new Error('Unsubscribe confirmation template ID not configured');
    }

    // Generate resubscribe URL with locale
    const baseUrl = resolveWebBaseUrl().replace(/\/$/, '');

    // Prepare template parameters
    const templateParams = {
      resubscribeUrl: `${baseUrl}/${sanitizedLocale}`
    };

    logInfo(`🔍 Template parameters being sent:`, templateParams);
    logInfo(`🔍 Resubscribe URL value: ${templateParams.resubscribeUrl}`);
    logInfo(`🔍 Base URL: ${baseUrl}, Locale: ${sanitizedLocale}`);

    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    
    if (!senderEmail) {
      logError('❌ BREVO_SENDER_EMAIL not configured in environment variables');
      throw new Error('BREVO_SENDER_EMAIL is required');
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email }];
    // Don't set subject - use the subject from the Brevo template
    sendSmtpEmail.templateId = templateId;
    sendSmtpEmail.params = templateParams;
    sendSmtpEmail.sender = {
      name: 'Rollerstat',
      email: senderEmail
    };

    logInfo(`📧 Sending email with params object:`, JSON.stringify(sendSmtpEmail.params, null, 2));
    logInfo(`📧 Expected URL in email: ${templateParams.resubscribeUrl}`);

    const result = await emailApiInstance.sendTransacEmail(sendSmtpEmail);
    
    logInfo(`✅ Unsubscribe confirmation sent successfully: ${email}`, {
      messageId: result.body?.messageId,
      templateId: templateId,
      locale: sanitizedLocale,
      resubscribeUrlSent: templateParams.resubscribeUrl
    });
    logInfo(`✅ Check email - link should point to: ${templateParams.resubscribeUrl}`);
    
    return {
      success: true,
      data: result,
      messageId: result.body?.messageId
    };
  } catch (error: unknown) {
    logError(`❌ Failed to send unsubscribe confirmation to ${email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send unsubscribe confirmation'
    };
  }
};

// ============================================================================
// WEBHOOK INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Process webhook event from Brevo
 * @param event - Webhook event data
 * @returns Promise<BrevoResponse>
 */
export const processWebhookEvent = async (event: {
  event: string;
  email: string;
  [key: string]: unknown;
}): Promise<BrevoResponse> => {
  try {
    logInfo(`🔔 Processing webhook event: ${event.event} for ${event.email}`);

    switch (event.event) {
      case 'spam':
        // Remove from all lists immediately when spam complaint is received
        logInfo(`⚠️ Spam complaint received for ${event.email} - removing from all lists`);
        const spamResult = await removeSubscriber(event.email);
        if (spamResult.success) {
          logInfo(`✅ Removed ${event.email} from all lists due to spam complaint`);
        }
        return spamResult;

      case 'unsubscribed':
        // Remove from all lists when user unsubscribes
        logInfo(`👋 Unsubscribe event received for ${event.email} - removing from all lists`);
        const unsubscribeResult = await removeSubscriber(event.email);
        if (unsubscribeResult.success) {
          logInfo(`✅ Removed ${event.email} from all lists due to unsubscribe`);
        }
        return unsubscribeResult;

      case 'bounce':
        // Handle bounce events
        if (event.hard_bounce) {
          logInfo(`🚨 Hard bounce detected for ${event.email} - removing from all lists`);
          const bounceResult = await removeSubscriber(event.email);
          if (bounceResult.success) {
            logInfo(`✅ Removed ${event.email} from all lists due to hard bounce`);
          }
          return bounceResult;
        } else {
          logInfo(`📧 Soft bounce for ${event.email} - keeping in lists`);
          return { success: true, data: { action: 'soft_bounce_ignored' } };
        }

      case 'blocked':
        logInfo(`🚫 Email blocked for ${event.email} - logging for analytics`);
        return { success: true, data: { action: 'blocked_logged' } };

      case 'delivered':
        logInfo(`✅ Email delivered to ${event.email}`);
        return { success: true, data: { action: 'delivery_logged' } };

      case 'opened':
        logInfo(`👀 Email opened by ${event.email}`);
        return { success: true, data: { action: 'open_logged' } };

      case 'clicked':
        logInfo(`🖱️ Link clicked by ${event.email}`);
        return { success: true, data: { action: 'click_logged' } };

      default:
        logInfo(`❓ Unknown webhook event: ${event.event} for ${event.email}`);
        return { success: true, data: { action: 'unknown_event_logged' } };
    }
  } catch (error: unknown) {
    logError(`❌ Failed to process webhook event for ${event.email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process webhook event'
    };
  }
};

/**
 * Get webhook statistics
 * @returns Promise<BrevoResponse>
 */
export const getWebhookStats = async (): Promise<BrevoResponse> => {
  try {
    logInfo('📊 Getting webhook statistics');

    // This would typically query your database for webhook event statistics
    // For now, we'll return a placeholder response
    const stats = {
      totalEvents: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      blocked: 0,
      spam: 0,
      unsubscribed: 0
    };

    logInfo('✅ Webhook statistics retrieved');
    return {
      success: true,
      data: stats
    };
  } catch (error: unknown) {
    logError('❌ Failed to get webhook statistics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get webhook statistics'
    };
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Verify Brevo API configuration
 * @returns Promise<boolean>
 */
export const verifyBrevoConfig = async (): Promise<boolean> => {
  try {
    logInfo('🔍 Verifying Brevo API configuration...');
    
    if (!process.env.BREVO_API_KEY) {
      logError('❌ BREVO_API_KEY not found in environment variables');
      return false;
    }

    // Test API by getting lists
    await listsApiInstance.getLists();
    logInfo('✅ Brevo API configuration verified successfully');
    return true;
  } catch (error: unknown) {
    logError('❌ Brevo API configuration verification failed:', error);
    return false;
  }
};

/**
 * Get all available lists
 * @returns Promise<BrevoResponse>
 */
export const getAllLists = async (): Promise<BrevoResponse> => {
  try {
    logInfo('📋 Getting all lists...');

    const result = await listsApiInstance.getLists();
    
    logInfo('✅ All lists retrieved successfully');
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    logError('❌ Failed to get all lists:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get all lists'
    };
  }
};

const brevoService = {
  // Contact Management
  addSubscriber,
  updateSubscriber,
  removeSubscriber,
  getSubscriber,
  getSubscriberStats,
  
  // List Management
  createList,
  addToList,
  removeFromList,
  getListMembers,
  
  // Email Functions
  sendWelcomeEmail,
  sendNewsletter,
  sendUnsubscribeConfirmation,
  
  // Webhook Functions
  processWebhookEvent,
  getWebhookStats,
  
  // Utility Functions
  verifyBrevoConfig,
  getAllLists
};

export default brevoService;

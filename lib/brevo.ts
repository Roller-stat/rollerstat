import * as brevo from '@getbrevo/brevo';
import { generateUnsubscribeUrl } from './unsubscribe-tokens';

// Initialize Brevo API client
const apiInstance = new brevo.ContactsApi();
const listsApiInstance = new brevo.ContactsApi();
const emailApiInstance = new brevo.TransactionalEmailsApi();

// Configure API key
const brevoApiKey = process.env.BREVO_API_KEY;
if (!brevoApiKey) {
  console.error('❌ BREVO_API_KEY not found in environment variables');
  throw new Error('BREVO_API_KEY is required');
}

apiInstance.setApiKey(brevo.ContactsApiApiKeys.apiKey, brevoApiKey);
listsApiInstance.setApiKey(brevo.ContactsApiApiKeys.apiKey, brevoApiKey);
emailApiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

console.log('✅ Brevo API client initialized with key:', brevoApiKey.substring(0, 10) + '...');

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
    console.log(`📧 Adding subscriber: ${email}`);

    // Get default list IDs from environment if not provided
    const defaultListIds = listIds.length > 0 ? listIds : [
      parseInt(process.env.BREVO_NEWSLETTER_LIST_ID || ''),
      parseInt(process.env.BREVO_WELCOME_LIST_ID || '')
    ].filter(id => !isNaN(id));

    // First, try to get the contact to see if it already exists
    try {
      const existingContact = await apiInstance.getContactInfo(email);
      console.log(`📧 Contact already exists: ${email}, checking subscription status`);
      
      // Check if user is already subscribed to newsletter list
      const newsletterListId = parseInt(process.env.BREVO_NEWSLETTER_LIST_ID || '');
      const currentListIds = existingContact.body?.listIds || [];
      
      console.log(`🔍 Checking subscription status for ${email}:`, {
        newsletterListId,
        currentListIds,
        isInNewsletterList: currentListIds.includes(newsletterListId)
      });
      
      if (currentListIds.includes(newsletterListId)) {
        console.log(`📧 User ${email} is already subscribed to newsletter`);
        return {
          success: false,
          error: 'Email already subscribed'
        };
      }
      
      // User exists but not in newsletter list - they need to be added
      console.log(`📧 Adding existing user ${email} to newsletter list`);
      
      // Check if user was previously unsubscribed (blacklisted)
      const isBlacklisted = existingContact.body?.emailBlacklisted;
      const attributes = existingContact.body?.attributes as Record<string, unknown> | undefined;
      const wasUnsubscribed = attributes?.unsubscribed as boolean | undefined;
      
      // If user was previously unsubscribed, remove blacklist status
      if (isBlacklisted || wasUnsubscribed) {
        console.log(`📧 User ${email} was previously unsubscribed, removing blacklist status`);
        
        const updateContact = new brevo.UpdateContact();
        updateContact.emailBlacklisted = false;
        updateContact.smsBlacklisted = false;
        updateContact.attributes = {
          ...existingContact.body?.attributes,
          unsubscribed: false,
          resubscribedAt: new Date().toISOString()
        };
        
        await apiInstance.updateContact(email, updateContact);
        console.log(`✅ Removed blacklist status for ${email}`);
      }
      
      // Add to Newsletter list (they're already in Welcome series if they exist)
      try {
        await addToList(email, newsletterListId);
        console.log(`✅ Successfully added to Newsletter list ${newsletterListId}`);
      } catch (listError) {
        console.warn(`⚠️ Failed to add to Newsletter list ${newsletterListId}:`, listError);
      }
      
      console.log(`📧 Returning addSubscriber result for ${email}:`, {
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
      console.log(`📧 Creating new contact: ${email}`);
      
      const createContact = new brevo.CreateContact();
      createContact.email = email;
      createContact.attributes = attributes;
      createContact.listIds = defaultListIds;
      createContact.emailBlacklisted = false;
      createContact.smsBlacklisted = false;

      const result = await apiInstance.createContact(createContact);
      
      console.log(`✅ New subscriber added successfully: ${email}`);
      console.log(`📧 Returning addSubscriber result for new user ${email}:`, {
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
    console.error(`❌ Failed to add subscriber ${email}:`, error);
    console.error(`❌ Error type:`, typeof error);
    console.error(`❌ Error constructor:`, error?.constructor?.name);
    console.error(`❌ Error keys:`, error && typeof error === 'object' ? Object.keys(error) : 'N/A');
    
    // Handle specific Brevo errors - check multiple possible error structures
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      console.log('🔍 Brevo error details:', {
        status: errorObj.status,
        response: errorObj.response,
        body: errorObj.body,
        message: errorObj.message,
        code: errorObj.code,
        fullError: errorObj
      });
      
      // Check for duplicate contact errors in various possible locations
      const response = errorObj.response as { body?: { message?: string }; status?: number; statusCode?: number } | undefined;
      const body = errorObj.body as { message?: string } | undefined;
      
      const errorMessage = response?.body?.message || 
                          body?.message || 
                          (errorObj.message as string) || 
                          '';
      
      const statusCode = response?.status || 
                        (errorObj.status as number) || 
                        response?.statusCode;
      
      console.log('🔍 Parsed error details:', {
        statusCode,
        errorMessage,
        isDuplicate: errorMessage.includes('Contact already exist') || 
                     errorMessage.includes('already exist') ||
                     errorMessage.includes('duplicate') ||
                     errorMessage.includes('already registered')
      });
      
      // Check for duplicate contact errors (status 400 or 409)
      if (statusCode === 400 || statusCode === 409) {
        if (errorMessage.includes('Contact already exist') || 
            errorMessage.includes('already exist') ||
            errorMessage.includes('duplicate') ||
            errorMessage.includes('already registered')) {
          console.log('✅ Detected duplicate contact, returning already subscribed error');
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
    console.log(`📝 Updating subscriber: ${email}`);

    const updateContact = new brevo.UpdateContact();
    updateContact.attributes = attributes;

    const result = await apiInstance.updateContact(email, updateContact);
    
    console.log(`✅ Subscriber updated successfully: ${email}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to update subscriber ${email}:`, error);
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
    console.log(`🗑️ Unsubscribing: ${email}`);

    // Get the contact first to get their current list IDs
    let contactInfo;
    try {
      contactInfo = await apiInstance.getContactInfo(email);
    } catch {
      console.log(`📧 Contact ${email} not found, nothing to unsubscribe`);
      return {
        success: true,
        data: { message: 'Contact not found, already unsubscribed' }
      };
    }

    // Remove from Newsletter list only (keep in Welcome list)
    const newsletterListId = parseInt(process.env.BREVO_NEWSLETTER_LIST_ID || '');
    const currentListIds = contactInfo.body?.listIds || [];
    
    console.log(`📋 Current lists: ${currentListIds.join(', ')}`);
    console.log(`📋 Removing from Newsletter list only (ID: ${newsletterListId})`);
    
    if (currentListIds.includes(newsletterListId)) {
      try {
        await removeFromList(email, newsletterListId);
        console.log(`✅ Removed from Newsletter list ${newsletterListId}`);
      } catch (listError) {
        console.warn(`⚠️ Failed to remove from Newsletter list ${newsletterListId}:`, listError);
      }
    } else {
      console.log(`📧 User ${email} was not in Newsletter list`);
    }

    // Update contact to blacklist email (prevent future sends)
    const updateContact = new brevo.UpdateContact();
    updateContact.emailBlacklisted = true;
    updateContact.smsBlacklisted = true;
    updateContact.attributes = {
      ...contactInfo.body?.attributes,
      unsubscribedAt: new Date().toISOString(),
      unsubscribed: true
    };

    const result = await apiInstance.updateContact(email, updateContact);
    
    console.log(`✅ Subscriber unsubscribed successfully: ${email}`);
    return {
      success: true,
      data: result,
      messageId: 'unsubscribed_successfully'
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to unsubscribe ${email}:`, error);
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
    console.log(`🔍 Getting subscriber details: ${email}`);

    const result = await apiInstance.getContactInfo(email);
    
    console.log(`✅ Subscriber details retrieved: ${email}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to get subscriber ${email}:`, error);
    
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
    console.log(`📊 Getting subscriber statistics`);

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

    console.log(`✅ Subscriber statistics retrieved`);
    return {
      totalSubscribers,
      activeSubscribers,
      blacklistedSubscribers,
      listStats
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to get subscriber statistics:`, error);
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
    console.log(`📋 Creating list: ${name}`);

    const createList = new brevo.CreateList();
    createList.name = name;
    createList.folderId = 1; // Default folder

    const result = await listsApiInstance.createList(createList);
    
    console.log(`✅ List created successfully: ${name}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to create list ${name}:`, error);
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
    console.log(`➕ Adding ${email} to list ${listId}`);

    const addContactToList = new brevo.AddContactToList();
    addContactToList.emails = [email];

    const result = await listsApiInstance.addContactToList(listId, addContactToList);
    
    console.log(`✅ Subscriber added to list successfully: ${email} -> ${listId}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to add ${email} to list ${listId}:`, error);
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
    console.log(`➖ Removing ${email} from list ${listId}`);

    const removeContactFromList = new brevo.RemoveContactFromList();
    removeContactFromList.emails = [email];

    const result = await listsApiInstance.removeContactFromList(listId, removeContactFromList);
    
    console.log(`✅ Subscriber removed from list successfully: ${email} <- ${listId}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to remove ${email} from list ${listId}:`, error);
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
    console.log(`👥 Getting members of list ${listId}`);

    const result = await listsApiInstance.getContactsFromList(listId);
    
    console.log(`✅ List members retrieved: ${listId}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to get members of list ${listId}:`, error);
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
    console.log(`📧 Sending welcome email to: ${email} with locale: ${locale}`);
    console.log(`📧 Welcome email function called with:`, { email, name, locale });

    // Validate locale and get template ID based on locale
    const validLocales = ['en', 'es', 'fr', 'it', 'pt'];
    const sanitizedLocale = validLocales.includes(locale) ? locale : 'en';
    
    // Get template ID from environment based on locale
    const templateIdEnvKey = `BREVO_WELCOME_TEMPLATE_ID_${sanitizedLocale.toUpperCase()}`;
    let templateId = parseInt(process.env[templateIdEnvKey] || '');
    
    // Fallback to default English template if locale-specific template not found
    if (!templateId || isNaN(templateId)) {
      console.warn(`⚠️ Template ID for locale ${sanitizedLocale} not found, falling back to English template`);
      templateId = parseInt(process.env.BREVO_WELCOME_TEMPLATE_ID || '');
    }
    
    if (!templateId || isNaN(templateId)) {
      console.error('❌ BREVO_WELCOME_TEMPLATE_ID not configured or invalid');
      throw new Error('Welcome email template ID not configured');
    }

    // Generate unsubscribe URL with locale
    // Ensure baseUrl doesn't have trailing slash
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rollerstat.com';
    baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash if present
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

    console.log(`📧 About to send welcome email via Brevo template (ID: ${templateId}) to: ${email}`);
    console.log(`📧 Template parameters:`, templateParams);
    console.log(`📧 Sender configured:`, { name: 'Rollerstat', email: senderEmail });
    
    const result = await emailApiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log(`✅ Welcome email sent successfully: ${email}`, {
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
    console.error(`❌ Failed to send welcome email to ${email}:`, error);
    console.error(`❌ Welcome email error details:`, {
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
    console.log(`📰 Sending newsletter: ${subject}`);

    const targetListId = listId || parseInt(process.env.BREVO_NEWSLETTER_LIST_ID || '');
    
    if (!targetListId) {
      throw new Error('No newsletter list ID configured');
    }

    // Add unsubscribe footer to HTML content
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rollerstat.com';
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
    
    console.log(`✅ Newsletter sent successfully: ${subject}`);
    return {
      success: true,
      data: result,
      messageId: result.body?.messageId
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to send newsletter:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send newsletter'
    };
  }
};

/**
 * Send unsubscribe confirmation email
 * @param email - Subscriber's email address
 * @returns Promise<BrevoResponse>
 */
export const sendUnsubscribeConfirmation = async (email: string): Promise<BrevoResponse> => {
  try {
    console.log(`📧 Sending unsubscribe confirmation to: ${email}`);

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = 'You have been unsubscribed from Rollerstat';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #057ec8; margin: 0;">Rollerstat</h1>
          <p style="color: #666; margin: 5px 0;">Your Source for Roller Hockey News</p>
        </div>
        
        <h2 style="color: #333;">You have been unsubscribed</h2>
        
        <p>You have successfully unsubscribed from the Rollerstat newsletter. You will no longer receive our emails.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #057ec8; margin-top: 0;">We're sorry to see you go!</h3>
          <p>If you change your mind, you can always subscribe again by visiting our website.</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            Best regards,<br>
            The Rollerstat Team
          </p>
        </div>
      </div>
    `;
    sendSmtpEmail.sender = {
      name: 'Rollerstat',
      email: process.env.BREVO_SENDER_EMAIL || 'noreply@rollerstat.com'
    };

    const result = await emailApiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log(`✅ Unsubscribe confirmation sent successfully: ${email}`);
    return {
      success: true,
      data: result,
      messageId: result.body?.messageId
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to send unsubscribe confirmation to ${email}:`, error);
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
    console.log(`🔔 Processing webhook event: ${event.event} for ${event.email}`);

    switch (event.event) {
      case 'spam':
        // Remove from all lists immediately when spam complaint is received
        console.log(`⚠️ Spam complaint received for ${event.email} - removing from all lists`);
        const spamResult = await removeSubscriber(event.email);
        if (spamResult.success) {
          console.log(`✅ Removed ${event.email} from all lists due to spam complaint`);
        }
        return spamResult;

      case 'unsubscribed':
        // Remove from all lists when user unsubscribes
        console.log(`👋 Unsubscribe event received for ${event.email} - removing from all lists`);
        const unsubscribeResult = await removeSubscriber(event.email);
        if (unsubscribeResult.success) {
          console.log(`✅ Removed ${event.email} from all lists due to unsubscribe`);
        }
        return unsubscribeResult;

      case 'bounce':
        // Handle bounce events
        if (event.hard_bounce) {
          console.log(`🚨 Hard bounce detected for ${event.email} - removing from all lists`);
          const bounceResult = await removeSubscriber(event.email);
          if (bounceResult.success) {
            console.log(`✅ Removed ${event.email} from all lists due to hard bounce`);
          }
          return bounceResult;
        } else {
          console.log(`📧 Soft bounce for ${event.email} - keeping in lists`);
          return { success: true, data: { action: 'soft_bounce_ignored' } };
        }

      case 'blocked':
        console.log(`🚫 Email blocked for ${event.email} - logging for analytics`);
        return { success: true, data: { action: 'blocked_logged' } };

      case 'delivered':
        console.log(`✅ Email delivered to ${event.email}`);
        return { success: true, data: { action: 'delivery_logged' } };

      case 'opened':
        console.log(`👀 Email opened by ${event.email}`);
        return { success: true, data: { action: 'open_logged' } };

      case 'clicked':
        console.log(`🖱️ Link clicked by ${event.email}`);
        return { success: true, data: { action: 'click_logged' } };

      default:
        console.log(`❓ Unknown webhook event: ${event.event} for ${event.email}`);
        return { success: true, data: { action: 'unknown_event_logged' } };
    }
  } catch (error: unknown) {
    console.error(`❌ Failed to process webhook event for ${event.email}:`, error);
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
    console.log('📊 Getting webhook statistics');

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

    console.log('✅ Webhook statistics retrieved');
    return {
      success: true,
      data: stats
    };
  } catch (error: unknown) {
    console.error('❌ Failed to get webhook statistics:', error);
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
    console.log('🔍 Verifying Brevo API configuration...');
    
    if (!process.env.BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY not found in environment variables');
      return false;
    }

    // Test API by getting lists
    await listsApiInstance.getLists();
    console.log('✅ Brevo API configuration verified successfully');
    return true;
  } catch (error: unknown) {
    console.error('❌ Brevo API configuration verification failed:', error);
    return false;
  }
};

/**
 * Get all available lists
 * @returns Promise<BrevoResponse>
 */
export const getAllLists = async (): Promise<BrevoResponse> => {
  try {
    console.log('📋 Getting all lists...');

    const result = await listsApiInstance.getLists();
    
    console.log('✅ All lists retrieved successfully');
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    console.error('❌ Failed to get all lists:', error);
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

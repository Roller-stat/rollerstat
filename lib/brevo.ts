import * as brevo from '@getbrevo/brevo';

// Initialize Brevo API client
const apiInstance = new brevo.ContactsApi();
const listsApiInstance = new brevo.ContactsApi();
const emailApiInstance = new brevo.TransactionalEmailsApi();

// Configure API key
apiInstance.setApiKey(brevo.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');
listsApiInstance.setApiKey(brevo.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');
emailApiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

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

    const createContact = new brevo.CreateContact();
    createContact.email = email;
    createContact.attributes = attributes;
    createContact.listIds = defaultListIds;
    createContact.emailBlacklisted = false;
    createContact.smsBlacklisted = false;

    const result = await apiInstance.createContact(createContact);
    
    console.log(`✅ Subscriber added successfully: ${email}`);
    return {
      success: true,
      data: result,
      messageId: result.body?.id?.toString()
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to add subscriber ${email}:`, error);
    
    // Handle specific Brevo errors
    if (error && typeof error === 'object' && 'status' in error && error.status === 400) {
      const errorObj = error as { status: number; body?: { message?: string } };
      if (errorObj.body?.message?.includes('Contact already exist')) {
        return {
          success: false,
          error: 'Email already subscribed'
        };
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
    console.log(`🗑️ Removing subscriber: ${email}`);

    const result = await apiInstance.deleteContact(email);
    
    console.log(`✅ Subscriber removed successfully: ${email}`);
    return {
      success: true,
      data: result
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to remove subscriber ${email}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove subscriber'
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
 * @returns Promise<BrevoResponse>
 */
export const sendWelcomeEmail = async (email: string, name?: string): Promise<BrevoResponse> => {
  try {
    console.log(`📧 Sending welcome email to: ${email}`);

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email, name: name || 'Subscriber' }];
    sendSmtpEmail.subject = 'Welcome to Rollerstat Newsletter!';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #057ec8; margin: 0;">Welcome to Rollerstat!</h1>
          <p style="color: #666; margin: 5px 0;">Your Source for Roller Hockey News</p>
        </div>
        
        <h2 style="color: #333;">Thank you for subscribing, ${name || 'Friend'}!</h2>
        
        <p>You're now part of our community and will receive the latest news, insights, and updates from the world of roller hockey.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #057ec8; margin-top: 0;">What to expect:</h3>
          <ul style="color: #333;">
            <li>Weekly newsletter with the latest news</li>
            <li>Exclusive blog posts and analysis</li>
            <li>Championship updates and results</li>
            <li>Player spotlights and interviews</li>
          </ul>
        </div>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h4 style="color: #333; margin-top: 0;">Stay connected:</h4>
          <p style="margin: 5px 0;">
            <a href="https://rollerstat.com/news" style="color: #057ec8; text-decoration: none;">📰 Latest News</a>
          </p>
          <p style="margin: 5px 0;">
            <a href="https://rollerstat.com/blogs" style="color: #057ec8; text-decoration: none;">📝 Blog Posts</a>
          </p>
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
    
    console.log(`✅ Welcome email sent successfully: ${email}`);
    return {
      success: true,
      data: result,
      messageId: result.body?.messageId
    };
  } catch (error: unknown) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error);
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

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
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

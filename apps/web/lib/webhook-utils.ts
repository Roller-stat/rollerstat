import crypto from 'crypto';

// Webhook event types
export interface WebhookEvent {
  event: string;
  email: string;
  id?: number;
  date?: string;
  ip?: string;
  link?: string;
  tag?: string;
  reason?: string;
  blocked?: boolean;
  hard_bounce?: boolean;
  retry?: number;
  error?: string;
  [key: string]: unknown;
}

// Webhook verification result
export interface WebhookVerificationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Verify webhook signature using HMAC-SHA256
 * @param payload - Raw webhook payload
 * @param signature - Signature from x-brevo-signature header
 * @param secret - Webhook secret from environment
 * @returns WebhookVerificationResult
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult => {
  try {
    if (!secret) {
      return {
        isValid: false,
        error: 'Webhook secret not configured'
      };
    }

    if (!signature) {
      return {
        isValid: false,
        error: 'Missing webhook signature'
      };
    }

    const normalizedSignature = signature.trim().replace(/^sha256=/i, '');
    if (!/^[a-f0-9]+$/i.test(normalizedSignature)) {
      return {
        isValid: false,
        error: 'Malformed webhook signature'
      };
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    const actualBuffer = Buffer.from(normalizedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    if (actualBuffer.length !== expectedBuffer.length) {
      return {
        isValid: false,
        error: 'Invalid webhook signature'
      };
    }

    // Compare signatures using timing-safe comparison
    const isValid = crypto.timingSafeEqual(actualBuffer, expectedBuffer);

    if (!isValid) {
      return {
        isValid: false,
        error: 'Invalid webhook signature'
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    return {
      isValid: false,
      error: 'Signature verification failed'
    };
  }
};

/**
 * Parse webhook payload safely
 * @param payload - Raw webhook payload
 * @returns Parsed webhook event or error
 */
export const parseWebhookPayload = (payload: string): { success: boolean; data?: WebhookEvent; error?: string } => {
  try {
    const data = JSON.parse(payload) as WebhookEvent;
    
    // Validate required fields
    if (!data.event || !data.email) {
      return {
        success: false,
        error: 'Missing required fields: event and email'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        error: 'Invalid email format'
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('❌ Failed to parse webhook payload:', error);
    return {
      success: false,
      error: 'Invalid JSON payload'
    };
  }
};

/**
 * Log webhook event with structured logging
 * @param event - Webhook event data
 * @param action - Action being performed
 */
export const logWebhookEvent = (event: WebhookEvent, action: string): void => {
  const logData = {
    timestamp: new Date().toISOString(),
    event: event.event,
    email: event.email,
    action,
    metadata: {
      id: event.id,
      date: event.date,
      ip: event.ip,
      link: event.link,
      reason: event.reason,
      blocked: event.blocked,
      hard_bounce: event.hard_bounce,
      retry: event.retry,
      error: event.error
    }
  };

  console.log(`🔔 Webhook Event: ${event.event}`, logData);
};

/**
 * Get webhook event emoji for logging
 * @param eventType - Type of webhook event
 * @returns Emoji for the event type
 */
export const getEventEmoji = (eventType: string): string => {
  const emojiMap: { [key: string]: string } = {
    delivered: '✅',
    opened: '👀',
    clicked: '🖱️',
    bounce: '📧',
    blocked: '🚫',
    spam: '⚠️',
    unsubscribed: '👋',
    list_addition: '➕',
    list_removal: '➖',
    hard_bounce: '🚨',
    soft_bounce: '📬'
  };

  return emojiMap[eventType] || '❓';
};

/**
 * Check if event is a critical event that requires immediate action
 * @param event - Webhook event
 * @returns True if event requires immediate action
 */
export const isCriticalEvent = (event: WebhookEvent): boolean => {
  const criticalEvents = ['spam', 'hard_bounce', 'unsubscribed'];
  return criticalEvents.includes(event.event) || 
         (event.event === 'bounce' && Boolean(event.hard_bounce));
};

/**
 * Get event priority for processing
 * @param event - Webhook event
 * @returns Priority level (1 = highest, 3 = lowest)
 */
export const getEventPriority = (event: WebhookEvent): number => {
  if (isCriticalEvent(event)) {
    return 1; // High priority
  }
  
  if (['bounce', 'blocked'].includes(event.event)) {
    return 2; // Medium priority
  }
  
  return 3; // Low priority
};

/**
 * Sanitize webhook data for logging
 * @param event - Webhook event
 * @returns Sanitized event data
 */
export const sanitizeWebhookData = (event: WebhookEvent): Partial<WebhookEvent> => {
  return {
    event: event.event,
    email: event.email?.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
    id: event.id,
    date: event.date,
    reason: event.reason,
    blocked: event.blocked,
    hard_bounce: event.hard_bounce,
    retry: event.retry
  };
};

/**
 * Validate webhook environment configuration
 * @returns Validation result
 */
export const validateWebhookConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!process.env.BREVO_WEBHOOK_SECRET) {
    errors.push('BREVO_WEBHOOK_SECRET not configured');
  }

  if (!process.env.BREVO_API_KEY) {
    errors.push('BREVO_API_KEY not configured');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const webhookUtils = {
  verifyWebhookSignature,
  parseWebhookPayload,
  logWebhookEvent,
  getEventEmoji,
  isCriticalEvent,
  getEventPriority,
  sanitizeWebhookData,
  validateWebhookConfig
};

export default webhookUtils;

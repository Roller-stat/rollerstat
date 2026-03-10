import crypto from 'crypto';

// Unsubscribe token configuration
const TOKEN_EXPIRY_HOURS = 24 * 7; // 7 days

function resolveTokenSecret(): string {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET?.trim();
  if (!secret) {
    throw new Error('UNSUBSCRIBE_TOKEN_SECRET is not configured');
  }
  return secret;
}

function constantTimeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

/**
 * Generate a secure unsubscribe token for an email
 * @param email - The email address to generate token for
 * @returns Promise<string> - The unsubscribe token
 */
export const generateUnsubscribeToken = async (email: string): Promise<string> => {
  const tokenSecret = resolveTokenSecret();
  const timestamp = Date.now();
  const data = `${email}:${timestamp}`;
  
  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', tokenSecret)
    .update(data)
    .digest('hex');
  
  // Combine data and signature
  const token = Buffer.from(`${data}:${signature}`).toString('base64');
  
  return token;
};

/**
 * Verify and extract email from unsubscribe token
 * @param token - The unsubscribe token to verify
 * @returns Promise<{valid: boolean, email?: string, expired?: boolean}>
 */
export const verifyUnsubscribeToken = async (token: string): Promise<{
  valid: boolean;
  email?: string;
  expired?: boolean;
}> => {
  try {
    const tokenSecret = resolveTokenSecret();
    
    // Decode the token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    
    const parts = decoded.split(':');
    
    // Token format: email:timestamp:signature
    if (parts.length !== 3) {
      return { valid: false };
    }
    
    const [email, timestamp, signature] = parts;
    const data = `${email}:${timestamp}`;
    
    if (!email || !timestamp || !signature) {
      return { valid: false };
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', tokenSecret)
      .update(data)
      .digest('hex');

    if (!constantTimeEqual(signature, expectedSignature)) {
      return { valid: false };
    }
    
    const tokenTime = parseInt(timestamp);
    const currentTime = Date.now();
    const expiryTime = tokenTime + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    
    // Check if token is expired
    if (currentTime > expiryTime) {
      return { valid: false, expired: true };
    }

    return { valid: true, email };
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false };
  }
};

/**
 * Generate unsubscribe URL for an email
 * @param email - The email address
 * @param baseUrl - The base URL of your website
 * @param locale - The locale for the unsubscribe page (defaults to 'en')
 * @returns Promise<string> - The complete unsubscribe URL
 */
export const generateUnsubscribeUrl = async (email: string, baseUrl: string, locale: string = 'en'): Promise<string> => {
  const token = await generateUnsubscribeToken(email);
  // Ensure baseUrl doesn't have trailing slash
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/${locale}/unsubscribe?token=${token}`;
};

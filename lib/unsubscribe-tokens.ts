import crypto from 'crypto';

// Unsubscribe token configuration
const TOKEN_SECRET = process.env.UNSUBSCRIBE_TOKEN_SECRET || 'your-secret-key-change-this-in-production';
const TOKEN_EXPIRY_HOURS = 24 * 7; // 7 days

/**
 * Generate a secure unsubscribe token for an email
 * @param email - The email address to generate token for
 * @returns Promise<string> - The unsubscribe token
 */
export const generateUnsubscribeToken = async (email: string): Promise<string> => {
  const timestamp = Date.now();
  const data = `${email}:${timestamp}`;
  
  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
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
    console.log('🔍 Verifying token:', token.substring(0, 50) + '...');
    console.log('🔍 Token SECRET being used:', TOKEN_SECRET.substring(0, 10) + '...');
    
    // Decode the token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    console.log('🔍 Decoded token:', decoded);
    
    const parts = decoded.split(':');
    console.log('🔍 Token parts:', parts.length, parts);
    
    // Token format: email:timestamp:signature
    if (parts.length !== 3) {
      console.error('❌ Invalid token format: expected 3 parts, got', parts.length);
      return { valid: false };
    }
    
    const [email, timestamp, signature] = parts;
    const data = `${email}:${timestamp}`;
    
    if (!email || !timestamp || !signature) {
      console.error('❌ Missing token components:', { email: !!email, timestamp: !!timestamp, signature: !!signature });
      return { valid: false };
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(data)
      .digest('hex');
    
    console.log('🔍 Signature comparison:', {
      received: signature.substring(0, 20) + '...',
      expected: expectedSignature.substring(0, 20) + '...',
      match: signature === expectedSignature
    });
    
    if (signature !== expectedSignature) {
      console.error('❌ Signature mismatch!');
      return { valid: false };
    }
    
    const tokenTime = parseInt(timestamp);
    const currentTime = Date.now();
    const expiryTime = tokenTime + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    
    console.log('🔍 Token time check:', {
      tokenTime,
      currentTime,
      expiryTime,
      expired: currentTime > expiryTime
    });
    
    // Check if token is expired
    if (currentTime > expiryTime) {
      console.error('❌ Token expired!');
      return { valid: false, expired: true };
    }
    
    console.log('✅ Token valid for email:', email);
    return { valid: true, email };
  } catch (error) {
    console.error('❌ Token verification error:', error);
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

import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber, sendWelcomeEmail } from '@/lib/brevo';
import {
  createRateLimitResponse,
  enforceRateLimits,
  getClientIp,
  maskEmail,
  verifyTurnstileCaptcha,
} from '@/lib/request-guards';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipRateLimit = enforceRateLimits([
    { key: `subscribe:minute:${ip}`, limit: 5, windowMs: 60_000 },
  ]);

  if (!ipRateLimit.allowed) {
    return createRateLimitResponse(ipRateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const { email, firstName, lastName, locale, captchaToken } = body;

    // Basic validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedFirstName = firstName?.trim().substring(0, 50) || '';
    const sanitizedLastName = lastName?.trim().substring(0, 50) || '';

    const emailIpRateLimit = enforceRateLimits([
      {
        key: `subscribe:daily:${sanitizedEmail}:${ip}`,
        limit: 20,
        windowMs: 24 * 60 * 60 * 1000,
      },
    ]);

    if (!emailIpRateLimit.allowed) {
      return createRateLimitResponse(emailIpRateLimit.retryAfterSeconds);
    }

    const captchaResult = await verifyTurnstileCaptcha({
      request,
      token: typeof captchaToken === 'string' ? captchaToken : null,
      action: 'subscribe',
    });

    if (!captchaResult.ok) {
      return NextResponse.json(
        {
          success: false,
          error: captchaResult.error,
        },
        { status: captchaResult.status },
      );
    }

    // Validate and sanitize locale
    const validLocales = ['en', 'es', 'fr', 'it', 'pt'];
    const sanitizedLocale = locale && validLocales.includes(locale) ? locale : 'en';

    // Prepare subscriber attributes
    const attributes = {
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      subscribedAt: new Date().toISOString(),
      source: 'website',
      locale: sanitizedLocale // Store locale for future use
    };

    // Add subscriber to Brevo
    const addResult = await addSubscriber(sanitizedEmail, attributes);

    if (!addResult.success) {
      // Handle duplicate subscription
      if (addResult.error === 'Email already subscribed') {
        return NextResponse.json(
          { 
            success: false,
            error: 'This email is already subscribed to our newsletter',
            alreadySubscribed: true
          },
          { status: 409 }
        );
      }

      // Handle Brevo configuration/auth issues
      if (addResult.error === 'Brevo API key unauthorized') {
        return NextResponse.json(
          {
            success: false,
            error: 'Newsletter service is not configured correctly. Please try again later.'
          },
          { status: 503 }
        );
      }

      console.error('❌ Failed to add subscriber:', addResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to subscribe. Please try again later.'
        },
        { status: 500 }
      );
    }

    // Send welcome email only if shouldSendWelcome is true
    let welcomeEmailSent = false;
    if (addResult.shouldSendWelcome !== false) {
      const welcomeResult = await sendWelcomeEmail(sanitizedEmail, sanitizedFirstName || 'Friend', sanitizedLocale);

      if (!welcomeResult.success) {
        console.warn('⚠️ Failed to send welcome email:', welcomeResult.error);
        // Don't fail the subscription if welcome email fails
      } else {
        welcomeEmailSent = true;
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Newsletter subscription successful:', {
        email: maskEmail(sanitizedEmail),
        timestamp: new Date().toISOString(),
        welcomeEmailSent: welcomeEmailSent
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
      email: sanitizedEmail,
      welcomeEmailSent: welcomeEmailSent
    });

  } catch {
    console.error('Newsletter subscription error');
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error. Please try again later.'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Test Brevo configuration
    const { verifyBrevoConfig } = await import('@/lib/brevo');
    const isConfigured = await verifyBrevoConfig();
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Newsletter subscription endpoint is active',
      brevoConfigured: isConfigured,
      timestamp: new Date().toISOString()
    });
  } catch {
    console.error('Health check error');
    return NextResponse.json({ 
      status: 'error', 
      message: 'Newsletter subscription endpoint has issues',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { removeSubscriber, sendUnsubscribeConfirmation } from '@/lib/brevo';
import { createRateLimitResponse, enforceRateLimits, getClientIp, maskEmail } from '@/lib/request-guards';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = enforceRateLimits([
    { key: `unsubscribe:minute:${ip}`, limit: 10, windowMs: 60_000 },
  ]);

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const { email, locale, reasons, customReason } = body;

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

    // Remove subscriber from Brevo
    const removeResult = await removeSubscriber(sanitizedEmail);

    if (!removeResult.success) {
      console.error('❌ Failed to remove subscriber:', removeResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to unsubscribe. Please try again later.'
        },
        { status: 500 }
      );
    }

    // Get locale: prefer passed locale, fallback to stored locale, then default to 'en'
    const validLocales = ['en', 'es', 'fr', 'it', 'pt'];
    const passedLocale = locale && validLocales.includes(locale) ? locale : null;
    const storedLocale = (removeResult as { locale?: string }).locale;
    const subscriberLocale = passedLocale || (storedLocale && validLocales.includes(storedLocale) ? storedLocale : 'en');

    // Send unsubscribe confirmation email with locale (BEFORE blacklisting)
    const confirmationResult = await sendUnsubscribeConfirmation(sanitizedEmail, subscriberLocale);

    if (!confirmationResult.success) {
      console.warn('⚠️ Failed to send unsubscribe confirmation:', confirmationResult.error);
      // Don't fail the unsubscribe if confirmation email fails
    }

    // Do not blacklist the contact here.
    // Removing from newsletter list + unsubscribed flags is sufficient and avoids
    // suppressing the transactional unsubscribe confirmation email.
    if (process.env.NODE_ENV !== 'production') {
      console.log('Unsubscribe successful:', {
        email: maskEmail(sanitizedEmail),
        reasonCount: Array.isArray(reasons) ? reasons.length : 0,
        hasCustomReason: Boolean(customReason?.trim()),
        timestamp: new Date().toISOString(),
        confirmationEmailSent: confirmationResult.success,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      email: sanitizedEmail,
      confirmationEmailSent: confirmationResult.success
    });

  } catch {
    console.error('Unsubscribe error');
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
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Unsubscribe endpoint is active',
    timestamp: new Date().toISOString()
  });
}

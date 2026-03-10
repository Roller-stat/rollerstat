import { NextRequest, NextResponse } from 'next/server';
import { sendContactNotification, sendAutoReply, verifyEmailConfig } from '@/lib/email';
import { getSupabaseServerClient, isDatabaseConfigured } from '@/lib/db/client';
import {
  createRateLimitResponse,
  enforceRateLimits,
  getClientIp,
  maskEmail,
  verifyTurnstileCaptcha,
} from '@/lib/request-guards';

function isMissingContactTableError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false;
  }

  return (
    error.code === 'PGRST205' ||
    (error.code === '42P01' && typeof error.message === 'string' && error.message.includes('contact_submissions'))
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = enforceRateLimits([
    { key: `contact:minute:${ip}`, limit: 3, windowMs: 60_000 },
    { key: `contact:daily:${ip}`, limit: 30, windowMs: 24 * 60 * 60 * 1000 },
  ]);

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const { name, email, message, locale, captchaToken } = body;

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedData = {
      name: name.trim().substring(0, 100),
      email: email.trim().toLowerCase(),
      message: message.trim().substring(0, 2000)
    };

    const validLocales = ['en', 'es', 'fr', 'it', 'pt'];
    const sanitizedLocale =
      typeof locale === 'string' && validLocales.includes(locale)
        ? locale
        : null;

    const captchaResult = await verifyTurnstileCaptcha({
      request,
      token: typeof captchaToken === 'string' ? captchaToken : null,
      action: 'contact',
    });

    if (!captchaResult.ok) {
      return NextResponse.json(
        { error: captchaResult.error },
        { status: captchaResult.status },
      );
    }

    // Persist contact submissions in DB when available so retention automation can enforce 12-month lifecycle.
    if (isDatabaseConfigured()) {
      const client = getSupabaseServerClient();
      if (client) {
        const { error: saveError } = await client.from('contact_submissions').insert({
          name: sanitizedData.name,
          email: sanitizedData.email,
          message: sanitizedData.message,
          locale: sanitizedLocale,
          source: 'contact_form',
        });

        if (saveError && !isMissingContactTableError(saveError)) {
          console.error('Failed to persist contact submission:', saveError);
        } else if (saveError) {
          console.warn(
            'contact_submissions table is missing. Run packages/db/migrations/20260307_retention_automation.sql.',
          );
        }
      }
    }

    // Verify email configuration
    const isEmailConfigured = await verifyEmailConfig();
    if (!isEmailConfigured) {
      console.error('Email configuration error');
      return NextResponse.json(
        { error: 'Email service not configured properly' },
        { status: 500 }
      );
    }

    // Send notification to site owner
    const notificationResult = await sendContactNotification(sanitizedData);
    if (!notificationResult.success) {
      console.error('Failed to send notification');
      return NextResponse.json(
        { error: 'Failed to send notification email' },
        { status: 500 }
      );
    }

    // Send auto-reply to user
    const autoReplyResult = await sendAutoReply(sanitizedData.email, sanitizedData.name);
    if (!autoReplyResult.success) {
      console.warn('Failed to send auto-reply:', autoReplyResult.error);
      // Don't fail the request if auto-reply fails, just log it
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Contact form submission processed successfully:', {
        nameLength: sanitizedData.name.length,
        email: maskEmail(sanitizedData.email),
        timestamp: new Date().toISOString(),
        notificationSent: notificationResult.success,
        autoReplySent: autoReplyResult.success,
      });
    }

    return NextResponse.json(
      { 
        message: 'Contact form submitted successfully',
        notificationSent: notificationResult.success,
        autoReplySent: autoReplyResult.success
      },
      { status: 200 }
    );

  } catch {
    console.error('Contact form error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

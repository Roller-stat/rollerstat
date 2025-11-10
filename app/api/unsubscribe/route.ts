import { NextRequest, NextResponse } from 'next/server';
import { removeSubscriber, sendUnsubscribeConfirmation } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    console.log('👋 Processing unsubscribe request');

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
    console.log(`🗑️ Removing subscriber: ${sanitizedEmail}`);
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
    
    console.log(`🌍 Locale for unsubscribe confirmation:`, {
      passedLocale,
      storedLocale,
      finalLocale: subscriberLocale
    });

    // Send unsubscribe confirmation email with locale (BEFORE blacklisting)
    const confirmationResult = await sendUnsubscribeConfirmation(sanitizedEmail, subscriberLocale);

    if (!confirmationResult.success) {
      console.warn('⚠️ Failed to send unsubscribe confirmation:', confirmationResult.error);
      // Don't fail the unsubscribe if confirmation email fails
    }

    // NOW blacklist the email AFTER sending confirmation email
    try {
      const brevo = await import('@getbrevo/brevo');
      const apiKey = process.env.BREVO_API_KEY;
      if (!apiKey) {
        throw new Error('BREVO_API_KEY not configured');
      }
      
      const contactsApi = new brevo.ContactsApi();
      contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);
      
      const updateContactObj = new brevo.UpdateContact();
      updateContactObj.emailBlacklisted = true;
      updateContactObj.smsBlacklisted = true;
      
      await contactsApi.updateContact(sanitizedEmail, updateContactObj);
      console.log(`✅ Email blacklisted after confirmation sent: ${sanitizedEmail}`);
    } catch (blacklistError) {
      console.warn('⚠️ Failed to blacklist email after confirmation:', blacklistError);
      // Don't fail - email was already unsubscribed
    }

    console.log('✅ Unsubscribe successful:', {
      email: sanitizedEmail,
      reasons: reasons || [],
      customReason: customReason || '',
      timestamp: new Date().toISOString(),
      confirmationEmailSent: confirmationResult.success
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      email: sanitizedEmail,
      confirmationEmailSent: confirmationResult.success
    });

  } catch (error) {
    console.error('❌ Unsubscribe error:', error);
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

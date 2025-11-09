import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber, sendWelcomeEmail } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Processing newsletter subscription request');

    const body = await request.json();
    const { email, firstName, lastName, locale } = body;

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
    console.log(`📝 Adding subscriber: ${sanitizedEmail}`);
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
    console.log(`🔍 Welcome email decision for ${sanitizedEmail}:`, {
      shouldSendWelcome: addResult.shouldSendWelcome,
      condition: addResult.shouldSendWelcome !== false
    });
    
    if (addResult.shouldSendWelcome !== false) {
      console.log(`📧 Sending welcome email to: ${sanitizedEmail} with locale: ${sanitizedLocale}`);
      const welcomeResult = await sendWelcomeEmail(sanitizedEmail, sanitizedFirstName || 'Friend', sanitizedLocale);

      if (!welcomeResult.success) {
        console.warn('⚠️ Failed to send welcome email:', welcomeResult.error);
        // Don't fail the subscription if welcome email fails
      } else {
        welcomeEmailSent = true;
        console.log(`✅ Welcome email sent successfully to: ${sanitizedEmail}`);
      }
    } else {
      console.log(`📧 Skipping welcome email for ${sanitizedEmail} - shouldSendWelcome is false`);
    }

    console.log('✅ Newsletter subscription successful:', {
      email: sanitizedEmail,
      firstName: sanitizedFirstName,
      timestamp: new Date().toISOString(),
      welcomeEmailSent: welcomeEmailSent
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
      email: sanitizedEmail,
      welcomeEmailSent: welcomeEmailSent
    });

  } catch (error) {
    console.error('❌ Newsletter subscription error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
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
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Newsletter subscription endpoint has issues',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

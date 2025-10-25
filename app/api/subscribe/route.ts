import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber, sendWelcomeEmail } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Processing newsletter subscription request');

    const body = await request.json();
    const { email, firstName, lastName } = body;

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

    // Prepare subscriber attributes
    const attributes = {
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      subscribedAt: new Date().toISOString(),
      source: 'website'
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

    // Send welcome email
    console.log(`📧 Sending welcome email to: ${sanitizedEmail}`);
    const welcomeResult = await sendWelcomeEmail(sanitizedEmail, sanitizedFirstName || 'Friend');

    if (!welcomeResult.success) {
      console.warn('⚠️ Failed to send welcome email:', welcomeResult.error);
      // Don't fail the subscription if welcome email fails
    }

    console.log('✅ Newsletter subscription successful:', {
      email: sanitizedEmail,
      firstName: sanitizedFirstName,
      timestamp: new Date().toISOString(),
      welcomeEmailSent: welcomeResult.success
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
      email: sanitizedEmail,
      welcomeEmailSent: welcomeResult.success
    });

  } catch (error) {
    console.error('❌ Newsletter subscription error:', error);
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
    message: 'Newsletter subscription endpoint is active',
    timestamp: new Date().toISOString()
  });
}

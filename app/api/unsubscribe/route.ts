import { NextRequest, NextResponse } from 'next/server';
import { removeSubscriber, sendUnsubscribeConfirmation } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    console.log('👋 Processing unsubscribe request');

    const body = await request.json();
    const { email } = body;

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

    // Send unsubscribe confirmation email
    console.log(`📧 Sending unsubscribe confirmation to: ${sanitizedEmail}`);
    const confirmationResult = await sendUnsubscribeConfirmation(sanitizedEmail);

    if (!confirmationResult.success) {
      console.warn('⚠️ Failed to send unsubscribe confirmation:', confirmationResult.error);
      // Don't fail the unsubscribe if confirmation email fails
    }

    console.log('✅ Unsubscribe successful:', {
      email: sanitizedEmail,
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

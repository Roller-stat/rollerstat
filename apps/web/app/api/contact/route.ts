import { NextRequest, NextResponse } from 'next/server';
import { sendContactNotification, sendAutoReply, verifyEmailConfig } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

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
      console.error('Failed to send notification:', notificationResult.error);
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

    console.log('✅ Contact form submission processed successfully:', {
      name: sanitizedData.name,
      email: sanitizedData.email,
      timestamp: new Date().toISOString(),
      notificationId: notificationResult.messageId,
      autoReplyId: autoReplyResult.messageId
    });

    return NextResponse.json(
      { 
        message: 'Contact form submitted successfully',
        notificationSent: notificationResult.success,
        autoReplySent: autoReplyResult.success
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSubscriber } from '@/lib/brevo';

// Type for subscriber data from Brevo
interface SubscriberData {
  emailBlacklisted?: boolean;
  attributes?: {
    firstName?: string;
    lastName?: string;
    subscribedAt?: string;
    source?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking subscription status');

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // Basic validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
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

    // Check subscriber status
    console.log(`🔍 Checking status for: ${sanitizedEmail}`);
    const subscriberResult = await getSubscriber(sanitizedEmail);

    if (!subscriberResult.success) {
      if (subscriberResult.error === 'Subscriber not found') {
        return NextResponse.json({
          success: true,
          subscribed: false,
          email: sanitizedEmail,
          message: 'Email is not subscribed to newsletter'
        });
      }

      console.error('❌ Failed to check subscriber status:', subscriberResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to check subscription status. Please try again later.'
        },
        { status: 500 }
      );
    }

    // Parse subscriber data
    const subscriberData = subscriberResult.data as SubscriberData;
    const isSubscribed = subscriberData && !subscriberData.emailBlacklisted;

    console.log('✅ Subscription status checked:', {
      email: sanitizedEmail,
      subscribed: isSubscribed,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      subscribed: isSubscribed,
      email: sanitizedEmail,
      subscriberData: isSubscribed ? {
        firstName: subscriberData.attributes?.firstName || '',
        lastName: subscriberData.attributes?.lastName || '',
        subscribedAt: subscriberData.attributes?.subscribedAt || '',
        source: subscriberData.attributes?.source || 'unknown'
      } : null,
      message: isSubscribed ? 'Email is subscribed to newsletter' : 'Email is not subscribed to newsletter'
    });

  } catch (error) {
    console.error('❌ Subscription status check error:', error);
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
export async function POST() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Subscription status endpoint is active',
    timestamp: new Date().toISOString()
  });
}

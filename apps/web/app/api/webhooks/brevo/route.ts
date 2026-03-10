import { NextRequest, NextResponse } from 'next/server';
import { processWebhookEvent } from '@/lib/brevo';
import { parseWebhookPayload, logWebhookEvent, verifyWebhookSignature } from '@/lib/webhook-utils';

// Webhook event types are now handled by the imported webhook-utils

// Webhook event handlers are now integrated into the Brevo service

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Received Brevo webhook');

    // Get webhook ID from environment
    const webhookId = process.env.BREVO_WEBHOOK_ID?.trim();
    const webhookSecret = process.env.BREVO_WEBHOOK_SECRET?.trim();
    if (!webhookId || !webhookSecret) {
      console.error('❌ Brevo webhook is not fully configured');
      return NextResponse.json(
        { error: 'Webhook authentication is not configured' },
        { status: 500 }
      );
    }

    // Get the raw body
    const body = await request.text();
    
    // Get webhook ID from headers (Brevo sends this)
    const receivedWebhookId = request.headers.get('x-brevo-webhook-id');
    if (!receivedWebhookId) {
      console.error('❌ Missing webhook ID in headers');
      return NextResponse.json(
        { error: 'Missing webhook ID' },
        { status: 400 }
      );
    }

    // Verify webhook ID matches
    if (receivedWebhookId !== webhookId) {
      console.error('❌ Invalid webhook ID:', receivedWebhookId);
      return NextResponse.json(
        { error: 'Invalid webhook ID' },
        { status: 401 }
      );
    }

    // Verify webhook signature (HMAC SHA-256)
    const receivedSignature = request.headers.get('x-brevo-signature');
    const signatureVerification = verifyWebhookSignature(
      body,
      receivedSignature || '',
      webhookSecret,
    );
    if (!signatureVerification.isValid) {
      console.error('❌ Invalid Brevo webhook signature');
      return NextResponse.json(
        { error: signatureVerification.error || 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse the webhook data
    const parseResult = parseWebhookPayload(body);
    if (!parseResult.success) {
      console.error('❌ Failed to parse webhook payload:', parseResult.error);
      return NextResponse.json(
        { error: parseResult.error || 'Invalid payload' },
        { status: 400 }
      );
    }

    const webhookData = parseResult.data!;

    // Log the webhook event
    logWebhookEvent(webhookData, 'received');

    // Process the webhook event using Brevo service
    const result = await processWebhookEvent(webhookData);
    
    if (!result.success) {
      console.error('❌ Failed to process webhook event:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to process event' },
        { status: 500 }
      );
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Brevo webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

# Brevo Webhook Setup Guide

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Brevo Configuration (existing)
BREVO_API_KEY=your_api_key_here
BREVO_NEWSLETTER_LIST_ID=your_newsletter_list_id
BREVO_WELCOME_LIST_ID=your_welcome_list_id
BREVO_SENDER_EMAIL=noreply@yourdomain.com

# Webhook Configuration (NEW)
BREVO_WEBHOOK_SECRET=your_webhook_secret_here
```

## How to Get Webhook Secret

1. **Login to Brevo Dashboard**

   - Go to [app.brevo.com](https://app.brevo.com)
   - Login with your Brevo account credentials

2. **Navigate to Webhooks**

   - Go to **Settings** → **Webhooks**
   - Or go to **Settings** → **API Keys** → **Webhooks**

3. **Create New Webhook**

   - Click **"Create a webhook"** or **"Add webhook"**
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/brevo`
   - **Events to track**: Select the events you want to track:
     - ✅ **Delivered** - Email delivered successfully
     - ✅ **Opened** - Email opened by recipient
     - ✅ **Clicked** - Link clicked in email
     - ✅ **Bounce** - Email bounced
     - ✅ **Blocked** - Email blocked
     - ✅ **Spam** - Marked as spam
     - ✅ **Unsubscribed** - User unsubscribed
     - ✅ **List Addition** - Added to list
     - ✅ **List Removal** - Removed from list

4. **Get Webhook Secret**
   - After creating the webhook, Brevo will provide a **Webhook Secret**
   - Copy this secret and add it to your `.env.local` file
   - **IMPORTANT**: Keep this secret secure!

## Webhook Endpoint Details

**Endpoint**: `/api/webhooks/brevo`
**Method**: `POST`
**Content-Type**: `application/json`

### Webhook Events Handled

| Event           | Description                  | Action                |
| --------------- | ---------------------------- | --------------------- |
| `delivered`     | Email delivered successfully | Log delivery          |
| `opened`        | Email opened by recipient    | Track engagement      |
| `clicked`       | Link clicked in email        | Track link clicks     |
| `bounce`        | Email bounced                | Handle invalid emails |
| `blocked`       | Email blocked                | Log blocked emails    |
| `spam`          | Marked as spam               | Remove from lists     |
| `unsubscribed`  | User unsubscribed            | Remove from all lists |
| `list_addition` | Added to list                | Log list addition     |
| `list_removal`  | Removed from list            | Log list removal      |

## Security Features

1. **Signature Verification**

   - All webhooks are verified using HMAC-SHA256
   - Prevents unauthorized webhook calls
   - Uses your webhook secret for verification

2. **Error Handling**

   - Comprehensive error logging
   - Graceful handling of malformed requests
   - Proper HTTP status codes

3. **Event Processing**
   - Asynchronous event handling
   - Detailed logging for debugging
   - Event-specific processing logic

## Testing Webhooks

### 1. Health Check

```bash
curl https://yourdomain.com/api/webhooks/brevo
```

Should return:

```json
{
  "status": "ok",
  "message": "Brevo webhook endpoint is active",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test Webhook (from Brevo)

- Use Brevo's webhook testing feature
- Send test events to verify your endpoint
- Check your server logs for webhook processing

## Production Considerations

1. **HTTPS Required**

   - Webhooks only work with HTTPS in production
   - Ensure your domain has SSL certificate

2. **Rate Limiting**

   - Consider implementing rate limiting for webhook endpoints
   - Prevent abuse of webhook endpoints

3. **Monitoring**

   - Monitor webhook endpoint health
   - Set up alerts for webhook failures
   - Track webhook processing metrics

4. **Logging**
   - All webhook events are logged with emojis for easy identification
   - Check server logs for webhook processing status
   - Monitor for errors and failures

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**

   - Check if webhook URL is correct and accessible
   - Verify HTTPS is working
   - Check Brevo webhook configuration

2. **Signature Verification Failing**

   - Verify webhook secret is correct
   - Check if secret is properly set in environment variables
   - Ensure no extra characters in secret

3. **Events Not Processing**
   - Check server logs for error messages
   - Verify webhook endpoint is responding
   - Test with Brevo's webhook testing feature

### Debug Steps

1. **Check Environment Variables**

   ```bash
   echo $BREVO_WEBHOOK_SECRET
   ```

2. **Test Webhook Endpoint**

   ```bash
   curl -X POST https://yourdomain.com/api/webhooks/brevo \
     -H "Content-Type: application/json" \
     -H "x-brevo-signature: test" \
     -d '{"event":"test","email":"test@example.com"}'
   ```

3. **Check Server Logs**
   - Look for webhook processing logs
   - Check for error messages
   - Verify signature verification

## Next Steps

After setting up webhooks:

1. **Test the webhook endpoint** with Brevo's testing feature
2. **Monitor webhook processing** in your server logs
3. **Set up monitoring** for webhook health
4. **Configure alerts** for webhook failures

The webhook system is now ready to handle real-time events from Brevo!

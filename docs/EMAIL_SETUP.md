# 📧 Email Setup Guide for Contact Form

## ✅ Implementation Complete!

The contact form email functionality has been implemented with Nodemailer. Here's what you need to do:

## 🔧 Setup Steps

### 1. Create Environment Variables

Create a `.env.local` file in your project root with:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
CONTACT_EMAIL=rollerstat@rollerstat.com
```

**Important:**

- `SMTP_USER` = Your Gmail account (for sending emails)
- `CONTACT_EMAIL` = Professional email address (what users see as sender)

### 2. Gmail Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Rollerstat Contact Form"
   - Copy the 16-character password (like: `abcd efgh ijkl mnop`)

### 3. Update Environment Variables

Replace in `.env.local`:

- `your-email@gmail.com` → Your actual Gmail address
- `your-16-character-app-password` → The app password from step 2

## 🚀 How It Works

### When someone submits the contact form:

1. **📧 You receive an email** with:

   - User's name, email, and message
   - Formatted in a professional HTML template
   - Timestamp of submission

2. **📧 User receives auto-reply** with:
   - Thank you message
   - Information about response time
   - Links to your website content

### Email Templates Include:

- ✅ Professional HTML formatting
- ✅ Rollerstat branding (colors, logo)
- ✅ Responsive design
- ✅ Security features (input sanitization)
- ✅ Error handling

## 🧪 Testing

1. **Start your development server:**

   ```bash
   npm run dev
   ```

2. **Test the contact form:**

   - Go to `/contact`
   - Fill out the form with your own email
   - Submit and check both your inbox and the user's inbox

3. **Check console logs** for email sending status

## 🔒 Security Features

- ✅ Input sanitization (prevents XSS)
- ✅ Email validation
- ✅ Rate limiting (Gmail's built-in limits)
- ✅ Error handling
- ✅ Secure SMTP connection

## 📊 Monitoring

Check your server console for:

- ✅ `Email server is ready to send messages`
- ✅ `Contact notification sent: [message-id]`
- ✅ `Auto-reply sent: [message-id]`

## 🚨 Troubleshooting

### If emails don't send:

1. **Check Gmail app password** - Make sure it's correct
2. **Verify 2FA is enabled** - Required for app passwords
3. **Check spam folder** - Emails might be filtered
4. **Check console logs** - Look for error messages

### Common Issues:

- ❌ "Invalid login" → Wrong app password
- ❌ "Less secure app" → Need to use app password, not regular password
- ❌ "Authentication failed" → Check 2FA is enabled

## 📈 Next Steps (Optional)

### For Production:

- Consider using **SendGrid** or **AWS SES** for better deliverability
- Add **rate limiting** to prevent spam
- Add **CAPTCHA** for additional security
- Store submissions in **database** for admin panel

### For Analytics:

- Track email open rates
- Monitor form submission patterns
- Set up email notifications for admin

---

**🎉 Your contact form is now fully functional with email notifications!**

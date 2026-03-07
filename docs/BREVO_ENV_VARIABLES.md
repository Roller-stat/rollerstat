# Brevo Email Subscription - Environment Variables

## 📋 Required Environment Variables for `.env.local`

Add these to your `.env.local` file in the root of your project:

```env
# ============================================================================
# BREVO API CONFIGURATION
# ============================================================================

# Brevo API Key (from Brevo dashboard)
BREVO_API_KEY=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

# Brevo List IDs
BREVO_NEWSLETTER_LIST_ID=4
BREVO_WELCOME_LIST_ID=5

# Brevo Sender Email (verified in Brevo)
BREVO_SENDER_EMAIL=rollerstat@rollerstat.com

# Brevo Webhook ID (from Brevo webhook settings)
BREVO_WEBHOOK_ID=1613650

# ============================================================================
# BREVO TEMPLATE IDs (Phase 5.1)
# ============================================================================

# Welcome Email Template IDs by Locale (from Brevo dashboard)
# Get these from: Brevo Dashboard → Campaigns → Email Templates → Your Template → Template ID
# Default English template (fallback)
BREVO_WELCOME_TEMPLATE_ID=1

# Locale-specific templates (optional - falls back to English if not set)
BREVO_WELCOME_TEMPLATE_ID_EN=1
BREVO_WELCOME_TEMPLATE_ID_ES=2
BREVO_WELCOME_TEMPLATE_ID_FR=3
BREVO_WELCOME_TEMPLATE_ID_IT=4
BREVO_WELCOME_TEMPLATE_ID_PT=5

# Unsubscribe Confirmation Template IDs by Locale (from Brevo dashboard)
# Get these from: Brevo Dashboard → Campaigns → Email Templates → Your Template → Template ID
# Default English template (fallback)
BREVO_UNSUBSCRIBE_TEMPLATE_ID=6

# Locale-specific templates (optional - falls back to English if not set)
BREVO_UNSUBSCRIBE_TEMPLATE_ID_EN=6
BREVO_UNSUBSCRIBE_TEMPLATE_ID_ES=7
BREVO_UNSUBSCRIBE_TEMPLATE_ID_FR=8
BREVO_UNSUBSCRIBE_TEMPLATE_ID_IT=9
BREVO_UNSUBSCRIBE_TEMPLATE_ID_PT=10

# ============================================================================
# UNSUBSCRIBE TOKEN CONFIGURATION
# ============================================================================

# Secret key for signing unsubscribe tokens
# YOU CREATE THIS - Generate a random string using one of these methods:
# 1. Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 2. Run: openssl rand -hex 32
# 3. Or just make up a long random string
UNSUBSCRIBE_TOKEN_SECRET=your-secret-key-change-this-in-production

# ============================================================================
# BASE URL CONFIGURATION
# ============================================================================

# For DEVELOPMENT (localhost)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# For PRODUCTION (when you deploy)
# NEXT_PUBLIC_BASE_URL=https://rollerstat.com
```

---

## 🔑 How to Generate UNSUBSCRIBE_TOKEN_SECRET

### Option 1: Using Node.js (Recommended)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This will output something like:

```
a7f3e9d2c8b1f4a6e3d7c9b2f5a8e1d4c7b3f6a9e2d5c8b1f4a7e3d6c9b2f5a8
```

Copy this and use it as your `UNSUBSCRIBE_TOKEN_SECRET`.

### Option 2: Using OpenSSL

```bash
openssl rand -hex 32
```

### Option 3: Manual (Simple but less secure)

Just create a long random string:

```
my-super-secret-unsubscribe-key-2024-rollerstat-xyz123abc456
```

---

## 📝 Complete `.env.local` Example

```env
# Brevo Configuration
BREVO_API_KEY=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
BREVO_NEWSLETTER_LIST_ID=4
BREVO_WELCOME_LIST_ID=5
BREVO_SENDER_EMAIL=rollerstat@rollerstat.com
BREVO_WEBHOOK_ID=1613650

# Brevo Template IDs
BREVO_WELCOME_TEMPLATE_ID=1

# Unsubscribe Token (generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
UNSUBSCRIBE_TOKEN_SECRET=a7f3e9d2c8b1f4a6e3d7c9b2f5a8e1d4c7b3f6a9e2d5c8b1f4a7e3d6c9b2f5a8

# Base URL (change for production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Other existing environment variables...
# (Keep your existing NextAuth, database, etc. variables)
```

---

## ⚠️ Important Notes

1. **UNSUBSCRIBE_TOKEN_SECRET**:

   - This is NOT from Brevo
   - YOU create this yourself
   - Keep it secret and secure
   - Change it when deploying to production

2. **NEXT_PUBLIC_BASE_URL**:

   - Use `http://localhost:3000` for development
   - Change to `https://rollerstat.com` for production
   - This is used to generate unsubscribe links in emails

3. **Security**:
   - Never commit `.env.local` to git
   - Use different secrets for development and production
   - Keep your Brevo API key secure

---

## 🚀 After Adding Variables

1. **Restart your development server**:

   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Test the unsubscribe flow**:
   - Subscribe to newsletter
   - Check welcome email
   - Click unsubscribe link
   - Verify token validation works

# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-make-it-long-and-random

# Admin Credentials
ADMIN_EMAIL=admin@rollerstat.com
ADMIN_PASSWORD=your-secure-password-here
```

## How to Generate NEXTAUTH_SECRET

You can generate a secure secret using:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

## Example .env.local

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890
ADMIN_EMAIL=admin@rollerstat.com
ADMIN_PASSWORD=MySecurePassword123!
```

## Important Notes

- **Never commit** `.env.local` to version control
- **Use strong passwords** for production
- **Change default credentials** before deploying
- **Restart your development server** after adding environment variables

## Troubleshooting

If you're still getting authentication errors:

1. **Check environment variables** are correctly set
2. **Restart the development server** (`npm run dev`)
3. **Clear browser cache** and cookies
4. **Check the console** for any error messages

## Testing Login

After setting up the environment variables:

1. Go to `http://localhost:3000/admin/login`
2. Use the credentials from your `.env.local` file
3. You should be redirected to the admin dashboard

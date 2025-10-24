# Admin Panel Setup Guide

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```bash
# Admin Panel Authentication
ADMIN_EMAIL=admin@rollerstat.com
ADMIN_PASSWORD=your-secure-admin-password-here
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

## Generate Secure Secret

Run this command to generate a secure NextAuth secret:

```bash
openssl rand -base64 32
```

## Important Notes

- Change the admin email and password to secure values
- Use the generated secret for NEXTAUTH_SECRET
- Update NEXTAUTH_URL for production deployment
- Never commit .env.local to version control

## Next Steps

1. Create .env.local with the above variables
2. Update the values with your secure credentials
3. Proceed with Phase 3B: Authentication System

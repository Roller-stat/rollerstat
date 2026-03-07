# Admin Authentication Setup

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Admin Credentials
ADMIN_EMAIL=admin@rollerstat.com
ADMIN_PASSWORD=your-secure-password-here
```

## How to Use

1. **Set up environment variables** in your `.env.local` file
2. **Start the development server**: `npm run dev`
3. **Access admin login**: Navigate to `/admin/login`
4. **Login with credentials**: Use the email and password from your environment variables
5. **Access admin dashboard**: After successful login, you'll be redirected to `/admin`

## Features Implemented

### Authentication System

- ✅ NextAuth configuration with credentials provider
- ✅ Admin role-based access control
- ✅ Session management with JWT strategy
- ✅ Protected admin routes

### Components Created

- ✅ **AuthGuard**: Protects admin routes using shadcn Alert
- ✅ **Login Page**: Built with shadcn Form, Input, and Button
- ✅ **Session Provider**: Wraps the entire app for session management
- ✅ **Admin Dashboard**: Basic dashboard with sign-out functionality

### Security Features

- ✅ Role-based access control (admin only)
- ✅ Automatic redirect to login for unauthenticated users
- ✅ Session validation on protected routes
- ✅ Secure credential validation

## File Structure

```
lib/
  auth.ts                    # NextAuth configuration
app/
  api/auth/[...nextauth]/
    route.ts                 # NextAuth API routes
  admin/
    login/
      page.tsx              # Login page
    page.tsx                # Admin dashboard
components/
  auth/
    auth-guard.tsx          # Route protection component
    session-provider.tsx    # Session provider wrapper
```

## Next Steps

This completes Phase 3B: Authentication System. The next phases will include:

- Phase 3C: Core Admin Components (Post Form, Post List, Image Upload)
- Phase 3D: API Development (File Operations, API Routes)
- Phase 3E: Admin Pages (Layout, Dashboard, Post Management)

import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
    }
  }
  
  interface User {
    id: string
    email: string
    name: string
    role: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Simple admin credentials check
        // In production, you should hash passwords and store them securely
        if (
          credentials?.email === process.env.ADMIN_EMAIL &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          return {
            id: "1",
            email: credentials.email as string,
            name: "Admin",
            role: "admin"
          }
        }
        return null
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  pages: {
    signIn: "/admin/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || ""
        session.user.role = (token as { role?: string }).role || ""
      }
      return session
    }
  }
})

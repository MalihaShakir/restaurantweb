/**
 * NextAuth v5 — Credentials + JWT strategy.
 *
 * Verifies email/password against bcrypt hashes in MongoDB.
 * Sessions are JWT-based (HTTP-only cookies, no DB session table).
 *
 * Note: MongoDBAdapter is intentionally omitted — CredentialsProvider
 * requires strategy:"jwt" which is incompatible with the adapter's
 * database session strategy. Add OAuth providers + adapter later if needed.
 */
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { User } from "@/server/models";

// ── Augment NextAuth types with our custom fields ──────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id:           string;
      role:         string;
      restaurantId: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role?:         string;
    restaurantId?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email    = String(credentials?.email    ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        await connectDB();

        // Select +passwordHash which is excluded from queries by default.
        const dbUser = await User.findOne({ email, active: true, deletedAt: null })
          .select("+passwordHash")
          .lean<{
            _id:          unknown;
            email:        unknown;
            name:         unknown;
            role:         unknown;
            restaurantId: unknown;
            passwordHash: string;
          }>();

        if (!dbUser?.passwordHash) return null;

        const valid = await bcrypt.compare(password, dbUser.passwordHash);
        if (!valid) return null;

        // Shape returned here is forwarded into the jwt() callback as `user`.
        return {
          id:           String(dbUser._id),
          email:        String(dbUser.email ?? ""),
          name:         String(dbUser.name  ?? ""),
          role:         String(dbUser.role  ?? "customer"),
          restaurantId: dbUser.restaurantId ? String(dbUser.restaurantId) : null,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    // Persist role + restaurantId into the JWT token.
    async jwt({ token, user }) {
      if (user) {
        token.id           = user.id;
        token.role         = user.role  ?? "customer";
        token.restaurantId = (user as { restaurantId?: string | null }).restaurantId ?? null;
      }
      return token;
    },
    // Expose JWT fields on the session object (client-safe subset only).
    async session({ session, token }) {
      if (session.user) {
        session.user.id           = token.id           as string;
        session.user.role         = token.role         as string;
        session.user.restaurantId = token.restaurantId as string | null;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
});

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: replace with real MongoDB user lookup
        // e.g. const user = await User.findOne({ email: credentials.email });
        // if (!user || !bcrypt.compareSync(credentials.password, user.passwordHash)) return null;
        if (!credentials?.email || !credentials?.password) return null;
        return null; // stub — returns null until backend is wired
      },
    }),
  ],
  // TODO: add MongoDBAdapter(clientPromise) once MONGODB_URI is set
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
});

import { getServerSession, type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import db from './db';
import { seedDemoBoard } from './seed';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        if (!profile?.email || !(profile as { email_verified?: boolean }).email_verified) return false;

        const existingUser = await db.user.findUnique({
          where: { email: profile.email },
          select: { id: true },
        });

        const dbUser = await db.user.upsert({
          where: { email: profile.email },
          update: { name: profile.name ?? null },
          create: {
            email: profile.email,
            name: profile.name ?? null,
            // Bcrypt hash of an unknown random UUID — satisfies the non-nullable
            // schema column and ensures bcrypt.compare always returns false cleanly,
            // making credential login impossible for Google-only accounts.
            password: await bcrypt.hash(crypto.randomUUID(), 10),
          },
        });

        if (!existingUser) {
          try {
            await seedDemoBoard(dbUser.id);
          } catch (err) {
            console.error('[google-signin] demo board seed failed:', err);
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // For Google sign-ins, user.id is Google's own ID, not our DB cuid.
      // account is only present on the initial sign-in, so this DB lookup
      // runs once per new Google session, never on token refreshes.
      if (account?.provider === 'google' && token.email) {
        const dbUser = await db.user.findUnique({ where: { email: token.email } });
        if (dbUser) token.id = dbUser.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

export const auth = () => getServerSession(authOptions);
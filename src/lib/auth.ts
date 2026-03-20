import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

const membershipMap: Record<number, string> = {
  1: 'MEMBER',
  2: 'VIP',
  3: 'FOUNDER',
};

declare module 'next-auth' {
  interface User {
    role?: string;
    username?: string;
    membership?: string;
  }
  interface JWT {
    role?: string;
    username?: string;
    membership?: string;
  }
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      username?: string;
      membership?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: '???/??', type: 'text' },
        email: { label: '??', type: 'text' },
        password: { label: '??', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.password) return null;
        const loginField = credentials.email || credentials.username;
        if (!loginField) return null;
        const isEmail = loginField.includes('@');
        const user = isEmail
          ? await prisma.user.findUnique({ where: { email: loginField } })
          : await prisma.user.findUnique({ where: { username: loginField } });
        if (!user || !user.password) return null;
        if (user.status === 0) throw new Error('??????');
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: user.id.toString(),
          name: user.name || user.username,
          username: user.username,
          email: user.email,
          role: user.role,
          membership: membershipMap[user.membership] || 'MEMBER',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
        if (user.membership) token.membership = user.membership;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
        session.user.username = token.username as string;
        const v = token.membership;
        session.user.membership = (typeof v === 'number' ? membershipMap[v] : v) || 'MEMBER';
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
};

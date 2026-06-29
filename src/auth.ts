import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { getPrisma } from "@/lib/prisma";
import { assignRoleOnCreate } from "@/lib/users/role";
import { getUserRole } from "@/lib/users/get-user-role";
import { isEmailAllowed } from "@/lib/auth/sign-in-policy";
import { ensureTrackedSession } from "@/lib/auth/session-management";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(getPrisma()),
  session: { strategy: "jwt" },
  events: {
    createUser: async ({ user }) => {
      if (user.id) {
        await assignRoleOnCreate(user.id);
      }
    },
    signIn: async ({ user, account }) => {
      if (!user.id) return;

      if (account?.provider === "google") {
        await getPrisma().user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }

      await getPrisma().user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    },
  },
  callbacks: {
    signIn: async ({ account, profile }) => {
      if (account?.provider === "google") {
        return (
          profile?.email_verified === true && isEmailAllowed(profile?.email)
        );
      }
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.sub = user.id;
      }

      if (token.sub) {
        const role = await getUserRole(token.sub);
        token.role = role;
        await ensureTrackedSession(token.sub);
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as string) ?? "user";
      }
      return session;
    },
  },
});

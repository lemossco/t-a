import { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const usuario = await prisma.usuarios.findUnique({
          where: { email: credentials.email },
          include: {
            usuario_roles: { include: { roles: true } },
          },
        });

        if (!usuario || !usuario.activo || usuario.bloqueado) return null;

        const isValid = await compare(credentials.password, usuario.password);

        if (!isValid) {
          await prisma.usuarios.update({
            where: { id: usuario.id },
            data: { intentos_fallidos: { increment: 1 } },
          });
          return null;
        }

        await prisma.usuarios.update({
          where: { id: usuario.id },
          data: { intentos_fallidos: 0, ultimo_acceso: new Date() },
        });

        return {
          id: usuario.id,
          email: usuario.email,
          name: `${usuario.nombre} ${usuario.apellidos}`,
          roles: usuario.usuario_roles.map((ur) => ur.roles.nombre),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as { roles?: string[] }).roles ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

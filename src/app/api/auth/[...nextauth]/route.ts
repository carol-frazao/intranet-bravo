import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080/';
        try {
          // Usar endpoint da Intranet
          const res = await fetch(`${backendUrl}intranet/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password })
          });
          if (!res.ok) return null;
          const data = await res.json();
          // expects { token, user, expiresIn, expiresAt }
          if (!data?.token || !data?.user) return null;
          
          return { 
            id: String(data.user.id), 
            name: data.user.name, 
            email: data.user.email, 
            username: data.user.username,
            token: data.token, 
            profile: data.user.profile,
            expiresIn: data.expiresIn,
            expiresAt: data.expiresAt
          } as any;
        } catch (e) {
          console.error('Error during authentication:', e);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {      
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).token;
        token.profile = (user as any).profile;
        token.username = (user as any).username;
        
        // Usar expiresAt que vem do backend
        const backendExpiresAt = (user as any).expiresAt;
        const expiresInMs = (user as any).expiresIn;
                
        if (backendExpiresAt) {
          // Converter ISO string para timestamp em segundos
          const expiresAtSeconds = typeof backendExpiresAt === 'string' 
            ? Math.floor(new Date(backendExpiresAt).getTime() / 1000)
            : backendExpiresAt;
          
          token.expiresAt = expiresAtSeconds;
        } else if (expiresInMs) {
          // Fallback: usar expiresIn do backend
          token.expiresAt = Math.floor(Date.now() / 1000) + Math.floor(expiresInMs / 1000);
        } else {
          // Fallback final: 8 horas
          token.expiresAt = Math.floor(Date.now() / 1000) + (8 * 60 * 60);
        }
      }
      
      // Verificar se o token expirou
      const now = Math.floor(Date.now() / 1000);
      if (token.expiresAt && now > (token.expiresAt as number)) {
        return {};
      }
      
      return token;
    },
    async session({ session, token }) {
      // Se o token estiver vazio (expirado), retornar sessão inválida
      if (!token.accessToken) {
        return {} as any;
      }
      
      (session as any).id = token.id;
      (session as any).accessToken = token.accessToken;
      (session as any).profile = token.profile;
      (session as any).username = token.username;
      (session as any).expiresAt = token.expiresAt;
      return session;
    }
  },
  events: {
    async signOut() {
      console.log('🔒 Usuário deslogado');
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };



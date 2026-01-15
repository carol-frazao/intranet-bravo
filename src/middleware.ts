import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Middleware executado após a autenticação
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Retorna true se o usuário está autenticado
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Protege todas as rotas exceto login e arquivos estáticos
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (página de login)
     * - /api/auth/* (rotas de autenticação do NextAuth)
     * - /_next/* (arquivos estáticos do Next.js)
     * - /favicon.ico, /robots.txt, etc (arquivos públicos)
     * - /images/* (imagens públicas)
     * - /fonts/* (fontes públicas)
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};





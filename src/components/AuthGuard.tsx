'use client';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Se não está autenticado e não está na página de login
    if (status === 'unauthenticated' && pathname !== '/login') {
      router.push('/login');
    }

    // Se está autenticado e está na página de login, redireciona para home
    if (status === 'authenticated' && pathname === '/login') {
      router.push('/');
    }

    // Console.log e verificação de expiração
    if (status === 'authenticated' && session) {
      const expiresAt = (session as any)?.expiresAt;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = expiresAt - now;
        const minutes = Math.floor(timeLeft / 60);
        const dataExpiracao = new Date(expiresAt * 1000).toLocaleString('pt-BR');
        
        // Se expirou, fazer logout
        if (timeLeft <= 0 && !checking) {
          console.log('🔒 Sessão expirada! Fazendo logout...');
          setChecking(true);
          signOut({ 
            redirect: true,
            callbackUrl: '/login?sessionExpired=true'
          });
        }
      }
    }
  }, [status, pathname, router, session, checking]);

  // Loading state enquanto verifica a sessão
  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Se não está autenticado e não está no login, mostra loading
  if (status === 'unauthenticated' && pathname !== '/login') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return <>{children}</>;
}


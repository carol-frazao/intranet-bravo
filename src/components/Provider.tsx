'use client';
import { SessionProvider } from 'next-auth/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CssBaseline } from '@mui/material';
import { BravoThemeProvider } from '@/contexts/ThemeContext';
import AuthGuard from './AuthGuard';
import Header from '@/components/Header';
import { usePathname } from 'next/navigation';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/redux-files/store';
import { createContext, useContext, useState } from 'react';

// Context para comunicação entre HomePage e Header
const HeaderContext = createContext<{
  onMenuClick?: () => void;
  menuOpen?: boolean;
}>({});

export const useHeaderContext = () => useContext(HeaderContext);

export default function Provider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = pathname !== '/login';
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setMenuOpen(prev => !prev);
  };

  return (
    <SessionProvider>
      <BravoThemeProvider>
        <CssBaseline />
        <ReduxProvider store={store}>
          <HeaderContext.Provider value={{ onMenuClick: handleMenuClick, menuOpen }}>
            <AuthGuard>
              {showHeader && <Header onMenuClick={handleMenuClick} menuOpen={menuOpen} />}
              {children}
            </AuthGuard>
          </HeaderContext.Provider>
        </ReduxProvider>
        <ToastContainer position="top-right" autoClose={3000} />
      </BravoThemeProvider>
    </SessionProvider>
  );
}




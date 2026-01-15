import type { Metadata } from 'next';
import './globals.css';
import Provider from '@/components/Provider';
import HeaderSpacer from '@/components/layout/HeaderSpacer';

export const metadata: Metadata = {
  title: 'Intranet Bravo Brasil',
  description: 'Central de informações, documentos e recursos para toda equipe Bravo Brasil',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body>
        <Provider>
          {/* Espaçamento para compensar o header fixo (omitido em páginas sem header) */}
          <HeaderSpacer />
          {children}
        </Provider>
      </body>
    </html>
  );
}

'use client';

import { Toolbar } from '@mui/material';
import { usePathname } from 'next/navigation';

const PAGES_WITHOUT_HEADER_OFFSET = ['/login'];

export default function HeaderSpacer() {
  const pathname = usePathname();

  if (PAGES_WITHOUT_HEADER_OFFSET.includes(pathname)) {
    return null;
  }

  return <Toolbar />;
}




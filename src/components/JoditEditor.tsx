"use client";

import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { joditConfig } from '@/utils/joditConfig';
import '@/styles/jodit.css';

// Importar JoditEditor dinamicamente para evitar SSR
const JoditEditorComponent = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => <div>Carregando editor...</div>
});

interface JoditEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function JoditEditor({ 
  value, 
  onChange, 
  placeholder = "Digite...",
  minHeight = 300 
}: JoditEditorProps) {
  const editor = useRef(null);
  const [internalValue, setInternalValue] = useState(value);

  // Sincronizar valor externo com interno
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const config = {
    ...joditConfig,
    placeholder,
    minHeight,
    // Prevenir scroll automático
    scrollToCaret: false,
  };

  const handleBlur = (newValue: string) => {
    // Salvar scroll position
    const scrollPos = window.scrollY;
    
    if (newValue !== value) {
      onChange(newValue);
    }
    
    // Restaurar scroll position
    setTimeout(() => {
      window.scrollTo(0, scrollPos);
    }, 0);
  };

  return (
    <JoditEditorComponent
      ref={editor}
      value={internalValue}
      config={config as any}
      tabIndex={1}
      onBlur={handleBlur}
    />
  );
}

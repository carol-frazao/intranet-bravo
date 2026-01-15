"use client";
import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/' });

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  
  // Se não houver sessão ou token, NextAuth já lida com isso
  const token = (session as any)?.accessToken;
  if (token) {
    (config.headers as any).token = `Bearer ${token}`;
  }
  
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('🔒 Token inválido ou expirado (401). Fazendo logout...');
      await signOut({ 
        redirect: true,
        callbackUrl: '/login?sessionExpired=true'
      });
    }
    return Promise.reject(error);
  }
);

export default api;



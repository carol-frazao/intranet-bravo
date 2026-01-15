'use client';
import { Box, IconButton, Typography } from '@mui/material'
import React from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

interface ReturnBtnProps {
  title?: string;
  url?: string;
  onClick?: () => void;
}

const ReturnBtn = (props: ReturnBtnProps) => {
  const { title, url, onClick } = props;

  const router = useRouter();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 2.5 }}>
      <IconButton color="inherit" size="small" onClick={() => { if (onClick) onClick(); else router.push(url || '/') }}> 
        <ArrowBackIcon fontSize="small" color="primary" />
      </IconButton>
      <Typography variant="subtitle1" fontWeight={600}>{title || 'Voltar'}</Typography>
    </Box>
  )
}

export default ReturnBtn
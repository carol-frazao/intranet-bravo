"use client";
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Link, 
  InputAdornment,
  IconButton,
  CircularProgress,
  Fade,
  useTheme,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material';
import { toast } from 'react-toastify';
import { Lock, Sms, Eye, EyeSlash, ArrowLeft } from 'iconsax-reactjs';

export default function Login() {
  const { status } = useSession();
  const router = useRouter();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega email salvo ao montar o componente
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    
    setError(null); // Limpa erro anterior
    setLoading(true);
    
    const res = await signIn('credentials', { redirect: false, email, password });
    setLoading(false);
    
    if (res?.ok) {
      // Salva ou remove o email do localStorage
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Busca o nome do usuário da sessão
      const userResponse = await fetch('/api/auth/session');
      const sessionData = await userResponse.json();
      const userName = sessionData?.user?.name || 'usuário';
      
      toast.success(`Bem-vindo de volta, ${userName}!`);
      router.push('/');
    } else {
      setError('Credenciais inválidas.');
    }
  };

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setRememberMe(checked);
    
    // Se desmarcar, remove o email do localStorage imediatamente
    if (!checked) {
      localStorage.removeItem('rememberedEmail');
    }
  };

  if (status === 'authenticated') {
    router.replace('/');
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }
      }}
    >
      {/* Logo/Título no canto superior esquerdo */}
      <Box
        sx={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: 45,
            height: 45,
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <img 
            src="/images/icons/icon-png.png" 
            alt="Bravo Brasil" 
            style={{ width: 32, height: 32 }}
          />
        </Box>
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            fontWeight: 700,
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          Intranet Bravo Brasil
        </Typography>
      </Box>

      {/* Container Principal */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          maxWidth: 1100,
          margin: 'auto',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          px: 3,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Lado Esquerdo - Ilustração */}
        <Fade in timeout={800}>
          <Box
            sx={{
              flex: 1,
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                mb: 4,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <img 
                src="/images/icons/icon-png.png" 
                alt="Bravo Brasil" 
                style={{ width: 80, height: 80 }}
              />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 2,
                textAlign: 'center',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              Bem-vindo de volta!
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 300,
                textAlign: 'center',
                opacity: 0.95,
                maxWidth: 400,
                lineHeight: 1.6,
              }}
            >
              Acesse documentos, normativas e conteúdos essenciais para o seu dia a dia.
            </Typography>
          </Box>
        </Fade>

        {/* Lado Direito - Formulário */}
        <Fade in timeout={1000}>
          <Box
            sx={{
              flex: 1,
              maxWidth: 480,
              width: '100%',
            }}
          >
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                p: 5,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
            >
              <Box sx={{ mb: 2.5, textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#1a1a1a',
                    mb: 1
                  }}
                >
                  Login
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  Bem-vindo a <b style={{ color: theme.palette.primary.main }}>Intranet Bravo Brasil</b>!<br/>
                  Digite suas credenciais para acessar.
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Sms size="22" color="#003da5" variant="Bold" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size="22" color="#003da5" variant="Bold" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? (
                            <EyeSlash size="22" color="#666" />
                          ) : (
                            <Eye size="22" color="#666" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={handleRememberMeChange}
                        sx={{
                          color: theme.palette.primary.main,
                          '&.Mui-checked': {
                            color: theme.palette.primary.main,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" color="text.secondary">
                        Lembrar de mim
                      </Typography>
                    }
                  />
                </Box>

                {error && (
                  <Alert 
                    severity="error" 
                    onClose={() => setError(null)}
                    sx={{ mb: 2 }}
                  >
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: error ? 0 : 1,
                    mb: 2,
                    py: 1.5,
                    fontSize: 16,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #003da5 0%, #0052d9 100%)',
                    boxShadow: '0 4px 15px rgba(0, 61, 165, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #002d7a 0%, #003da5 100%)',
                      boxShadow: '0 6px 20px rgba(0, 61, 165, 0.6)',
                      transform: 'translateY(-2px)',
                    },
                    '&:disabled': {
                      background: '#ccc',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}




'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Popover, 
  MenuItem,
  IconButton,
  useTheme,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import Link from 'next/link';
import { UserSquare, Logout, Login, Setting3 } from 'iconsax-reactjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupIcon from '@mui/icons-material/Group';
import GroupUnitSelector from './GroupUnitSelector';
import MenuIcon from '@mui/icons-material/Menu';
import { useMediaQuery } from '@mui/material';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
  customContent?: React.ReactNode;
  onMenuClick?: () => void;
  menuOpen?: boolean;
}

export default function Header({ 
  title, 
  showBackButton = false, 
  backUrl = '/',
  customContent,
  onMenuClick,
  menuOpen = false
}: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isHomePage = pathname === '/';
  const userProfile = (session as any)?.profile?.toLowerCase();

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    handleUserMenuClose();
    router.push(path);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const openUserMenu = Boolean(anchorEl);

  // Determina se estamos em uma área admin
  const isAdminArea = pathname?.startsWith('/admin');

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        borderRadius: 0, 
        backgroundColor: theme.palette.primary.light,
        boxShadow: 2,
        top: 0,
        zIndex: theme.zIndex.appBar
      }}
    >
      <Toolbar 
        sx={{ 
          justifyContent: 'space-between', 
          minHeight: { xs: 56, sm: 64 }, 
          px: { xs: 1, sm: 2 },
          py: { xs: 0.5, sm: 1 },
          gap: 1,
          flexWrap: 'nowrap'
        }}
      >
        {/* Lado Esquerdo - Logo/Título ou Botão Voltar */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            minWidth: 0,
            flex: '0 1 auto'
          }}
        >
          {/* Botão de Menu para HomePage no mobile */}
          {isHomePage && isMobile && onMenuClick && (
            <IconButton
              color="inherit"
              onClick={onMenuClick}
              sx={{
                mr: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          {showBackButton ? (
            <>
              <IconButton 
                color="inherit" 
                onClick={() => router.push(backUrl)}
                sx={{ mr: { xs: 0, sm: 1 } }}
                size="small"
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography 
                variant="h6" 
                component="div"
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {title || 'Painel'}
              </Typography>
            </>
          ) : customContent ? (
            customContent
          ) : (
            <Box
              component={Link}
              href="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 1.25 },
                minWidth: 0
              }}
            >
              <img 
                src='/images/icons/icon-png.png' 
                alt="Intranet Bravo Brasil" 
                width={28} 
                height={28}
                style={{ flexShrink: 0 }}
              />
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', sm: '1.1rem' },
                  display: { xs: 'none', sm: 'block' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                Intranet Bravo Brasil
              </Typography>
            </Box>
          )}
        </Box>

        {/* Lado Direito - Ações do Usuário */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 },
            flexShrink: 0,
            minWidth: 0
          }}
        >
          {/* Seletor de Grupo e Unidade */}
          {session && (
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <GroupUnitSelector />
            </Box>
          )}

          {/* Botão de Usuário */}
          {session ? (
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              sx={{ 
                p: { xs: 0.75, sm: 1 },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {/* <UserSquare size={22} variant="Bulk"/> */}
              <Setting3 size={26} variant="Bulk"/>
            </IconButton>
          ) : (
            <Button 
              color="inherit" 
              onClick={() => router.push('/login')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.6, 
                p: { xs: 0.75, sm: 1 },
                textTransform: 'none',
                minWidth: { xs: 'auto', sm: 'auto' }
              }}
            >
              <Login size={22} variant="Bulk"/>
              <Typography 
                variant="body2" 
                sx={{ 
                  display: { xs: 'none', sm: 'block' },
                  fontSize: '0.875rem'
                }}
              >
                Entrar
              </Typography>
            </Button>
          )}

          {/* Popover do Menu do Usuário (aparece para todos logados) */}
          {session && (
            <Popover
              open={openUserMenu}
              anchorEl={anchorEl}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {/* Gestão de Usuários (só aparece para admin e não estiver na área admin) */}
              {userProfile === 'admin' && !isAdminArea && (
                <>
                  <MenuItem onClick={() => {
                    handleUserMenuClose();
                    handleNavigate('/admin/usuarios');
                  }} sx={{ gap: 1, minWidth: 200, py: 1.5 }}>
                    <GroupIcon fontSize="small" />
                    <ListItemText>Gestão de Usuários</ListItemText>
                  </MenuItem>
                  <Divider sx={{ m: '0 !important' }} />
                </>
              )}
              <MenuItem onClick={handleLogout} sx={{ gap: 1, minWidth: 180, py: 1.5 }}>
                <Logout size="20" variant="Outline"/>
                Sair
              </MenuItem>
            </Popover>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}


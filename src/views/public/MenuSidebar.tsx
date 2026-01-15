'use client';
import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Paper,
  CircularProgress,
  Chip,
  useTheme,
  Drawer,
  useMediaQuery,
  Backdrop,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DescriptionIcon from '@mui/icons-material/Description';
import { useHeaderContext } from '@/components/Provider';
import { useRouter } from 'next/navigation';
import SettingsIcon from '@mui/icons-material/Settings';

interface Category {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
  icon: string;
  color: string;
  order: number;
  children?: Category[];
  contents?: any[];
}

interface Content {
  id: number;
  title: string;
  description: string;
  type: string;
  categoryId: number;
  content?: string;
  views?: number;
  files?: any[];
  author?: { name: string };
  publishedAt?: string;
}

interface MenuSidebarProps {
  categories: Category[];
  contents: Content[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategoryId: number | null | 'uncategorized' | 'none';
  onCategorySelect: (categoryId: number | null | 'uncategorized' | 'none') => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function MenuSidebar({
  categories,
  contents,
  loading,
  searchTerm,
  onSearchChange,
  selectedCategoryId,
  onCategorySelect,
  onRefresh,
  refreshing
}: MenuSidebarProps) {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { onMenuClick, menuOpen } = useHeaderContext();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  // Sincronizar estado do menu com o contexto (quando clicado no Header)
  useEffect(() => {
    if (menuOpen !== undefined && isMobile) {
      setSidebarOpen(menuOpen);
    }
  }, [menuOpen, isMobile]);

  // Fechar sidebar ao selecionar categoria no mobile
  useEffect(() => {
    if (isMobile && selectedCategoryId !== 'none' && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [selectedCategoryId, isMobile, sidebarOpen]);

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleToggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryClick = (category: Category) => {
    const newSelectedId = category.id === selectedCategoryId ? 'none' : category.id;
    onCategorySelect(newSelectedId);
  };

  const renderCategoryTree = (cats: Category[], level: number = 0, includeUncategorized: boolean = false) => {
    const items = [];

    // Adicionar "Sem Categoria" como primeira opção no nível raiz (apenas se houver conteúdos)
    if (includeUncategorized && level === 0) {
      const uncategorizedCount = contents.filter(c => !c.categoryId).length;
      
      if (uncategorizedCount > 0) {
        items.push(
          <Box key="uncategorized">
            <ListItem disablePadding>
              <Tooltip 
                title={sidebarCollapsed ? 'Sem Categoria' : ''} 
                placement="right"
                disableHoverListener={!sidebarCollapsed}
              >
                <ListItemButton
                  selected={selectedCategoryId === 'uncategorized'}
                  onClick={() => onCategorySelect('uncategorized')}
                  sx={{
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    px: sidebarCollapsed ? 1 : 2,
                    minHeight: 48
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: sidebarCollapsed ? 0 : 36, 
                    justifyContent: 'center',
                    mr: sidebarCollapsed ? 0 : 1
                  }}>
                    <DescriptionIcon sx={{ fontSize: 20, color: '#999' }} />
                  </ListItemIcon>
                  {!sidebarCollapsed && (
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>Sem Categoria</span>
                          <Chip label={uncategorizedCount} size="small" color="default" sx={{ height: 18, fontSize: '0.7rem' }} />
                        </Box>
                      }
                      primaryTypographyProps={{ fontSize: '0.9rem', color: 'text.secondary' }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </Box>
        );
      }
    }

    items.push(...cats.map((category) => (
      <Box 
        key={category.id}
        sx={{
          position: 'relative',
          // Linha vertical conectando os filhos (se houver)
          ...(level > 0 && {
            '&::before': {
              content: '""',
              position: 'absolute',
              left: `${(level - 1) * 16 + 18}px`,
              top: 0,
              bottom: 0,
              width: '1px',
              backgroundColor: 'divider',
            }
          })
        }}
      >
        <ListItem 
          disablePadding
          sx={{ 
            pl: level * 2,
            position: 'relative',
            // Linha horizontal conectando ao pai
            ...(level > 0 && {
              '&::before': {
                content: '""',
                position: 'absolute',
                left: `${(level - 1) * 16 + 18}px`,
                top: '50%',
                width: '16px',
                height: '1px',
                backgroundColor: 'divider',
              }
            })
          }}
        >
          <Tooltip 
            title={sidebarCollapsed ? category.name : ''} 
            placement="right"
            disableHoverListener={!sidebarCollapsed}
          >
            <ListItemButton
              selected={selectedCategoryId === category.id}
              onClick={() => {
                if (category.children && category.children.length > 0 && !sidebarCollapsed) {
                  handleToggleCategory(category.id);
                }
                handleCategoryClick(category);
              }}
              sx={{
                borderRadius: level > 0 ? 1 : 0,
                mx: level > 0 ? 0.5 : 0,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                px: sidebarCollapsed ? 1 : 2,
                minHeight: 48
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: sidebarCollapsed ? 0 : 36, 
                justifyContent: 'center',
                mr: sidebarCollapsed ? 0 : 1
              }}>
                <DescriptionIcon sx={{ fontSize: 20, color: category.color || theme.palette.primary.main }} />
              </ListItemIcon>
              {!sidebarCollapsed && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>  
                  <ListItemText 
                    primary={category.name}
                    primaryTypographyProps={{
                      fontSize: level > 0 ? '0.85rem' : '0.9rem',
                      fontWeight: level === 0 ? 500 : 400
                    }}
                  />
                  {category.children && category.children.length > 0 &&  (
                    expandedCategories.includes(category.id) ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />
                  )}
                </Box>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        
        {category.children && category.children.length > 0 && (
          <Collapse 
            in={expandedCategories.includes(category.id)} 
            timeout="auto" 
            unmountOnExit
          >
            {renderCategoryTree(category.children, level + 1)}
          </Collapse>
        )}
      </Box>
    )));

    return items;
  };

  const sidebarWidth = sidebarCollapsed ? 64 : 350;
  const sidebarContent = (
    <>
      {/* Header da Sidebar */}
      <Box sx={{ 
        py: 1, 
        px: 2,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        minHeight: 60
      }}>
        {!sidebarCollapsed && (
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography variant="h6" sx={{ flex: 1, fontSize: '1rem !important' }}>
              DOCUMENTOS PÚBLICOS
            </Typography>
            <Tooltip title="Gestão de Conteúdo">
              <IconButton 
                onClick={() => router.push('/gestao-de-conteudo')}
                size="small"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { 
                    color: theme.palette.primary.main,
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <SettingsIcon 
                  sx={{ 
                    fontSize: 20,
                  }} 
                />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {!isMobile && (
            <Tooltip title={sidebarCollapsed ? "Expandir" : "Recolher"}>
              <IconButton 
                onClick={handleToggleCollapse}
                size="small"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { 
                    color: theme.palette.primary.main,
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            </Tooltip>
          )}
          {!sidebarCollapsed && (
            <Tooltip title="Atualizar documentos">
              <IconButton 
                onClick={onRefresh}
                disabled={refreshing}
                size="small"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { 
                    color: theme.palette.primary.main,
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <RefreshIcon 
                  sx={{ 
                    fontSize: 20,
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} 
                />
              </IconButton>
            </Tooltip>
          )}
          {isMobile && (
            <IconButton 
              onClick={handleToggleSidebar}
              size="small"
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  color: theme.palette.primary.main,
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Conteúdo da Sidebar */}
      {!sidebarCollapsed && (
        <Box sx={{ p: 2, mb: -3 }}>
          <TextField
            fullWidth
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ 
              mb: 1,
              '& .MuiInputBase-root': {
                fontSize: '0.875rem',
                height: '36px'
              }
            }}
          />
          
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block', fontSize: '0.7rem' }}>
            Pressione Enter para buscar
          </Typography>
        </Box>
      )}

      {/* Lista de Categorias */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <List dense sx={{ px: sidebarCollapsed ? 0.5 : 0 }}>
          {renderCategoryTree(categories, 0, true)}
          
          {/* Link discreto para Gestão de Conteúdo quando collapsed */}
          {sidebarCollapsed && (
            <ListItem disablePadding>
              <Tooltip 
                title="Gestão de Conteúdo" 
                placement="right"
              >
                <ListItemButton
                  onClick={() => {
                    router.push('/gestao-de-conteudo');
                    if (isMobile) {
                      setSidebarOpen(false);
                    }
                  }}
                  sx={{
                    justifyContent: 'center',
                    px: 1,
                    minHeight: 40,
                    color: 'text.secondary',
                    '&:hover': {
                      color: theme.palette.primary.main,
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 0, 
                    justifyContent: 'center',
                    color: 'inherit'
                  }}>
                    <SettingsIcon sx={{ fontSize: 18 }} />
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )}
        </List>
      )}
    </>
  );

  return (
    <>
      {/* Desktop: Sidebar fixa */}
      {!isMobile && (
        <Paper 
          sx={{ 
            width: sidebarWidth,
            minWidth: sidebarWidth,
            maxWidth: sidebarWidth,
            overflowY: 'auto',
            borderRight: '1px solid #e0e0e0',
            borderRadius: 0,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {sidebarContent}
        </Paper>
      )}

      {/* Mobile: Drawer */}
      {isMobile && (
        <>
          <Drawer
            anchor="left"
            open={sidebarOpen}
            onClose={handleToggleSidebar}
            PaperProps={{
              sx: {
                width: '98%',
                maxWidth: 400,
                boxShadow: 3,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              }
            }}
            ModalProps={{
              keepMounted: true, // Melhor performance no mobile
            }}
          >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {sidebarContent}
            </Box>
          </Drawer>
          
          {/* Backdrop/Overlay quando sidebar aberta */}
          {sidebarOpen && (
            <Backdrop
              open={sidebarOpen}
              onClick={handleToggleSidebar}
              sx={{
                zIndex: 1199,
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
              }}
            />
          )}
        </>
      )}
    </>
  );
}


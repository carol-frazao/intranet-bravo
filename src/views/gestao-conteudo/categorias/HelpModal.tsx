'use client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import { Add, TrendUp, TrendDown, Timer, Hierarchy } from 'iconsax-reactjs';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight={700}>
          📚 Como Gerenciar Categorias
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Guia completo para criar, organizar e estruturar suas categorias
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Criar Categoria */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Add size="24" color={theme.palette.primary.main} variant="Bold" />
              <Typography variant="h6" fontWeight={600}>
                1. Criar Nova Categoria
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
              Clique no botão <strong>"Nova Categoria"</strong> no canto superior direito. Preencha o nome, descrição, cor e status. A nova categoria será adicionada ao final da lista.
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Reordenar */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <DragIndicatorIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
              <Typography variant="h6" fontWeight={600}>
                2. Reordenar Categorias
              </Typography>
            </Box>
            <List dense sx={{ pl: 2 }}>
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <TrendUp size="20" color={theme.palette.info.main} variant="Bold" />
                </ListItemIcon>
                <ListItemText 
                  primary="Mover para cima ou para baixo"
                  secondary="Clique e arraste o card verticalmente. O card será inserido na posição desejada."
                  primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.85rem' }}
                />
              </ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Aninhar (Criar Hierarquia) */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Hierarchy size="24" color={theme.palette.primary.main} variant="Bold" />
              <Typography variant="h6" fontWeight={600}>
                3. Criar Subcategorias (Aninhar)
              </Typography>
            </Box>
            <List dense sx={{ pl: 2 }}>
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Timer size="20" color={theme.palette.warning.main} variant="Bold" />
                </ListItemIcon>
                <ListItemText 
                  primary="Mantenha pressionado"
                  secondary="Arraste um card e mantenha-o sobre outro card por aproximadamente 0,5 segundos. O card ficará com borda tracejada azul."
                  primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.85rem' }}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Typography fontSize="20">🔷</Typography>
                </ListItemIcon>
                <ListItemText 
                  primary="Solte para aninhar"
                  secondary="Quando aparecer a borda tracejada, solte o card. Ele se tornará filho do card alvo e será numerado hierarquicamente (ex: 1, 1.1, 1.2)."
                  primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.85rem' }}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Typography fontSize="20">🔹</Typography>
                </ListItemIcon>
                <ListItemText 
                  primary="Alternativa de aninhamento"
                  secondary="Arraste o card para a direita, na posição desejada, para aninhar."
                  primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.85rem' }}
                />
              </ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Desaninhar (Subir Nível) */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <TrendDown size="24" color={theme.palette.primary.main} variant="Bold" />
              <Typography variant="h6" fontWeight={600}>
                4. Remover Aninhamento (Subir Nível)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
              Para subir um nível da subcategoria (desaninhar), arraste o card <strong>para a esquerda</strong> enquanto move. Isso "desaninha" o item, tornando-o irmão do seu antigo pai.
              Obs.: Caso enfrente dificuldades nesta ação, arraste para uma distância maior. Note que quanto maior a distância à esquerda, maior o nível de desaninhamento.
              Ou solte o card sobre o card pai, seguindo o mesmo processo de aninhamento descrito no item 3.
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Dicas */}
          <Box sx={{ 
            bgcolor: theme.palette.primary.light + '15', 
            borderLeft: `4px solid ${theme.palette.primary.main}`,
            p: 2,
            borderRadius: 1
          }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              💡 Dicas Importantes
            </Typography>
            <List dense>
              <ListItem disablePadding>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  • As categorias são numeradas automaticamente (1, 2, 3, 1.1, 1.2, etc.)
                </Typography>
              </ListItem>
              <ListItem disablePadding>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  • Linhas conectam visualmente as subcategorias aos seus pais
                </Typography>
              </ListItem>
              <ListItem disablePadding>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  • Para facilitar a identificação visual, use cores diferentes para as categorias e/ou subcategorias
                </Typography>
              </ListItem>
              <ListItem disablePadding>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  • Categorias inativas não aparecem para os usuários finais
                </Typography>
              </ListItem>
            </List>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Entendi
        </Button>
      </DialogActions>
    </Dialog>
  );
}


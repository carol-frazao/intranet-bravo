'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  Chip
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import api from '@/utils/axios';
import { useAppDispatch } from '@/redux-files/hooks';
import { deleteCategory, inactivateCategory } from '@/redux-files/slices/categoriesSlice';

interface Category {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
  children?: Category[];
}

interface CategoryActionModalProps {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  action: 'inactivate' | 'delete';
  onSuccess: () => void;
  allCategories: Category[];
}

export default function CategoryActionModal({
  open,
  onClose,
  category,
  action,
  onSuccess,
  allCategories
}: CategoryActionModalProps) {
  const dispatch = useAppDispatch();
  const [contentsCount, setContentsCount] = useState(0);
  const [contentAction, setContentAction] = useState<'inactivate' | 'move' | 'remove_category'>('remove_category');
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category && open) {
      loadContentsCount();
      setContentAction(action === 'inactivate' ? 'inactivate' : 'remove_category');
      setNewCategoryId(null);
    }
  }, [category, open, action]);

  const loadContentsCount = async () => {
    if (!category) return;
    try {
      const response = await api.get(`/intranet/categories/${category.id}/contents-count`);
      setContentsCount(response.data.count);
    } catch (error) {
      console.error('Error loading contents count:', error);
    }
  };

  const handleConfirm = async () => {
    if (!category) return;

    try {
      setLoading(true);

      const payload: any = {
        id: category.id,
        contentAction,
      };

      if (contentAction === 'move' && newCategoryId) {
        payload.newCategoryId = newCategoryId;
      }

      console.log('CategoryActionModal - Sending request:', {
        categoryId: category.id,
        action,
        payload
      });

      if (action === 'inactivate') {
        await dispatch(inactivateCategory(payload)).unwrap();
      } else {
        await dispatch(deleteCategory(payload)).unwrap();
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error processing category action:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar categorias para não permitir selecionar a própria categoria ou suas filhas
  const availableCategories = allCategories.filter(cat => 
    cat.id !== category?.id && cat.parentId !== category?.id
  );

  const isDeleteAction = action === 'delete';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color={isDeleteAction ? 'error' : 'warning'} />
        {isDeleteAction ? 'Excluir Categoria' : 'Inativar Categoria'}
      </DialogTitle>

      <DialogContent>
        {category && (
          <Box>
            <Alert severity={isDeleteAction ? 'error' : 'warning'} sx={{ mb: 3 }}>
              {isDeleteAction ? (
                <>
                  <strong>Atenção:</strong> Esta ação excluirá permanentemente a categoria 
                  <strong> "{category.name}"</strong> do banco de dados.
                </>
              ) : (
                <>
                  <strong>Atenção:</strong> Ao inativar a categoria 
                  <strong> "{category.name}"</strong>, ela ficará oculta no sistema.
                </>
              )}
            </Alert>

            {contentsCount > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Esta categoria possui <Chip label={contentsCount} size="small" color="primary" /> conteúdo(s).
                  O que deseja fazer com eles?
                </Typography>

                <RadioGroup value={contentAction} onChange={(e) => setContentAction(e.target.value as any)}>
                  {!isDeleteAction && (
                    <FormControlLabel
                      value="inactivate"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            Inativar conteúdos junto com a categoria
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Os conteúdos ficarão ocultos mas vinculados. Ao reativar a categoria, eles voltam.
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                  
                  <FormControlLabel
                    value="move"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          Mover para outra categoria
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Escolha uma nova categoria para esses conteúdos
                        </Typography>
                      </Box>
                    }
                  />

                  <FormControlLabel
                    value="remove_category"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          Deixar sem categoria
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Os conteúdos ficarão visíveis na seção "Sem Categoria"
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>

                {contentAction === 'move' && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Nova Categoria</InputLabel>
                    <Select
                      value={newCategoryId || ''}
                      label="Nova Categoria"
                      onChange={(e) => setNewCategoryId(Number(e.target.value))}
                    >
                      {availableCategories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            )}

            {isDeleteAction && contentsCount === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Esta categoria não possui conteúdos vinculados.
              </Typography>
            )}

            {!isDeleteAction && (
              <Alert severity="info" sx={{ mt: 2 }}>
                💡 <strong>Sugestão:</strong> Inativar mantém a categoria no banco. 
                Você poderá reativá-la depois se necessário.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={isDeleteAction ? 'error' : 'warning'}
          disabled={loading || (contentAction === 'move' && !newCategoryId)}
        >
          {loading ? 'Processando...' : isDeleteAction ? 'Excluir Permanentemente' : 'Inativar Categoria'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


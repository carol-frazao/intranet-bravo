'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CircularProgress,
  useTheme
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'react-toastify';
import ReturnBtn from '@/components/ReturnBtn';
import { useAppDispatch, useAppSelector } from '@/redux-files/hooks';
import { fetchCategories, updateCategory } from '@/redux-files/slices/categoriesSlice';

export default function CategoryEdit() {
  const router = useRouter();
  const { id } = useParams();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s) => s.categories.items);
  const loading = useAppSelector((s) => s.categories.loading);
  const contextGroups = useAppSelector((s: any) => s.context.availableGroups) as any[];
  const contextUnits = useAppSelector((s: any) => s.context.availableUnits) as any[];
  const selectedGroupIds = useAppSelector((s: any) => s.context.selectedGroupIds) as number[];
  const selectedUnitIds = useAppSelector((s: any) => s.context.selectedUnitIds) as number[];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: null as number | null,
    icon: '',
    color: theme.palette.primary.main,
    order: 0,
    status: 'active'
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const effectiveGroupIds = selectedGroupIds.length > 0 ? selectedGroupIds : contextGroups.map((g) => g.id);
    const effectiveUnitIds = selectedUnitIds.length > 0 ? selectedUnitIds : contextUnits.map((u) => u.id);
    dispatch(fetchCategories({ groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupIds.join(','), selectedUnitIds.join(','), contextGroups.length, contextUnits.length]);

  useEffect(() => {
    if (id && categories.length > 0) {
      loadCategory(Number(id));
    }
  }, [id, categories]);

  const findCategoryById = (cats: any[], categoryId: number): any | null => {
    for (const cat of cats) {
      if (cat.id === categoryId) return cat;
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryById(cat.children, categoryId);
        if (found) return found;
      }
    }
    return null;
  };

  const loadCategory = (categoryId: number) => {
    try {
      setInitialLoading(true);
      const category = findCategoryById(categories, categoryId);
      if (category) {
        setFormData({
          name: category.name,
          description: category.description,
          parentId: category.parentId,
          icon: category.icon || '',
          color: category.color || theme.palette.primary.main,
          order: category.order || 0,
          status: category.status || 'active'
        });
      }
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name) {
        toast.warning('Preencha o nome da categoria');
        return;
      }

      setSubmitting(true);
      await dispatch(updateCategory({ id: Number(id), ...formData })).unwrap();
      const effectiveGroupIds = selectedGroupIds.length > 0 ? selectedGroupIds : contextGroups.map((g) => g.id);
      const effectiveUnitIds = selectedUnitIds.length > 0 ? selectedUnitIds : contextUnits.map((u) => u.id);
      await dispatch(fetchCategories({ groupIds: effectiveGroupIds, unitIds: effectiveUnitIds })).unwrap();
      router.push('/gestao-de-conteudo/categorias');
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const flattenCategories = (cats: any[]): any[] => {
    let result: any[] = [];
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories);

  return (
    <Box>
      <ReturnBtn onClick={() => router.back()} />

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {initialLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Nome"
                fullWidth
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />

              <TextField
                label="Descrição"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Categoria Pai</InputLabel>
                  <Select
                    value={formData.parentId || ''}
                    label="Categoria Pai"
                    onChange={(e) => handleChange('parentId', e.target.value ? Number(e.target.value) : null)}
                  >
                    <MenuItem value="">Nenhuma (categoria raiz)</MenuItem>
                    {flatCategories
                      .filter(cat => cat.id !== Number(id))
                      .map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <MenuItem value="active">Ativo</MenuItem>
                    <MenuItem value="inactive">Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Cor"
                type="color"
                fullWidth
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                helperText="Escolha a cor da categoria (usado nos ícones)"
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => router.push('/gestao-de-conteudo/categorias')}>
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={submitting || loading}
                >
                  {submitting ? 'Atualizando...' : 'Atualizar Categoria'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
        )}
      </Container>
    </Box>
  );
}


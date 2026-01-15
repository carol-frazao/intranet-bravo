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
  AppBar,
  Toolbar,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import api from '@/utils/axios';
import { toast } from 'react-toastify';

export default function CategoryEdit() {
  const router = useRouter();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: null as number | null,
    icon: '',
    color: '#1976d2',
    order: 0,
    status: 'active'
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCategories();
      loadCategory(Number(id));
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await api.get('intranet/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCategory = async (categoryId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`intranet/categories/${categoryId}`);
      setFormData({
        name: response.data.name,
        description: response.data.description,
        parentId: response.data.parentId,
        icon: response.data.icon || '',
        color: response.data.color || '#1976d2',
        order: response.data.order || 0,
        status: response.data.status || 'active'
      });
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
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

      await api.put(`intranet/categories/${id}`, formData);
      toast.success('Categoria atualizada com sucesso!');
      router.push('/gestao-de-conteudo/categorias');
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Erro ao salvar categoria. Tente novamente.');
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
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" startIcon={<ArrowBackIcon />} onClick={() => router.push('/gestao-de-conteudo/categorias')}>
            Voltar
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
            Editar Categoria
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {loading ? (
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

              <TextField
                label="Ícone"
                fullWidth
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                helperText="Digite o nome do ícone Material-UI (opcional)"
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
                >
                  Atualizar Categoria
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

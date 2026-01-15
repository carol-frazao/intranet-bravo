'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  CardContent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import JoditEditor from '@/components/JoditEditor';
import FileUpload from '@/components/FileUpload';
import api from '@/utils/axios';
import { toast } from 'react-toastify';
import ReturnBtn from '@/components/ReturnBtn';
import { useAppDispatch, useAppSelector } from '@/redux-files/hooks';
import { fetchCategories } from '@/redux-files/slices/categoriesSlice';
import { createContent } from '@/redux-files/slices/contentsSlice';

export default function ContentForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const categoriesFromRedux = useAppSelector((s) => s.categories.items);
  const loading = useAppSelector((s) => s.categories.loading);
  const contextGroups = useAppSelector((s: any) => s.context.availableGroups) as any[];
  const contextUnits = useAppSelector((s: any) => s.context.availableUnits) as any[];
  const selectedGroupIds = useAppSelector((s: any) => s.context.selectedGroupIds) as number[];
  const selectedUnitIds = useAppSelector((s: any) => s.context.selectedUnitIds) as number[];

  const [formData, setFormData] = useState({
    title: '',
    categoryId: null as number | null,
    type: 'normativa',
    content: '',
    url: '',
    status: 'active',
    description: '',
    accessLevel: 'public'
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const effectiveGroupIds = selectedGroupIds.length > 0 ? selectedGroupIds : contextGroups.map((g) => g.id);
    const effectiveUnitIds = selectedUnitIds.length > 0 ? selectedUnitIds : contextUnits.map((u) => u.id);
    dispatch(fetchCategories({ groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupIds.join(','), selectedUnitIds.join(','), contextGroups.length, contextUnits.length]);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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

  const categories = flattenCategories(categoriesFromRedux);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title) {
        toast.warning('Preencha o título');
        return;
      }

      setSubmitting(true);
      
      // Pegar os grupos e unidades selecionados no header (ou todas se nenhuma selecionada)
      const effectiveGroupIds = selectedGroupIds.length > 0 ? selectedGroupIds : contextGroups.map((g) => g.id);
      const effectiveUnitIds = selectedUnitIds.length > 0 ? selectedUnitIds : contextUnits.map((u) => u.id);
      
      const dataToSend = {
        ...formData,
        publishedAt: new Date(),
        groupIds: effectiveGroupIds,
        unitIds: effectiveUnitIds,
      };

      // Criar o conteúdo usando Redux
      const result = await dispatch(createContent(dataToSend)).unwrap();
      const newContentId = result.id;

      // Se houver arquivos selecionados, fazer upload (mantém local - operação pontual)
      if (selectedFiles.length > 0) {
        const fileFormData = new FormData();
        selectedFiles.forEach(file => {
          fileFormData.append('medias', file);
        });

        await api.post(`/intranet/contents/${newContentId}/files`, fileFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Conteúdo e arquivos criados com sucesso!');
      }

      router.push('/gestao-de-conteudo');
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <ReturnBtn onClick={() => router.back()} />

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Criar Novo Conteúdo
            </Typography>
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Título"
                fullWidth
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth required>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={formData.categoryId || ''}
                    label="Categoria"
                    onChange={(e) => handleChange('categoryId', Number(e.target.value))}
                  >
                    {categories.length === 0 ? (
                      <MenuItem value="" disabled>
                        Nenhuma categoria disponível. Crie uma no painel admin.
                      </MenuItem>
                    ) : (
                      categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formData.type}
                    label="Tipo"
                    onChange={(e) => handleChange('type', e.target.value)}
                  >
                    <MenuItem value="normativa">Normativa</MenuItem>
                    <MenuItem value="link">Link</MenuItem>
                    <MenuItem value="aviso">Aviso</MenuItem>
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

              {formData.type === 'link' && (
                <TextField
                  label="URL"
                  fullWidth
                  value={formData.url}
                  onChange={(e) => handleChange('url', e.target.value)}
                  placeholder="https://exemplo.com"
                />
              )}

              {(formData.type === 'normativa' || formData.type === 'aviso') && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Conteúdo
                  </Typography>
                  <JoditEditor
                    value={formData.content}
                    onChange={(value) => handleChange('content', value)}
                    placeholder="Digite o conteúdo aqui..."
                    minHeight={400}
                  />
                </Box>
              )}

              {/* Seção de Anexos */}
              <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                <FileUpload
                  files={[]}
                  localFiles={selectedFiles}
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleRemoveFile}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="outlined" onClick={() => router.push('/gestao-de-conteudo')}>
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={submitting || loading}
                >
                  {submitting ? 'Criando...' : 'Criar Conteúdo'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}




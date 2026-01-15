'use client';
import { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import JoditEditor from '@/components/JoditEditor';
import api from '@/utils/axios';
import { toast } from 'react-toastify';
import ReturnBtn from '@/components/ReturnBtn';
import { useAppDispatch, useAppSelector } from '@/redux-files/hooks';
import { fetchCategories } from '@/redux-files/slices/categoriesSlice';
import { fetchContentById, updateContent } from '@/redux-files/slices/contentsSlice';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChangesViewer from '@/components/admin/ChangesViewer';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import { IconButton, ListItemSecondaryAction, Paper, Chip } from '@mui/material';

export default function ContentEdit() {
  const router = useRouter();
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const categoriesFromRedux = useAppSelector((s) => s.categories.items);
  const currentContent = useAppSelector((s) => s.contents.current);
  const loading = useAppSelector((s) => s.contents.loading);
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
  const [files, setFiles] = useState<any[]>([]); // Arquivos já salvos no servidor
  const [newFiles, setNewFiles] = useState<File[]>([]); // Arquivos novos (não salvos ainda)
  const [filesToDelete, setFilesToDelete] = useState<number[]>([]); // IDs para deletar
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedChanges, setSelectedChanges] = useState<string | null>(null);
  const [changesViewerOpen, setChangesViewerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Só busca se não tiver dados e não estiver carregando
    if (categoriesFromRedux.length === 0 && !loading) {
      const effectiveGroupIds = selectedGroupIds.length > 0 ? selectedGroupIds : contextGroups.map((g) => g.id);
      const effectiveUnitIds = selectedUnitIds.length > 0 ? selectedUnitIds : contextUnits.map((u) => u.id);
      dispatch(fetchCategories({ groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez ao montar

  useEffect(() => {
    if (id) {
      dispatch(fetchContentById(Number(id)));
      loadFiles();
    }
  }, [id, dispatch]);

  const loadFiles = useCallback(async () => {
    if (!id) return;
    try {
      const response = await api.get(`/intranet/contents/${id}/files`);
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  }, [id]);

  const loadLogs = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/intranet/contents/${id}/logs`, {
        params: { limit: 50 }
      });
      setLogs(res.data.logs || res.data);
    } catch (e) {
      console.error('Error loading logs:', e);
    }
  }, [id]);

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

  // Atualizar formData quando o conteúdo for carregado do Redux
  useEffect(() => {
    if (currentContent) {
      setFormData({
        title: currentContent.title,
        categoryId: currentContent.categoryId,
        type: currentContent.type,
        content: currentContent.content || '',
        url: currentContent.url || '',
        status: currentContent.status || 'active',
        description: currentContent.description || '',
        accessLevel: 'public'
      });
    }
  }, [currentContent]);

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

      // 1. Atualizar dados do conteúdo usando Redux
      const dataToSend = {
        id: Number(id),
        ...formData,
        publishedAt: new Date()
      };
      await dispatch(updateContent(dataToSend)).unwrap();

      // 2. Deletar arquivos marcados (mantém local - operação pontual)
      for (const fileId of filesToDelete) {
        try {
          await api.delete(`/intranet/files/${fileId}`);
        } catch (err) {
          console.error('Erro ao deletar arquivo:', err);
        }
      }

      // 3. Fazer upload dos novos arquivos (mantém local - operação pontual)
      if (newFiles.length > 0) {
        const fileFormData = new FormData();
        newFiles.forEach(file => {
          fileFormData.append('medias', file);
        });

        try {
          await api.post(`/intranet/contents/${id}/files`, fileFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (err) {
          console.error('Erro ao fazer upload:', err);
          toast.warning('Conteúdo salvo, mas houve erro no upload de alguns arquivos');
        }
      }

      router.back();
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    const filesArray = Array.from(files);
    setNewFiles(prev => [...prev, ...filesArray]);
  };

  const handleRemoveExistingFile = (fileId: number) => {
    setFilesToDelete(prev => [...prev, fileId]);
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PictureAsPdfIcon color="error" />;
    if (fileType.includes('image')) return <ImageIcon color="primary" />;
    if (fileType.includes('word') || fileType.includes('document')) return <DescriptionIcon color="info" />;
    return <InsertDriveFileIcon />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      <ReturnBtn title="Gestão de Conteúdo" url="/gestao-de-conteudo" />

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" gutterBottom>
                Editar Conteúdo
              </Typography>
              <Button variant="outlined" color="warning" sx={{ padding: '6px 16px', m: 0.5, fontSize: '0.9rem' }} onClick={() => { setLogsOpen(true); loadLogs(); }}>
                <HistoryIcon sx={{ mr: 1 }} fontSize="small" />
                Histórico de alterações
              </Button>
            </Stack>
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
                    placeholder={!formData.content ? "Digite o conteúdo aqui..." : ''}
                    minHeight={400}
                  />
                </Box>
              )}

              {/* Seção de Anexos */}
              {id && (
                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Anexos</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      sx={{ padding: '0.2rem 0.7rem' }}
                    >
                      Adicionar Arquivos
                      <input
                        type="file"
                        hidden
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            handleAddFiles(e.target.files);
                            e.target.value = '';
                          }
                        }}
                      />
                    </Button>
                  </Box>

                  {files.length === 0 && newFiles.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                      <InsertDriveFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Nenhum arquivo anexado
                      </Typography>
                    </Paper>
                  ) : (
                    <List>
                      {/* Arquivos novos (aguardando salvar) */}
                      {newFiles.map((file, index) => (
                        <ListItem
                          key={`new-${index}`}
                          sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: 'info.lighter',
                          }}
                        >
                          <Box sx={{ mr: 2 }}>
                            <InsertDriveFileIcon />
                          </Box>
                          <ListItemText
                            primary={file.name}
                            secondary={
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Chip label={formatFileSize(file.size)} size="small" />
                                <Chip label="Aguardando salvar" size="small" color="warning" variant="outlined" />
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveNewFile(index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}

                      {/* Arquivos já salvos */}
                      {files.filter(f => !filesToDelete.includes(f.id)).map((file) => (
                        <ListItem
                          key={file.id}
                          sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            mb: 1,
                            opacity: filesToDelete.includes(file.id) ? 0.5 : 1,
                          }}
                        >
                          <Box sx={{ mr: 2 }}>
                            {getFileIcon(file.fileType)}
                          </Box>
                          <ListItemText
                            primary={file.fileName}
                            secondary={
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                <Chip label={formatFileSize(file.fileSize)} size="small" />
                                <Chip label={new Date(file.createdAt).toLocaleDateString('pt-BR')} size="small" variant="outlined" />
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveExistingFile(file.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="outlined" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={submitting || loading}
                >
                  {submitting ? 'Atualizando...' : 'Atualizar Conteúdo'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>

      <Dialog open={logsOpen} onClose={() => setLogsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Histórico de alterações - {formData.title}</DialogTitle>
        <Divider sx={{ my: 0.5 }} />
        <DialogContent>
          <List>
            {logs?.length > 0 ? logs.map((log: any, idx: number) => (
              <Box key={log.id || idx}>
                <ListItem 
                  alignItems="flex-start"
                  secondaryAction={
                    log.changes && log.action === 'update' && (
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {
                          setSelectedChanges(log.changes);
                          setChangesViewerOpen(true);
                        }}
                      >
                        Ver mais
                      </Button>
                    )
                  }
                >
                  <ListItemText
                    primary={`${log.action?.toUpperCase()} • ${new Date(log.createdAt).toLocaleString('pt-BR')}`}
                    secondary={`Por: ${log.user?.name || 'Usuário'} (${log.user?.email || ''})`}
                  />
                </ListItem>
                {idx < logs.length - 1 && <Divider sx={{ my: 1.5 }} />}
              </Box>
            )) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Nenhum histórico de alterações encontrado.</Typography>
              </Box>
            )}
          </List>
        </DialogContent>
        <Divider sx={{ my: 0.5 }} />
        <DialogActions>
          <Button onClick={() => setLogsOpen(false)} variant="contained" sx={{ padding: '6px 16px', m: 0.5 }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de visualização de alterações */}
      <ChangesViewer
        open={changesViewerOpen}
        onClose={() => {
          setChangesViewerOpen(false);
          setSelectedChanges(null);
        }}
        changes={selectedChanges}
        title="Detalhes das Alterações"
      />
    </Box>
  );
}




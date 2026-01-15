'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HistoryIcon from '@mui/icons-material/History';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReturnBtn from '@/components/ReturnBtn';
import { Setting2 } from 'iconsax-reactjs';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/redux-files/hooks';
import { fetchAllContents, updateContent, deleteContent, inactivateContent } from '@/redux-files/slices/contentsSlice';

interface Content {
  id: number;
  title: string;
  type: string;
  status: string;
  authorId: number;
  author?: { name: string };
  publishedAt: string;
  views: number;
  category?: { name: string };
}

export default function GestaoConteudoDashboard() {
  const dispatch = useAppDispatch();
  const contentList = useAppSelector((s) => s.contents.items);
  const loading = useAppSelector((s) => s.contents.loading);
  const contextGroups = useAppSelector((s: any) => s.context.availableGroups) as any[];
  const contextUnits = useAppSelector((s: any) => s.context.availableUnits) as any[];
  const selectedGroupIds = useAppSelector((s: any) => s.context.selectedGroupIds) as number[];
  const selectedUnitIds = useAppSelector((s: any) => s.context.selectedUnitIds) as number[];
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<number | null>(null);
  const router = useRouter();

  const effectiveGroupIds = selectedGroupIds.length > 0 ? selectedGroupIds : contextGroups.map((g) => g.id);
  const effectiveUnitIds = selectedUnitIds.length > 0 ? selectedUnitIds : contextUnits.map((u) => u.id);
  const filterKey = `${effectiveGroupIds.join(',')}|${effectiveUnitIds.join(',')}`;

  useEffect(() => {
    if (contextGroups.length === 0 && contextUnits.length === 0) return;
    dispatch(fetchAllContents({ status: 'all', groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await dispatch(fetchAllContents({ status: 'all', groupIds: effectiveGroupIds, unitIds: effectiveUnitIds })).unwrap();
      toast.success('Lista atualizada!');
    } catch (error) {
      console.error('Error loading contents:', error);
      toast.error('Erro ao atualizar lista');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const content = contentList.find(c => c.id === id);
      if (!content) return;

      const newStatus = content.status === 'active' ? 'inactive' : 'active';
      await dispatch(updateContent({ id, status: newStatus })).unwrap();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDeleteClick = (id: number) => {
    setContentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleInactivate = async () => {
    if (!contentToDelete) return;

    try {
      await dispatch(inactivateContent(contentToDelete)).unwrap();
      setDeleteDialogOpen(false);
      setContentToDelete(null);
    } catch (error) {
      console.error('Error inactivating content:', error);
    }
  };

  const handleDeletePermanent = async () => {
    if (!contentToDelete) return;

    try {
      await dispatch(deleteContent(contentToDelete)).unwrap();
      setDeleteDialogOpen(false);
      setContentToDelete(null);
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Box>
      <ReturnBtn title="Tela Inicial" url="/" />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 3, gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" component="h1">
              Gestão de Conteúdo
            </Typography>
            <IconButton
              onClick={handleRefresh}
              disabled={loading || refreshing}
              size="small"
              title="Atualizar lista"
              sx={{ 
                ml: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <RefreshIcon 
                sx={{ 
                  fontSize: 22,
                  animation: refreshing ? 'spin 0.5s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} 
              />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => router.push('/gestao-de-conteudo/logs')}
            >
              Histórico Geral
            </Button>
            <Button
              variant="outlined"
              startIcon={<Setting2 />}
              onClick={() => router.push('/gestao-de-conteudo/categorias')}
            >
              Gerenciar Categorias
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/gestao-de-conteudo/conteudo/novo')}
            >
              Novo Conteúdo
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Autor</TableCell>
                  <TableCell>Publicado</TableCell>
                  <TableCell align="center">Visualizações</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contentList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Nenhum conteúdo encontrado
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  contentList.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell>{content.title}</TableCell>
                      <TableCell>{content.category?.name || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={content.type} 
                          size="small" 
                          color={content.type === 'normativa' ? 'primary' : 'info'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={content.status === 'active' ? 'Ativo' : 'Inativo'} 
                          size="small"
                          color={content.status === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{content.author?.name || '-'}</TableCell>
                      <TableCell>{formatDate(content.publishedAt)}</TableCell>
                      <TableCell align="center">{content.views}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small"
                          color="info"
                          onClick={() => router.push(`/conteudo/${content.id}`)}
                          title="Visualizar conteúdo"
                          sx={{ borderRadius: 0, mr: 0.6 }}
                        >
                          
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.07rem', display: 'flex', alignItems: 'center' }}>
                            <RemoveRedEyeIcon fontSize="small" sx={{ fontSize: '16px', mr: 0.7 }} />
                            Ver
                          </span>
                        </IconButton>

                        <IconButton 
                          size="small" 
                          color={content.status === 'inactive' ? 'error' : 'success'}
                          onClick={() => handleToggleStatus(content.id)}
                          title={content.status === 'active' ? 'Inativar conteúdo' : 'Ativar conteúdo'}
                        >
                          {content.status === 'active' ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => router.push(`/gestao-de-conteudo/conteudo/editar/${content.id}`)}
                          title="Editar"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeleteClick(content.id)}
                          title="Deletar"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      {/* Modal de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 600 }}>
          ⚠️ Atenção: Exclusão Permanente
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            <strong>Esta ação deletará permanentemente:</strong>
          </DialogContentText>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>O conteúdo do banco de dados</li>
            <li>Todos os arquivos anexados</li>
            <li>Esta ação não pode ser desfeita!</li>
          </Box>
          <DialogContentText sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            💡 <strong>Sugestão:</strong> Ao invés de deletar, você pode <strong>inativar</strong> este conteúdo. 
            Assim ele não ficará visível para a equipe, mas você poderá reativá-lo quando quiser.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleInactivate} 
            variant="outlined" 
            color="primary"
          >
            Apenas Inativar
          </Button>
          <Button 
            onClick={handleDeletePermanent} 
            variant="contained" 
            color="error"
          >
            Deletar Permanentemente
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
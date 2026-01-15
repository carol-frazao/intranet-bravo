'use client';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch, useAppSelector } from '@/redux-files/hooks';
import { fetchContentById, Content } from '@/redux-files/slices/contentsSlice';
import ReturnBtn from '@/components/ReturnBtn';
import api from '@/utils/axios';
import ChangesViewer from '@/components/admin/ChangesViewer';

export default function ContentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const content = useAppSelector((s) => s.contents.current) as Content;
  const loading = useAppSelector((s) => s.contents.loading);
  const profile = (session as any)?.profile?.toLowerCase();

  const [files, setFiles] = useState<any[]>([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<string | null>(null);
  const [changesViewerOpen, setChangesViewerOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchContentById(Number(id)));
      loadFiles();
    }
  }, [id, dispatch]);

  const loadFiles = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/intranet/contents/${id}/files`);
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const loadLogs = async () => {
    if (!id) return;
    try {
      setLoadingLogs(true);
      
      // Buscar logs gerais (IntranetLog - tem description)
      const responseGeneral = await api.get('/intranet/logs', {
        params: {
          itemId: Number(id),
          limit: 50
        }
      });
      
      // Buscar logs de conteúdo (IntranetContentLog - tem changes)
      const responseContent = await api.get(`/intranet/contents/${id}/logs`, {
        params: {
          limit: 50
        }
      });
      
      // Combinar: pegar description do IntranetLog e changes do IntranetContentLog
      const generalLogs = responseGeneral.data.logs || [];
      const contentLogs = responseContent.data.logs || [];
      
      // Mesclar os logs com base no timestamp
      const mergedLogs = contentLogs.map((log: any) => {
        const matchingGeneralLog = generalLogs.find((cLog: any) => {
          const diff = Math.abs(new Date(log.createdAt).getTime() - new Date(cLog.createdAt).getTime());
          return diff < 1000; // Margem de 1 segundo
        });
        
        return {
          ...log,
          description: matchingGeneralLog?.description || '--',
        };
      });
      
      setLogs(mergedLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (logsOpen) {
      loadLogs();
    }
  }, [logsOpen]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!content) {
    return <Typography>Conteúdo não encontrado</Typography>;
  }

  return (
    <Box>
      <ReturnBtn onClick={() => router.back()} />

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="overline" color="text.secondary">
            {content.category?.name || 'Sem categoria'} • {content.type}
          </Typography>
          <Typography variant="h4" component="h1" gutterBottom>
            {content.title || 'N/A'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3, color: 'text.secondary' }}>
            <Typography variant="body2">
              Por: {content.author?.name || 'Desconhecido'}
            </Typography>
            {content.publishedAt && (
              <Typography variant="body2">
                • Publicado em: {new Date(content.publishedAt).toLocaleDateString('pt-BR')}
              </Typography>
            )}
          </Box>
        </Box>

        <Card>
          <CardContent>
            {content.content || content.description ? (
              <Box 
                sx={{ 
                  '& h2': { mt: 3, mb: 2 },
                  '& h3': { mt: 2, mb: 1 },
                  '& p': { mb: 2 },
                  '& ul': { ml: 3, mb: 2 }
                }}
                dangerouslySetInnerHTML={{ __html: content.content || content.description }}
              />
            ) : <Typography variant="body2" color="text.secondary">
              N/A
            </Typography>}
          </CardContent>
        </Card>

        {/* Seção de Anexos */}
        {files?.length > 0 && (
          <Card sx={{ mt: 2.5 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Arquivos Anexos
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {files.map((file, index) => {
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
                    <ListItem
                      key={file.id}
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: index < files.length - 1 ? 1 : 0,
                        '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' }
                      }}
                      component="a"
                      href={file.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ListItemIcon>
                        {getFileIcon(file.fileType)}
                      </ListItemIcon>
                      <ListItemText
                        primary={file.fileName}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip label={formatFileSize(file.fileSize)} size="small" />
                            <Chip
                              label={new Date(file.createdAt).toLocaleDateString('pt-BR')}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                      <DownloadIcon sx={{ color: 'text.secondary' }} />
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        )}

        {profile === 'admin' && (
          <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              color="warning"
              startIcon={<HistoryIcon />}
              onClick={() => setLogsOpen(true)}
              sx={{ padding: '0.4rem 1rem' }}
            >
              Histórico
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/gestao-de-conteudo/conteudo/editar/${content.id}`)}
              sx={{ padding: '0.4rem 1rem' }}
            >
              Editar Conteúdo
            </Button>
          </Box>
        )}
      </Container>

      {/* Dialog de Histórico */}
      <Dialog open={logsOpen} onClose={() => setLogsOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Histórico de Alterações - {content?.title}</DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          {loadingLogs ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : logs.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum histórico encontrado
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Data/Hora</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ação</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Usuário</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 150 }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => {
                    const getActionLabel = (action: string) => {
                      const labels: Record<string, { label: string; color: 'error' | 'warning' | 'info' | 'success' }> = {
                        create: { label: 'Criação', color: 'success' },
                        update: { label: 'Alteração', color: 'info' },
                        delete: { label: 'Exclusão', color: 'error' },
                        // Ações antigas (manter compatibilidade)
                        create_content: { label: 'Criação', color: 'success' },
                        update_content: { label: 'Alteração', color: 'info' },
                        activate_content: { label: 'Ativação', color: 'success' },
                        inactivate_content: { label: 'Inativação', color: 'warning' },
                        delete_content: { label: 'Exclusão', color: 'error' },
                      };
                      return labels[action] || { label: action, color: 'info' };
                    };

                    const actionInfo = getActionLabel(log.action);
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2">
                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={actionInfo.label}
                            color={actionInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {log.user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {log.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {log.changes && log.action === 'update' ? (
                            <Button
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => {
                                setSelectedChanges(log.changes);
                                setChangesViewerOpen(true);
                              }}
                              sx={{ whiteSpace: 'nowrap', padding: '4px 8px' }}
                            >
                              Ver mais
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={() => setLogsOpen(false)} variant="contained">
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




'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReturnBtn from '@/components/ReturnBtn';
import api from '@/utils/axios';
import { useRouter } from 'next/navigation';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChangesViewer from '@/components/admin/ChangesViewer';

interface Log {
  id: number;
  userId: number;
  action: string;
  description: string;
  metadata: any;
  createdAt: string;
  changes?: string | null; // Campo de alterações detalhadas
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedChanges, setSelectedChanges] = useState<string | null>(null);
  const [changesViewerOpen, setChangesViewerOpen] = useState(false);
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filterAction, filterUser, page]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/intranet/logs/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = { 
        page,
        limit: itemsPerPage 
      };
      
      if (filterAction !== 'all') {
        params.action = filterAction;
      }
      
      if (filterUser !== 'all') {
        params.userId = filterUser;
      }
      
      // Buscar logs gerais (IntranetLog - tem description)
      const responseGeneral = await api.get('/intranet/logs', { params });
      const generalLogs = responseGeneral.data.logs || [];
      
      // Buscar todos os logs de conteúdo (IntranetContentLog - tem changes)
      // Buscar sem filtros para ter todos os changes disponíveis
      const responseContent = await api.get('/intranet/contents/logs/all', { 
        params: { limit: 1000 } 
      });
      const contentLogs = responseContent.data || [];
      
      // Mesclar: pegar description do IntranetLog e changes do IntranetContentLog
      const mergedLogs = generalLogs.map((genLog: any) => {
        const matchingContentLog = contentLogs.find((cLog: any) => {
          const diff = Math.abs(new Date(genLog.createdAt).getTime() - new Date(cLog.createdAt).getTime());
          return diff < 1000 && cLog.action === 'update'; // Margem de 1 segundo
        });
        
        return {
          ...genLog,
          changes: matchingContentLog?.changes || null,
        };
      });
      
      setLogs(mergedLogs);
      setTotal(responseGeneral.data.total);
      setTotalPages(responseGeneral.data.totalPages);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, { label: string; color: 'error' | 'warning' | 'info' | 'success' }> = {
      // Conteúdos
      create_content: { label: 'Criação de Conteúdo', color: 'success' },
      update_content: { label: 'Atualização de Conteúdo', color: 'info' },
      activate_content: { label: 'Ativação de Conteúdo', color: 'success' },
      inactivate_content: { label: 'Inativação de Conteúdo', color: 'warning' },
      delete_content: { label: 'Exclusão de Conteúdo', color: 'error' },
      // Categorias
      create_category: { label: 'Criação de Categoria', color: 'success' },
      update_category: { label: 'Atualização de Categoria', color: 'info' },
      activate_category: { label: 'Ativação de Categoria', color: 'success' },
      inactivate_category: { label: 'Inativação de Categoria', color: 'warning' },
      delete_category: { label: 'Exclusão de Categoria', color: 'error' },
    };
    return labels[action] || { label: action, color: 'info' };
  };

  return (
    <Box>
      <ReturnBtn onClick={() => router.back()} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
            Histórico Geral do Sistema
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Filtrar por Ação</InputLabel>
              <Select
                value={filterAction}
                label="Filtrar por Ação"
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="all">Todas as Ações</MenuItem>
                <MenuItem value="create_content">Criações de Conteúdo</MenuItem>
                <MenuItem value="update_content">Atualizações de Conteúdo</MenuItem>
                <MenuItem value="activate_content">Ativações de Conteúdo</MenuItem>
                <MenuItem value="inactivate_content">Inativações de Conteúdo</MenuItem>
                <MenuItem value="delete_content">Exclusões de Conteúdo</MenuItem>
                <MenuItem value="create_category">Criações de Categoria</MenuItem>
                <MenuItem value="update_category">Atualizações de Categoria</MenuItem>
                <MenuItem value="activate_category">Ativações de Categoria</MenuItem>
                <MenuItem value="inactivate_category">Inativações de Categoria</MenuItem>
                <MenuItem value="delete_category">Exclusões de Categoria</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Filtrar por Usuário</InputLabel>
              <Select
                value={filterUser}
                label="Filtrar por Usuário"
                onChange={(e) => {
                  setFilterUser(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="all">Todos os Usuários</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total: {total} registro{total !== 1 ? 's' : ''}
              </Typography>
              <Tooltip title="Atualizar logs">
                <IconButton 
                  onClick={loadLogs} 
                  disabled={loading}
                  color="primary"
                  size="small"
                  sx={{ 
                    bgcolor: 'primary.lighter',
                    '&:hover': { 
                      bgcolor: 'primary.main',
                      '& .MuiSvgIcon-root': {
                        color: 'white'
                      }
                    }
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Nenhum log encontrado</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Data/Hora</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ação</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Usuário</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => {
                  const actionInfo = getActionLabel(log.action);
                  return (
                    <TableRow key={log.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2">{formatDate(log.createdAt)}</Typography>
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
                        {log.changes && (log.action === 'update_content' || log.action === 'update') ? (
                          <Button
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => {
                              setSelectedChanges(log.changes || null);
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

        {!loading && logs.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}

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
      </Container>
    </Box>
  );
}


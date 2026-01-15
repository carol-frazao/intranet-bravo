'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
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
  Pagination,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppDispatch, useAppSelector } from '@/redux-files/hooks';
import { fetchUsers, deleteUser, inactivateUser, fetchUserById } from '@/redux-files/slices/usersSlice';
import { fetchProfiles } from '@/redux-files/slices/profilesSlice';
import { toast } from 'react-toastify';
import UserModal from './UserModal';
import DeleteUserDialog from './DeleteUserDialog';
import { keyframes } from '@emotion/react';

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export default function UserList() {
  const dispatch = useAppDispatch();
  const { users, total, totalPages, currentPage, loading } = useAppSelector((state) => state.users);
  const { profiles } = useAppSelector((state) => state.profiles);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userToDeletePermanently, setUserToDeletePermanently] = useState<{ id: number; name: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUsers();
    // Carregar perfis para o select
    dispatch(fetchProfiles({ status: 'active', limit: 100 }));
  }, [page, filterStatus]);

  const loadUsers = (showRefreshing: boolean = false) => {
    if (showRefreshing) setRefreshing(true);
    dispatch(fetchUsers({
      page,
      limit: 10,
      status: filterStatus,
      search: searchTerm,
    })).finally(() => {
      if (showRefreshing) {
        setTimeout(() => setRefreshing(false), 500);
      }
    });
  };

  const handleRefresh = () => {
    loadUsers(true);
  };

  const handleSearch = () => {
    setPage(1); // Reset to first page on search
    loadUsers();
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };


  const handleCreateUser = () => {
    setEditingUser(null);
    setUserModalOpen(true);
  };

  const handleEditUser = async (user: any) => {
    try {
      // Buscar usuário completo com grupos e unidades
      const fullUser = await dispatch(fetchUserById(user.id)).unwrap();
      setEditingUser(fullUser);
      setUserModalOpen(true);
    } catch (error: any) {
      toast.error('Erro ao carregar dados do usuário');
      console.error('Erro ao buscar usuário:', error);
    }
  };

  const handleInactivateClick = async (userId: number) => {
    try {
      await dispatch(inactivateUser(userId)).unwrap();
      loadUsers();
    } catch (error: any) {
      // Erro já tratado no slice
    }
  };


  const handleDeleteClick = (user: any) => {
    setUserToDeletePermanently({ id: user.id, name: user.name });
    setDeleteUserDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDeletePermanently) return;
    try {
      await dispatch(deleteUser(userToDeletePermanently.id)).unwrap();
      setDeleteUserDialogOpen(false);
      setUserToDeletePermanently(null);
      loadUsers();
    } catch (error: any) {
      // Erro já tratado no slice
    }
  };

  const handleInactivateFromDeleteDialog = async () => {
    if (!userToDeletePermanently) return;
    try {
      await dispatch(inactivateUser(userToDeletePermanently.id)).unwrap();
      setDeleteUserDialogOpen(false);
      setUserToDeletePermanently(null);
      loadUsers();
    } catch (error: any) {
      // Erro já tratado no slice
    }
  };

  const handleModalClose = (shouldRefresh?: boolean) => {
    setUserModalOpen(false);
    setEditingUser(null);
    if (shouldRefresh) {
      loadUsers();
    }
  };

  const getStatusChip = (status: string) => {
    if (status === 'active') {
      return <Chip label="Ativo" color="success" size="small" />;
    }
    return <Chip label="Inativo" color="error" size="small" />;
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" component="h2">
            Gestão de Usuários
          </Typography>
          <Tooltip title="Atualizar lista">
            <IconButton 
              onClick={handleRefresh} 
              disabled={loading || refreshing}
              sx={{ 
                animation: refreshing ? `${rotate} 1s linear infinite` : 'none',
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateUser}
          sx={{ padding: '6px 16px' }}
        >
          Cadastrar Novo Usuário
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="center">
        <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Buscar por nome, email ou username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            size="small"
          />
          <Tooltip title="Buscar">
            <IconButton 
              onClick={handleSearch}
              color="primary"
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                '&:hover': { 
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="active">Ativos</MenuItem>
            <MenuItem value="inactive">Inativos</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Tabela de Usuários */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', mt: 3 }}>
          <Typography variant="body1" color="text.secondary">
            Nenhum usuário encontrado.
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Perfil</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {user.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.profile} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>{getStatusChip(user.status)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEditUser(user)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.status === 'active' ? 'Inativar usuário' : 'Ativar usuário'}>
                        <IconButton
                          size="small"
                          color={user.status === 'active' ? 'warning' : 'secondary'}
                          onClick={() => handleInactivateClick(user.id)}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir usuário permanentemente">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginação */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}

          {/* Informações */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Exibindo {users.length} de {total} usuário(s)
            </Typography>
          </Box>
        </>
      )}

      {/* Modal de Criação/Edição */}
      <UserModal
        open={userModalOpen}
        onClose={handleModalClose}
        user={editingUser}
        profiles={profiles}
      />

      {/* Dialog de Confirmação de Exclusão Permanente */}
      <DeleteUserDialog
        open={deleteUserDialogOpen}
        onClose={() => {
          setDeleteUserDialogOpen(false);
          setUserToDeletePermanently(null);
        }}
        onInactivate={handleInactivateFromDeleteDialog}
        onConfirmDelete={handleConfirmDelete}
        userName={userToDeletePermanently?.name || ''}
      />
    </Box>
  );
}


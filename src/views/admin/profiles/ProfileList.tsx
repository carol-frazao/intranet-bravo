'use client';
import { useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import BlockIcon from '@mui/icons-material/Block';
import { useAppDispatch, useAppSelector } from '@/redux-files/hooks';
import { fetchProfiles, createProfile, updateProfile, deleteProfile, toggleProfileStatus } from '@/redux-files/slices/profilesSlice';
import { toast } from 'react-toastify';
import type { Profile } from '@/redux-files/slices/profilesSlice';
import DeleteConfirmDialog from '../users/DeleteConfirmDialog';
import RelationshipConfirmDialog from '../users/RelationshipConfirmDialog';
import { keyframes } from '@emotion/react';
import { Stack } from '@mui/material';

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export default function ProfileList() {
  const dispatch = useAppDispatch();
  const { profiles, total, totalPages, currentPage, loading } = useAppSelector((state) => state.profiles);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<number | null>(null);
  const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false);
  const [relationshipData, setRelationshipData] = useState<{
    id: number;
    usersCount: number;
    actionType: 'delete' | 'inactivate';
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'active',
  });

  useEffect(() => {
    loadProfiles();
  }, [page, filterStatus]);

  useEffect(() => {
    if (editingProfile) {
      setFormData({
        name: editingProfile.name,
        code: (editingProfile as any).code || '',
        status: editingProfile.status,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        status: 'active',
      });
    }
  }, [editingProfile]);

  const loadProfiles = (showRefreshing: boolean = false) => {
    if (showRefreshing) setRefreshing(true);
    dispatch(fetchProfiles({
      page,
      limit: 10,
      search: searchTerm,
      status: filterStatus,
    })).finally(() => {
      if (showRefreshing) {
        setTimeout(() => setRefreshing(false), 500);
      }
    });
  };

  const handleRefresh = () => {
    loadProfiles(true);
  };

  const handleSearch = () => {
    setPage(1);
    loadProfiles();
  };

  const handleStatusChange = (event: any) => {
    setFilterStatus(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleCreateProfile = () => {
    setEditingProfile(null);
    setProfileModalOpen(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setProfileModalOpen(true);
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const result = await dispatch(toggleProfileStatus({ id, force: false })).unwrap();
      // Se precisa de confirmação, mostrar modal
      if (result.data?.needsConfirmation) {
        setRelationshipData({
          id,
          usersCount: result.data.usersCount,
          actionType: 'inactivate',
        });
        setRelationshipDialogOpen(true);
        return;
      }
      toast.success('Status do perfil alterado!');
      loadProfiles();
    } catch (error: any) {
      toast.error(error || 'Erro ao alterar status');
    }
  };

  const handleConfirmRelationship = async () => {
    if (!relationshipData) return;
    try {
      if (relationshipData.actionType === 'delete') {
        await dispatch(deleteProfile({ id: relationshipData.id, force: true })).unwrap();
        toast.success('Perfil deletado com sucesso!');
      } else {
        await dispatch(toggleProfileStatus({ id: relationshipData.id, force: true })).unwrap();
        toast.success('Status do perfil alterado!');
      }
      setRelationshipDialogOpen(false);
      setRelationshipData(null);
      loadProfiles();
    } catch (error: any) {
      toast.error(error || 'Erro ao processar ação');
    }
  };

  const handleDeleteClick = (profileId: number) => {
    setProfileToDelete(profileId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;
    try {
      const result = await dispatch(deleteProfile({ id: profileToDelete, force: false })).unwrap();
      // Se precisa de confirmação, mostrar modal
      if (result.data?.needsConfirmation) {
        setRelationshipData({
          id: profileToDelete,
          usersCount: result.data.usersCount,
          actionType: 'delete',
        });
        setDeleteDialogOpen(false);
        setRelationshipDialogOpen(true);
        return;
      }
      toast.success('Perfil deletado com sucesso!');
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
      loadProfiles();
    } catch (error: any) {
      toast.error(error || 'Erro ao deletar perfil');
    }
  };

  const handleModalClose = () => {
    setProfileModalOpen(false);
    setEditingProfile(null);
  };

  const handleFormSubmit = async () => {
    if (!formData.name) {
      toast.warning('Nome do perfil é obrigatório');
      return;
    }

    try {
      setFormLoading(true);

      if (editingProfile) {
        await dispatch(
          updateProfile({
            id: editingProfile.id,
            data: formData,
          })
        ).unwrap();
        toast.success('Perfil atualizado!');
      } else {
        await dispatch(createProfile(formData)).unwrap();
        toast.success('Perfil criado!');
      }

      handleModalClose();
      loadProfiles();
    } catch (error: any) {
      toast.error(error || 'Erro ao salvar perfil');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" component="h2">
            Gestão de Perfis
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
          onClick={handleCreateProfile}
          sx={{ padding: '6px 16px' }}
        >
          Cadastrar Novo Perfil
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="center">
        <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Buscar por nome ou código..."
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
            onChange={handleStatusChange}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="active">Ativos</MenuItem>
            <MenuItem value="inactive">Inativos</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Tabela de Perfis */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : profiles?.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', mt: 3 }}>
          <Typography variant="body1" color="text.secondary">
            Nenhum perfil encontrado.
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {profile.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {(profile as any).code || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {profile.status === 'active' ? (
                        <Chip label="Ativo" color="success" size="small" />
                      ) : (
                        <Chip label="Inativo" color="error" size="small" />
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEditProfile(profile)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={profile.status === 'active' ? 'Inativar perfil' : 'Ativar perfil'}>
                        <IconButton
                          size="small"
                          color={profile.status === 'active' ? 'warning' : 'secondary'}
                          onClick={() => handleToggleStatus(profile.id)}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deletar permanentemente">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(profile.id)}
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

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Exibindo {profiles.length} de {total} perfil(is)
            </Typography>
          </Box>
        </>
      )}

      {/* Modal de Criação/Edição */}
      <Dialog open={profileModalOpen} onClose={handleModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProfile ? 'Editar Perfil' : 'Novo Perfil'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Nome do Perfil"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    // Gerar code automaticamente
                    const code = name.toLowerCase()
                      .replace(/[^a-z0-9]/g, '_')
                      .replace(/_+/g, '_')
                      .replace(/^_|_$/g, '');
                    setFormData({ ...formData, name, code });
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Código"
                  fullWidth
                  value={formData.code}
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Gerado automaticamente a partir do nome (lowercase, sem espaços)"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="active">Ativo</MenuItem>
                    <MenuItem value="inactive">Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose} disabled={formLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            disabled={formLoading}
            startIcon={formLoading && <CircularProgress size={20} />}
          >
            {editingProfile ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProfileToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Deletar Perfil"
        message="Tem certeza que deseja deletar este perfil permanentemente? Esta ação é irreversível. Se houver usuários vinculados, eles ficarão órfãos deste perfil."
      />

      <RelationshipConfirmDialog
        open={relationshipDialogOpen}
        onClose={() => {
          setRelationshipDialogOpen(false);
          setRelationshipData(null);
        }}
        onConfirm={handleConfirmRelationship}
        title={relationshipData?.actionType === 'delete' ? 'Deletar Perfil' : 'Inativar Perfil'}
        message={relationshipData?.actionType === 'delete' 
          ? 'Os usuários vinculados ficarão órfãos deste perfil.'
          : 'Inativá-lo irá remover estes relacionamentos.'
        }
        usersCount={relationshipData?.usersCount || 0}
        actionType={relationshipData?.actionType || 'delete'}
        itemType="perfil"
      />
    </Box>
  );
}


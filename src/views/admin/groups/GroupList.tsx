'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, IconButton,
  TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppDispatch, useAppSelector } from '@/redux-files/hooks';
import { fetchGroups, createGroup, updateGroup, deleteGroup, toggleGroupStatus } from '@/redux-files/slices/groupsSlice';
import { keyframes } from '@emotion/react';
import Tooltip from '@mui/material/Tooltip';
import DeleteConfirmDialog from '../users/DeleteConfirmDialog';
import RelationshipConfirmDialog from '../users/RelationshipConfirmDialog';
import BlockIcon from '@mui/icons-material/Block';

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

interface Group {
  id: number;
  name: string;
  code: string;
  status: string;
  createdAt: string;
}

export default function GroupList() {
  const dispatch = useAppDispatch();
  const { items: groups, loading } = useAppSelector(state => state.groups);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false);
  const [relationshipData, setRelationshipData] = useState<{
    id: number;
    usersCount: number;
    actionType: 'delete' | 'inactivate';
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'active',
  });

  const loadGroups = useCallback(async (showRefreshing: boolean = false, search?: string) => {
    if (showRefreshing) setRefreshing(true);
    await dispatch(fetchGroups({
      search: search !== undefined ? search : searchTerm,
      status: filterStatus,
    }));
    if (showRefreshing) {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filterStatus]);

  useEffect(() => {
    loadGroups(false, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearch = () => {
    loadGroups(false, searchTerm);
  };

  const handleStatusChange = (event: any) => {
    setFilterStatus(event.target.value);
  };

  const handleCreateGroup = () => {
    setCurrentGroup(null);
    setFormData({ name: '', code: '', status: 'active' });
    setGroupModalOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    setCurrentGroup(group);
    setFormData({
      name: group.name,
      code: group.code || '',
      status: group.status,
    });
    setGroupModalOpen(true);
  };

  const handleCloseGroupModal = () => {
    setGroupModalOpen(false);
    setCurrentGroup(null);
    loadGroups();
  };

  const handleDeleteGroup = (id: number) => {
    setGroupToDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDeleteId) return;
    try {
      const result = await dispatch(deleteGroup({ id: groupToDeleteId, force: false })).unwrap();
      // Se precisa de confirmação, mostrar modal
      if (result.needsConfirmation) {
        setRelationshipData({
          id: groupToDeleteId,
          usersCount: result.data.usersCount,
          actionType: 'delete',
        });
        setDeleteConfirmOpen(false);
        setRelationshipDialogOpen(true);
        return;
      }
      setDeleteConfirmOpen(false);
      setGroupToDeleteId(null);
      loadGroups();
    } catch (error: any) {
      // Erro já tratado no slice
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const result = await dispatch(toggleGroupStatus({ id, force: false })).unwrap();
      // Se precisa de confirmação, mostrar modal
      if (result.needsConfirmation) {
        setRelationshipData({
          id,
          usersCount: result.data.usersCount,
          actionType: 'inactivate',
        });
        setRelationshipDialogOpen(true);
        return;
      }
      loadGroups();
    } catch (error: any) {
      // Erro já tratado no slice
    }
  };

  const handleConfirmRelationship = async () => {
    if (!relationshipData) return;
    try {
      if (relationshipData.actionType === 'delete') {
        await dispatch(deleteGroup({ id: relationshipData.id, force: true })).unwrap();
      } else {
        await dispatch(toggleGroupStatus({ id: relationshipData.id, force: true })).unwrap();
      }
      setRelationshipDialogOpen(false);
      setRelationshipData(null);
      loadGroups();
    } catch (error: any) {
      // Erro já tratado no slice
    }
  };

  const handleRefresh = () => {
    loadGroups(true);
  };

  const handleSubmit = async () => {
    try {
      if (currentGroup) {
        await dispatch(updateGroup({ id: currentGroup.id, groupData: formData })).unwrap();
      } else {
        await dispatch(createGroup(formData)).unwrap();
      }
      handleCloseGroupModal();
    } catch (error) {
      // Erro já tratado no slice
    }
  };

  const getStatusChip = (status: string) => {
    const color = status === 'active' ? 'success' : 'error';
    const label = status === 'active' ? 'Ativo' : 'Inativo';
    return <Chip label={label} color={color} size="small" />;
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" component="h2">
            Gestão de Grupos
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
          onClick={handleCreateGroup}
          sx={{ padding: '6px 16px' }}
        >
          Cadastrar Novo Grupo
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="center">
        <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Buscar por nome ou código..."
            value={searchTerm}
            onChange={handleSearchChange}
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : groups.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Nenhum grupo encontrado.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="groups table">
            <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow
                  key={group.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {group.name}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {group.code || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(group.status)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar grupo">
                      <IconButton color="primary" onClick={() => handleEditGroup(group)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={group.status === 'active' ? 'Inativar grupo' : 'Ativar grupo'}>
                      <IconButton color={group.status === 'active' ? 'warning' : 'secondary'} onClick={() => handleToggleStatus(group.id)}>
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir grupo">
                      <IconButton color="error" onClick={() => handleDeleteGroup(group.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Group Modal (Create/Edit) */}
      <Dialog open={groupModalOpen} onClose={handleCloseGroupModal} maxWidth="sm" fullWidth>
        <DialogTitle>{currentGroup ? 'Editar Grupo' : 'Cadastrar Novo Grupo'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              name="name"
              label="Nome do Grupo"
              fullWidth
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                // Gerar code automaticamente
                const code = name.toLowerCase()
                  .replace(/[^a-z0-9]/g, '_')
                  .replace(/_+/g, '_')
                  .replace(/^_|_$/g, '');
                setFormData(prev => ({ ...prev, name, code }));
              }}
              required
              disabled={!!currentGroup}
            />
            <TextField
              name="code"
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
            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="active">Ativo</MenuItem>
                <MenuItem value="inactive">Inativo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupModal} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (currentGroup ? 'Salvar Alterações' : 'Cadastrar Grupo')}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Deletar Grupo"
        message="Tem certeza que deseja deletar este grupo? Esta ação é irreversível. Se houver usuários vinculados, eles ficarão órfãos deste grupo."
      />

      <RelationshipConfirmDialog
        open={relationshipDialogOpen}
        onClose={() => {
          setRelationshipDialogOpen(false);
          setRelationshipData(null);
        }}
        onConfirm={handleConfirmRelationship}
        title={relationshipData?.actionType === 'delete' ? 'Deletar Grupo' : 'Inativar Grupo'}
        message={relationshipData?.actionType === 'delete' 
          ? 'Os usuários vinculados ficarão órfãos deste grupo.'
          : 'Inativá-lo irá remover estes relacionamentos.'
        }
        usersCount={relationshipData?.usersCount || 0}
        actionType={relationshipData?.actionType || 'delete'}
        itemType="grupo"
      />
    </Box>
  );
}


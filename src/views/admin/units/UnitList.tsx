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
import { fetchUnits, createUnit, updateUnit, deleteUnit, toggleUnitStatus } from '@/redux-files/slices/unitsSlice';
import BlockIcon from '@mui/icons-material/Block';
import { toast } from 'react-toastify';
import { keyframes } from '@emotion/react';
import Tooltip from '@mui/material/Tooltip';
import DeleteConfirmDialog from '../users/DeleteConfirmDialog';
import RelationshipConfirmDialog from '../users/RelationshipConfirmDialog';

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

interface Unit {
  id: number;
  name: string;
  code: string;
  status: string;
  createdAt: string;
}

export default function UnitList() {
  const dispatch = useAppDispatch();
  const { items: units, loading } = useAppSelector(state => state.units);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [unitToDeleteId, setUnitToDeleteId] = useState<number | null>(null);
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

  const loadUnits = useCallback(async (showRefreshing: boolean = false, search?: string) => {
    if (showRefreshing) setRefreshing(true);
    await dispatch(fetchUnits({
      search: search !== undefined ? search : searchTerm,
      status: filterStatus,
    }));
    if (showRefreshing) {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filterStatus]);

  useEffect(() => {
    loadUnits(false, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearch = () => {
    loadUnits(false, searchTerm);
  };

  const handleStatusChange = (event: any) => {
    setFilterStatus(event.target.value);
  };

  const handleCreateUnit = () => {
    setCurrentUnit(null);
    setFormData({ name: '', code: '', status: 'active' });
    setUnitModalOpen(true);
  };

  const handleEditUnit = (unit: Unit) => {
    setCurrentUnit(unit);
    setFormData({
      name: unit.name,
      code: unit.code,
      status: unit.status,
    });
    setUnitModalOpen(true);
  };

  const handleCloseUnitModal = () => {
    setUnitModalOpen(false);
    setCurrentUnit(null);
    loadUnits();
  };

  const handleDeleteUnit = (id: number) => {
    setUnitToDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!unitToDeleteId) return;
    try {
      const result = await dispatch(deleteUnit({ id: unitToDeleteId, force: false })).unwrap();
      // Se precisa de confirmação, mostrar modal
      if (result.needsConfirmation) {
        setRelationshipData({
          id: unitToDeleteId,
          usersCount: result.data.usersCount,
          actionType: 'delete',
        });
        setDeleteConfirmOpen(false);
        setRelationshipDialogOpen(true);
        return;
      }
      setDeleteConfirmOpen(false);
      setUnitToDeleteId(null);
      loadUnits();
    } catch (error: any) {
      // Erro já tratado no slice
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const result = await dispatch(toggleUnitStatus({ id, force: false })).unwrap();
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
      loadUnits();
    } catch (error: any) {
      // Erro já tratado no slice
    }
  };

  const handleConfirmRelationship = async () => {
    if (!relationshipData) return;
    try {
      if (relationshipData.actionType === 'delete') {
        await dispatch(deleteUnit({ id: relationshipData.id, force: true })).unwrap();
      } else {
        await dispatch(toggleUnitStatus({ id: relationshipData.id, force: true })).unwrap();
      }
      setRelationshipDialogOpen(false);
      setRelationshipData(null);
      loadUnits();
    } catch (error: any) {
      // Erro já tratado no slice
    }
  };

  const handleRefresh = () => {
    loadUnits(true);
  };

  const handleSubmit = async () => {
    try {
      if (currentUnit) {
        await dispatch(updateUnit({ id: currentUnit.id, unitData: formData })).unwrap();
      } else {
        await dispatch(createUnit(formData)).unwrap();
      }
      handleCloseUnitModal();
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
            Gestão de Unidades
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
          onClick={handleCreateUnit}
          sx={{ padding: '6px 16px' }}
        >
          Cadastrar Nova Unidade
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
      ) : units.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Nenhuma unidade encontrada.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="units table">
            <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {units.map((unit) => (
                <TableRow
                  key={unit.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {unit.name}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {unit.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(unit.status)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton color="primary" onClick={() => handleEditUnit(unit)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={unit.status === 'active' ? 'Inativar unidade' : 'Ativar unidade'}>
                      <IconButton color={unit.status === 'active' ? 'warning' : 'secondary'} onClick={() => handleToggleStatus(unit.id)}>
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir unidade">
                      <IconButton color="error" onClick={() => handleDeleteUnit(unit.id)}>
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

      {/* Unit Modal (Create/Edit) */}
      <Dialog open={unitModalOpen} onClose={handleCloseUnitModal} maxWidth="sm" fullWidth>
        <DialogTitle>{currentUnit ? 'Editar Unidade' : 'Cadastrar Nova Unidade'}</DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              name="name"
              label="Nome da Unidade"
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
              disabled={!!currentUnit}
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
          <Button onClick={handleCloseUnitModal} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (currentUnit ? 'Salvar Alterações' : 'Cadastrar Unidade')}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Deletar Unidade"
        message="Tem certeza que deseja deletar esta unidade? Esta ação é irreversível. Se houver usuários vinculados, eles ficarão órfãos desta unidade."
      />

      <RelationshipConfirmDialog
        open={relationshipDialogOpen}
        onClose={() => {
          setRelationshipDialogOpen(false);
          setRelationshipData(null);
        }}
        onConfirm={handleConfirmRelationship}
        title={relationshipData?.actionType === 'delete' ? 'Deletar Unidade' : 'Inativar Unidade'}
        message={relationshipData?.actionType === 'delete' 
          ? 'Os usuários vinculados ficarão órfãos desta unidade.'
          : 'Inativá-la irá remover estes relacionamentos.'
        }
        usersCount={relationshipData?.usersCount || 0}
        actionType={relationshipData?.actionType || 'delete'}
        itemType="unidade"
      />
    </Box>
  );
}


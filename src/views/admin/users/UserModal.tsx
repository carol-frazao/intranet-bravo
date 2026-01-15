'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  CircularProgress
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/redux-files/hooks';
import { createUser, updateUser } from '@/redux-files/slices/usersSlice';
import { fetchGroups } from '@/redux-files/slices/groupsSlice';
import { fetchUnits } from '@/redux-files/slices/unitsSlice';
import { refreshUserContext } from '@/redux-files/slices/contextSlice';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import type { User } from '@/redux-files/slices/usersSlice';
import type { Profile } from '@/redux-files/slices/profilesSlice';
import { Checkbox, ListItemText, OutlinedInput } from '@mui/material';

interface UserModalProps {
  open: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  user: User | null;
  profiles: Profile[];
}

export default function UserModal({ open, onClose, user, profiles }: UserModalProps) {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const { items: groups } = useAppSelector(state => state.groups);
  const { items: units } = useAppSelector(state => state.units);
  const [loading, setLoading] = useState(false);
  const currentUserId = (session as any)?.id;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    profile: '',
    status: 'active',
    groupIds: [] as number[],
    unitIds: [] as number[],
  });

  useEffect(() => {
    if (open) {
      dispatch(fetchGroups({ status: 'all' }));
      dispatch(fetchUnits({ status: 'all' }));
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (!open) return;

    if (user) {
      // Editing - preencher com dados do usuário
      const userGroups = (user as any).userGroups || [];
      const userUnits = (user as any).userUnits || [];
      
      // Extrair IDs dos grupos - pode vir como ug.groupId ou ug.group.id
      const extractedGroupIds = userGroups.map((ug: any) => {
        if (ug.groupId) return ug.groupId;
        if (ug.group?.id) return ug.group.id;
        if (ug.id) return ug.id; // Caso o grupo esteja diretamente no array
        return null;
      }).filter((id: any): id is number => id !== null && id !== undefined);
      
      // Extrair IDs das unidades - pode vir como uu.unitId ou uu.unit.id
      const extractedUnitIds = userUnits.map((uu: any) => {
        if (uu.unitId) return uu.unitId;
        if (uu.unit?.id) return uu.unit.id;
        if (uu.id) return uu.id; // Caso a unidade esteja diretamente no array
        return null;
      }).filter((id: any): id is number => id !== null && id !== undefined);
      
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Senha não é editável
        profile: user.profile,
        status: user.status,
        groupIds: extractedGroupIds,
        unitIds: extractedUnitIds,
      });
    } else {
      // Creating - limpar formulário
      setFormData({
        name: '',
        email: '',
        password: '',
        profile: profiles.length > 0 ? profiles[0].name : '',
        status: 'active',
        groupIds: [],
        unitIds: [],
      });
    }
  }, [user, open, profiles]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validações
    if (!formData.name || !formData.email) {
      toast.warning('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      if (user) {
        // Atualizar usuário (sem senha)
        await dispatch(
          updateUser({
            id: user.id,
            data: {
              name: formData.name,
              email: formData.email,
              profile: formData.profile,
              status: formData.status,
              groupIds: formData.groupIds,
              unitIds: formData.unitIds,
            } as any,
          })
        ).unwrap();
      } else {
        // Criar novo usuário
        await dispatch(
          createUser({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            profile: formData.profile,
            status: formData.status,
            groupIds: formData.groupIds,
            unitIds: formData.unitIds,
          } as any)
        ).unwrap();
      }

      // Se o usuário editado for o usuário logado, forçar reload do contexto no header
      if (user && currentUserId && user.id === currentUserId) {
        dispatch(refreshUserContext());
      }

      onClose(true); // Fecha o modal e atualiza a lista
    } catch (error: any) {
      toast.error(error || `Erro ao ${user ? 'atualizar' : 'criar'} usuário`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Nome"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </Grid>

            {!user && (
              <Grid item xs={12}>
                <TextField
                  label="Senha (Opcional)"
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  helperText="Mínimo 6 caracteres"
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Perfil</InputLabel>
                <Select
                  value={formData.profile}
                  label="Perfil"
                  onChange={(e) => handleChange('profile', e.target.value)}
                >
                  {profiles?.map((profile) => (
                    <MenuItem key={profile.id} value={profile.code}>
                      {profile.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
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
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Grupos</InputLabel>
                <Select
                  multiple
                  value={formData.groupIds}
                  onChange={(e) => handleChange('groupIds', e.target.value)}
                  input={<OutlinedInput label="Grupos" />}
                  renderValue={(selected) => {
                    const selectedGroups = groups.filter(g => selected.includes(g.id));
                    return selectedGroups.map(g => g.name).join(', ');
                  }}
                >
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      <Checkbox checked={formData.groupIds.indexOf(group.id) > -1} />
                      <ListItemText primary={group.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Unidades</InputLabel>
                <Select
                  multiple
                  value={formData.unitIds}
                  onChange={(e) => handleChange('unitIds', e.target.value)}
                  input={<OutlinedInput label="Unidades" />}
                  renderValue={(selected) => {
                    const selectedUnits = units.filter(u => selected.includes(u.id));
                    return selectedUnits.map(u => u.name).join(', ');
                  }}
                >
                  {units.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      <Checkbox checked={formData.unitIds.indexOf(unit.id) > -1} />
                      <ListItemText primary={unit.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {user ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


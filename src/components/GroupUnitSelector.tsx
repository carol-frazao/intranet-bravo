'use client';
import { useMemo, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Chip,
  Popover,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import api from '@/utils/axios';
import { useAppDispatch, useAppSelector } from '@/redux-files/hooks';
import {
  setAvailableGroups,
  setAvailableUnits,
  setSelectedGroupIds,
  setSelectedUnitIds,
} from '@/redux-files/slices/contextSlice';

const STORAGE_KEY_GROUP_IDS = 'intranet_selected_group_ids_v2';
const STORAGE_KEY_UNIT_IDS = 'intranet_selected_unit_ids_v2';
const LEGACY_STORAGE_KEY_GROUP = 'intranet_selected_group_id';
const LEGACY_STORAGE_KEY_UNIT = 'intranet_selected_unit_id';

interface Group {
  id: number;
  name: string;
  code: string;
}

interface Unit {
  id: number;
  name: string;
  code: string;
}

export default function GroupUnitSelector() {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const refreshTrigger = useAppSelector((state) => state.context.refreshTrigger);
  const [groups, setGroups] = useState<Group[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Seleção local (UI). Regra: [] => "Todas" (todas as permitidas)
  const [selectedGroupIds, setLocalSelectedGroupIds] = useState<number[]>([]);
  const [selectedUnitIds, setLocalSelectedUnitIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const userProfile = (session as any)?.profile?.toLowerCase();
  const userId = (session as any)?.id;

  const allowedGroupIds = useMemo(() => groups.map(g => g.id), [groups]);
  const allowedUnitIds = useMemo(() => units.map(u => u.id), [units]);

  const effectiveSelectedGroupIds = useMemo(() => {
    return selectedGroupIds.length === 0 ? allowedGroupIds : selectedGroupIds;
  }, [selectedGroupIds, allowedGroupIds]);

  const effectiveSelectedUnitIds = useMemo(() => {
    return selectedUnitIds.length === 0 ? allowedUnitIds : selectedUnitIds;
  }, [selectedUnitIds, allowedUnitIds]);

  const selectedGroupsLabel = useMemo(() => {
    if (selectedGroupIds.length === 0) return 'Todos os grupos';
    if (selectedGroupIds.length === 1) return groups.find(g => g.id === selectedGroupIds[0])?.name || 'Grupo';
    return `${selectedGroupIds.length} grupos`;
  }, [selectedGroupIds, groups]);

  const selectedUnitsLabel = useMemo(() => {
    if (selectedUnitIds.length === 0) return 'Todas as unidades';
    if (selectedUnitIds.length === 1) return units.find(u => u.id === selectedUnitIds[0])?.name || 'Unidade';
    return `${selectedUnitIds.length} unidades`;
  }, [selectedUnitIds, units]);

  const persistSelection = (key: string, ids: number[]) => {
    // [] => "Todas" (salvar como string "all" para ser explícito)
    const value = ids.length === 0 ? 'all' : JSON.stringify(ids);
    localStorage.setItem(key, value);
  };

  const readPersistedSelection = (key: string): number[] | null => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    if (raw === 'all') return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => Number.isFinite(n));
      return null;
    } catch {
      return null;
    }
  };

  const normalizeToAllowed = (ids: number[], allowed: number[]): number[] => {
    const allowedSet = new Set(allowed);
    return ids.filter((id) => allowedSet.has(id));
  };

  useEffect(() => {
    if (!session || !userId) {
      setLoading(false);
      return;
    }

    const loadUserGroupsAndUnits = async () => {
      setLoading(true);

      try {
        // Sempre buscar apenas os grupos e unidades que o usuário tem permissão
        // (via user_groups e user_units), independentemente do perfil
        const response = await api.get(`/intranet/users/${userId}/groups-units`);
        const loadedGroups: Group[] = response.data.groups || [];
        const loadedUnits: Unit[] = response.data.units || [];

        setGroups(loadedGroups);
        setUnits(loadedUnits);

        // Publicar opções no Redux (estado global)
        dispatch(setAvailableGroups(loadedGroups));
        dispatch(setAvailableUnits(loadedUnits));

        // Recuperar seleções do localStorage (v2)
        const savedGroupIds = readPersistedSelection(STORAGE_KEY_GROUP_IDS);
        const savedUnitIds = readPersistedSelection(STORAGE_KEY_UNIT_IDS);

        // Migração simples do legado (single id) -> v2
        const legacyGroupIdRaw = localStorage.getItem(LEGACY_STORAGE_KEY_GROUP);
        const legacyUnitIdRaw = localStorage.getItem(LEGACY_STORAGE_KEY_UNIT);

        const allowedGroups = loadedGroups.map(g => g.id);
        const allowedUnits = loadedUnits.map(u => u.id);

        let nextGroupIds: number[] = savedGroupIds ?? [];
        let nextUnitIds: number[] = savedUnitIds ?? [];

        if (savedGroupIds == null && legacyGroupIdRaw) {
          const legacyId = Number(legacyGroupIdRaw);
          if (Number.isFinite(legacyId)) nextGroupIds = [legacyId];
        }
        if (savedUnitIds == null && legacyUnitIdRaw) {
          const legacyId = Number(legacyUnitIdRaw);
          if (Number.isFinite(legacyId)) nextUnitIds = [legacyId];
        }

        // Se houver apenas 1 opção, selecionar automaticamente (sem "Todas")
        if (allowedGroups.length === 1) nextGroupIds = [allowedGroups[0]];
        if (allowedUnits.length === 1) nextUnitIds = [allowedUnits[0]];

        // Validar contra permitidas
        nextGroupIds = normalizeToAllowed(nextGroupIds, allowedGroups);
        nextUnitIds = normalizeToAllowed(nextUnitIds, allowedUnits);

        // Persistir normalizado
        persistSelection(STORAGE_KEY_GROUP_IDS, nextGroupIds);
        persistSelection(STORAGE_KEY_UNIT_IDS, nextUnitIds);

        // Atualizar estado local e Redux
        setLocalSelectedGroupIds(nextGroupIds);
        setLocalSelectedUnitIds(nextUnitIds);
        dispatch(setSelectedGroupIds(nextGroupIds));
        dispatch(setSelectedUnitIds(nextUnitIds));
      } catch (error) {
        console.error('Erro ao carregar grupos e unidades:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserGroupsAndUnits();
  }, [session, userId, refreshTrigger, dispatch]);

  const handleGroupChange = (event: any) => {
    const value = event.target.value as number[];
    // Convenção: se vier vazio => Todas
    const normalized = normalizeToAllowed(value, allowedGroupIds);
    setLocalSelectedGroupIds(normalized);
    persistSelection(STORAGE_KEY_GROUP_IDS, normalized);
    dispatch(setSelectedGroupIds(normalized));
  };

  const handleUnitChange = (event: any) => {
    const value = event.target.value as number[];
    const normalized = normalizeToAllowed(value, allowedUnitIds);
    setLocalSelectedUnitIds(normalized);
    persistSelection(STORAGE_KEY_UNIT_IDS, normalized);
    dispatch(setSelectedUnitIds(normalized));
  };

  const handleOpenPopover = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // Não mostrar se não houver grupos ou unidades
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CircularProgress size={16} sx={{ color: 'inherit' }} />
      </Box>
    );
  }

  if (groups.length === 0 && units.length === 0) {
    return null;
  }

  // Se tiver apenas 1 grupo e 1 unidade, mostrar apenas os chips sem popover
  const hasMultipleOptions = (groups.length > 1 || units.length > 1);

  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 0.25, sm: 0.5 },
          cursor: hasMultipleOptions ? 'pointer' : 'default',
          flexWrap: 'nowrap',
          '&:hover': hasMultipleOptions ? {
            opacity: 0.8,
          } : {}
        }}
        onClick={hasMultipleOptions ? handleOpenPopover : undefined}
      >
        {groups.length > 0 && (
          <Chip
            icon={<BusinessIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />}
            label={<Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>{selectedGroupsLabel}, {selectedUnitsLabel} <EditIcon sx={{ fontSize: 14, marginTop: -0.2 }} /></Typography>}
            size="small"
            sx={{
              height: { xs: 22, sm: 24 },
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: 'inherit',
              maxWidth: { xs: 90, sm: 'none' },
              '& .MuiChip-label': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                px: { xs: 0.5, sm: 1 }
              },
              '& .MuiChip-icon': {
                color: 'inherit',
                opacity: 0.7,
                marginLeft: { xs: '4px', sm: '6px' }
              },
              '&:hover': hasMultipleOptions ? {
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
              } : {}
            }}
          />
        )}
        
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            p: 2,
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Selecionar Contexto
          </Typography>
          
          {groups.length > 0 && (
            <FormControl size="small" fullWidth>
              <InputLabel>Grupo</InputLabel>
              <Select
                multiple
                value={selectedGroupIds}
                label="Grupo"
                onChange={handleGroupChange}
                renderValue={(selected) => {
                  const ids = selected as number[];
                  if (!ids || ids.length === 0) return 'Todas';
                  if (ids.length === 1) return groups.find(g => g.id === ids[0])?.name || 'Grupo';
                  return `${ids.length} selecionados`;
                }}
              >
                <MenuItem value={[] as any}>
                  <em>Todas</em>
                </MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {units.length > 0 && (
            <FormControl size="small" fullWidth>
              <InputLabel>Unidade</InputLabel>
              <Select
                multiple
                value={selectedUnitIds}
                label="Unidade"
                onChange={handleUnitChange}
                renderValue={(selected) => {
                  const ids = selected as number[];
                  if (!ids || ids.length === 0) return 'Todas';
                  if (ids.length === 1) return units.find(u => u.id === ids[0])?.name || 'Unidade';
                  return `${ids.length} selecionados`;
                }}
              >
                <MenuItem value={[] as any}>
                  <em>Todas</em>
                </MenuItem>
                {units.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Popover>
    </>
  );
}

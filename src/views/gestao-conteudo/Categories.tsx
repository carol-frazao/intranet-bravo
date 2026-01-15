'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/redux-files/hooks';
import { fetchCategories, updateCategoryOrder as updateCategoryOrderThunk, updateCategoryParent as updateCategoryParentThunk } from '@/redux-files/slices/categoriesSlice';
import ReturnBtn from '@/components/ReturnBtn';
import { MessageQuestion } from 'iconsax-reactjs';
import HelpModal from './categorias/HelpModal';
import CategoryActionModal from '@/components/CategoryActionModal';
import CategoryTree from './categorias/CategoryTree';
import { Category } from './categorias/CategoryCard';
import api from '@/utils/axios';
import ChangesViewer from '@/components/admin/ChangesViewer';

/**
 * Componente principal: tela de administração de categorias com suporte a:
 * - Hierarquia (pai/filho)
 * - Drag-and-drop
 * - Edição / visualização / exclusão
 * - Visualização com linhas de árvore
 */
export default function Categories() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s) => s.categories.items) as any as Category[];
  const loading = useAppSelector((s) => s.categories.loading);
  const contextGroups = useAppSelector((s: any) => s.context.availableGroups) as any[];
  const contextUnits = useAppSelector((s: any) => s.context.availableUnits) as any[];
  const selectedGroupIds = useAppSelector((s: any) => s.context.selectedGroupIds) as number[];
  const selectedUnitIds = useAppSelector((s: any) => s.context.selectedUnitIds) as number[];
  const router = useRouter();
  const theme = useTheme();

  const effectiveGroupIds = selectedGroupIds.length > 0 ? selectedGroupIds : contextGroups.map((g) => g.id);
  const effectiveUnitIds = selectedUnitIds.length > 0 ? selectedUnitIds : contextUnits.map((u) => u.id);
  const filterKey = `${effectiveGroupIds.join(',')}|${effectiveUnitIds.join(',')}`;

  const [flatCategories, setFlatCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [potentialParentId, setPotentialParentId] = useState<number | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const [insertionTarget, setInsertionTarget] = useState<{ id: number; position: 'top' | 'bottom' } | null>(null);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [categoryActionModal, setCategoryActionModal] = useState<{
    open: boolean;
    category: Category | null;
    action: 'inactivate' | 'delete';
  }>({ open: false, category: null, action: 'delete' });
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<string | null>(null);
  const [changesViewerOpen, setChangesViewerOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | 'all'>('all');
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const logsItemsPerPage = 10;

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  useEffect(() => {
    // Recarrega ao mudar o contexto (grupos/unidades)
    if (contextGroups.length === 0 && contextUnits.length === 0) return;
    dispatch(fetchCategories({ status: 'all', groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    setFlatCategories(flattenCategories(categories));
  }, [categories]);

  const flattenCategories = (cats: Category[], level: number = 0): any[] => {
    let result: any[] = [];
    cats.forEach(cat => {
      result.push({ ...cat, level });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    });
    return result;
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryActionModal({
      open: true,
      category,
      action: 'delete',
    });
  };

  const handleInactivateClick = async (category: Category) => {
    // Se a categoria está inativa, apenas reativa sem modal
    if (category.status === 'inactive') {
      try {
        await api.put(`/intranet/categories/${category.id}`, { status: 'active' });
        dispatch(fetchCategories({ status: 'all', groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
        toast.success('Categoria reativada com sucesso!');
      } catch (error) {
        console.error('Error reactivating category:', error);
        toast.error('Erro ao reativar categoria');
      }
      return;
    }

    // Se está ativa, abre modal para inativar
    setCategoryActionModal({
      open: true,
      category,
      action: 'inactivate',
    });
  };

  const handleCategoryActionSuccess = () => {
    dispatch(fetchCategories({ status: 'all', groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
    toast.success('Ação realizada com sucesso!');
  };

  const handleView = (category: Category) => {
    setSelectedCategory(category);
    setViewDialogOpen(true);
  };

  const loadLogs = async (page: number = 1) => {
    try {
      setLoadingLogs(true);
      
      const offset = (page - 1) * logsItemsPerPage;
      
      let responseCategory;
      let responseGeneral;
      
      // Se filtro de categoria específica, buscar logs dessa categoria
      if (selectedCategoryFilter !== 'all') {
        responseCategory = await api.get(`/intranet/categories/${selectedCategoryFilter}/logs`, {
          params: {
            limit: logsItemsPerPage,
            offset: offset
          }
        });
        
        responseGeneral = await api.get('/intranet/logs', {
          params: {
            itemId: selectedCategoryFilter,
            limit: 20
          }
        });
      } else {
        // Buscar todos os logs de categoria com paginação
        responseCategory = await api.get('/intranet/categories/logs/all', {
          params: {
            limit: logsItemsPerPage,
            offset: offset
          }
        });
        
        // Buscar logs gerais relacionados a categorias
        // Como não temos filtro por ação no endpoint, vamos buscar um range maior
        // e filtrar no frontend, ou buscar todos de uma vez
        responseGeneral = await api.get('/intranet/logs', {
          params: {
            limit: 5000 // Buscar muitos para garantir que temos os logs gerais correspondentes
          }
        });
      }
      
      const categoryLogs = responseCategory.data.logs || [];
      
      // Se temos logs de categoria, buscar os logs gerais correspondentes
      if (categoryLogs.length > 0) {
        // Extrair os categoryIds únicos dos logs da página atual
        const categoryIds: number[] = Array.from(new Set(categoryLogs.map((log: any) => log.categoryId as number)));
        
        // Buscar logs gerais para essas categorias específicas
        const generalLogsPromises = categoryIds.map((categoryId: number) =>
          api.get('/intranet/logs', {
            params: {
              itemId: categoryId,
              limit: 100 // Buscar muitos para garantir correspondência
            }
          })
        );
        
        const generalLogsResponses = await Promise.all(generalLogsPromises);
        const allGeneralLogs = generalLogsResponses.flatMap((res: any) => res.data.logs || []);
        
        // Filtrar apenas logs de categoria
        const generalLogs = allGeneralLogs.filter((log: any) => 
          log.action?.includes('category')
        );
        
        // Mesclar os logs com base no timestamp e categoryId
        const mergedLogs = categoryLogs.map((log: any) => {
          const matchingGeneralLog = generalLogs.find((cLog: any) => {
            const diff = Math.abs(new Date(log.createdAt).getTime() - new Date(cLog.createdAt).getTime());
            return diff < 1000 && cLog.itemId === log.categoryId; // Margem de 1 segundo e mesmo categoryId
          });
          
          return {
            ...log,
            description: matchingGeneralLog?.description || '--',
          };
        });
        
        setLogs(mergedLogs);
      } else {
        setLogs([]);
      }
      
      setLogsTotal(responseCategory.data.total || 0);
      setLogsTotalPages(Math.ceil((responseCategory.data.total || 0) / logsItemsPerPage));
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (logsOpen) {
      setLogsPage(1);
      setSelectedCategoryFilter('all');
      loadLogs(1);
    }
  }, [logsOpen]);

  // Recarregar logs quando mudar página ou filtro
  useEffect(() => {
    if (logsOpen) {
      setLogsPage(1); // Resetar para primeira página ao mudar filtro
      loadLogs(1);
    }
  }, [selectedCategoryFilter]);

  useEffect(() => {
    if (logsOpen) {
      loadLogs(logsPage);
    }
  }, [logsPage]);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    // reseta qualquer indicação de possível pai ao iniciar
    setPotentialParentId(null);
    setInsertionTarget(null);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };
  
  // 👇 Mantém quem está sob o ponteiro para destaque visual
  const handleDragOver = (event: any) => {
    const { over } = event;
    const newOverId = over?.id ?? null;
    setOverId(newOverId);

    // reinicia o temporizador sempre que o alvo mudar
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    if (newOverId) {
      // remove visual até completar o tempo
      if (potentialParentId !== newOverId) setPotentialParentId(null);
      hoverTimerRef.current = window.setTimeout(() => {
        setPotentialParentId(newOverId);
      }, 500);

      // Calcula feedback de inserção (acima/abaixo)
      try {
        const targetEl = document.querySelector(`[data-id="category-${newOverId}"]`) as HTMLElement | null;
        const clientY = (event.activatorEvent?.clientY as number) || 0;
        if (targetEl && clientY) {
          const rect = targetEl.getBoundingClientRect();
          const position: 'top' | 'bottom' = clientY < rect.top + rect.height / 2 ? 'top' : 'bottom';
          setInsertionTarget({ id: newOverId, position });
        }
      } catch {}
    } else {
      setPotentialParentId(null);
      setInsertionTarget(null);
    }
  };

  /**
   * Regras:
   * - Se soltar sobre item com offset horizontal > limiar => vira filho do alvo
   * - Se soltar sobre item do mesmo pai => reordena
   * - Se soltar sobre item de outro pai (offset pequeno) => move para o pai do alvo
   */
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const dragged = flatCategories.find(c => c.id === active.id);
    const target  = flatCategories.find(c => c.id === over.id);
    if (!dragged || !target) return;

    // util: evita ciclos (não deixa virar filho do próprio descendente)
    const isCircular = (parentId: number | null, childId: number): boolean => {
      if (parentId == null) return false;
      if (parentId === childId) return true;
      const parent = flatCategories.find(c => c.id === parentId);
      return parent ? isCircular(parent.parentId, childId) : false;
    };

    // Mede deslocamento horizontal para decidir se "vira filho"
    // limpa timers de hover ao finalizar
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // Se arrastar para a esquerda de forma significativa: "subir um nível"
    try {
      const targetEl  = document.querySelector(`[data-id="category-${over.id}"]`) as HTMLElement | null;
      const draggedEl = document.querySelector(`[data-id="category-${dragged.id}"]`) as HTMLElement | null;
      if (targetEl && draggedEl) {
        const targetRect  = targetEl.getBoundingClientRect();
        const draggedRect = draggedEl.getBoundingClientRect();
        const horizontalOffset = draggedRect.left - targetRect.left;
        const UNNEST_THRESHOLD = -36; // px
        if (horizontalOffset < UNNEST_THRESHOLD && dragged.parentId !== null) {
          const parent = flatCategories.find(c => c.id === dragged.parentId);
          const newParentId = parent?.parentId ?? null;
          const newSiblings = flatCategories
            .filter(c => c.parentId === newParentId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          const newOrder = newSiblings.length;
          try {
            await dispatch(updateCategoryParentThunk({ id: dragged.id, parentId: newParentId })).unwrap();
            await dispatch(updateCategoryOrderThunk({ id: dragged.id, order: newOrder })).unwrap();
            setInsertionTarget(null);
            setPotentialParentId(null);
            dispatch(fetchCategories({ status: 'all', groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
            return;
          } catch (e) {
            console.error('Error un-nesting category:', e);
          }
        }
      }
    } catch {}

    // Se manteve sobre um item por 2s e soltou em cima dele => aninhar
    if (potentialParentId && potentialParentId === over.id && !isCircular(potentialParentId, dragged.id)) {
      try {
        await dispatch(updateCategoryParentThunk({ id: dragged.id, parentId: potentialParentId })).unwrap();
        setPotentialParentId(null);
        setInsertionTarget(null);
        dispatch(fetchCategories({ status: 'all', groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
        return;
      } catch (e) {
        console.error('Error nesting category:', e);
        toast.error('Erro ao aninhar categoria');
        // continua o fluxo
      }
    }
    setPotentialParentId(null);
    setInsertionTarget(null);

    // Mesmo pai => reorder
    if (dragged.parentId === target.parentId) {
      const siblings = flatCategories
        .filter(c => c.parentId === target.parentId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const oldIndex = siblings.findIndex(s => s.id === dragged.id);
      const newIndex = siblings.findIndex(s => s.id === target.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(siblings, oldIndex, newIndex);

      // 🔧 Atualiza apenas quem mudou de posição
      try {
        for (let i = 0; i < reordered.length; i++) {
          if (reordered[i].order !== i) {
            await dispatch(updateCategoryOrderThunk({ id: reordered[i].id, order: i })).unwrap();
          }
        }
        dispatch(fetchCategories({ status: 'all', groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
      } catch (e) {
        console.error('Error reordering categories:', e);
        toast.error('Erro ao reordenar categorias');
      }
      return;
    }

    // Pais diferentes (drop sobre alvo sem deslocamento lateral suficiente):
    // move para o pai do alvo e coloca no "final" (order = último índice)
    if (!isCircular(target.parentId, dragged.id)) {
      try {
        const siblingsOfTargetParent = flatCategories
          .filter(c => c.parentId === target.parentId)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const newOrder = siblingsOfTargetParent.length; // joga pro fim
        await dispatch(updateCategoryParentThunk({ id: dragged.id, parentId: target.parentId ?? null })).unwrap();
        await dispatch(updateCategoryOrderThunk({ id: dragged.id, order: newOrder })).unwrap();
        dispatch(fetchCategories({ status: 'all', groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
      } catch (e) {
        console.error('Error moving to another parent:', e);
        toast.error('Erro ao mover categoria');
      }
    }
  };

  return (
    <Box>
      <ReturnBtn onClick={() => router.back()} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 3, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" component="h1">
              Categorias
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => setHelpModalOpen(true)}
              title="Passo-a-passo"
              sx={{ 
                bgcolor: '#E3F2FD',
                '&:hover': { bgcolor: '#BBDEFB' }
              }}
            >
              <MessageQuestion size="24" color={theme.palette.primary.main} variant="Bulk"/>
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<HistoryIcon />}
              onClick={() => {
                setViewDialogOpen(false);
                setLogsOpen(true);
              }}
            >
              Histórico
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/gestao-de-conteudo/categorias/novo')}>
              Nova Categoria
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : categories.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Nenhuma categoria encontrada</Typography>
          </Paper>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <Paper sx={{ p: 2 }}>
              <CategoryTree
                categories={categories}
                level={0}
                onEdit={(id) => router.push(`/gestao-de-conteudo/categorias/editar/${id}`)}
                onDelete={handleDeleteClick}
                onView={handleView}
                onInactivate={handleInactivateClick}
                overId={overId}
                potentialParentId={potentialParentId}
                insertionTarget={insertionTarget}
              />
            </Paper>
            <DragOverlay>
              {activeId && (
                <Card sx={{ p: 1, opacity: 0.8 }}>
                  <Typography>{flatCategories.find(c => c.id === activeId)?.name}</Typography>
                </Card>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </Container>

      {/* Modal de visualização */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalhes da Categoria</DialogTitle>
        <DialogContent>
          {selectedCategory && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>Nome:</Typography>
              <Typography>{selectedCategory.name}</Typography>

              {selectedCategory.description && (
                <>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
                    Descrição:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCategory.description}
                  </Typography>
                </>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>Cor:</Typography>
                {selectedCategory.color && (
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: selectedCategory.color,
                      border: '1px solid #ccc',
                      borderRadius: 1
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>Status:</Typography>
                <Chip
                  label={selectedCategory.status === 'active' ? 'Ativo' : 'Inativo'}
                  size="small"
                  color={selectedCategory.status === 'active' ? 'success' : 'default'}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>Pai:</Typography>
                <Typography>{selectedCategory.parentId ? flatCategories.find(c => c.id === selectedCategory.parentId)?.name : 'Nenhum'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Fechar</Button>
          {selectedCategory && (
            <Button
              variant="contained"
              onClick={() => {
                setViewDialogOpen(false);
                router.push(`/gestao-de-conteudo/categorias/editar/${selectedCategory.id}`);
              }}
            >
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog open={logsOpen} onClose={() => setLogsOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Histórico de Alterações de Categorias</DialogTitle>
        <DialogContent sx={{ p: 2, pb: 1, overflow: 'visible' }}>
          {/* Filtro de Categoria */}
          <FormControl fullWidth>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={selectedCategoryFilter}
              label="Categoria"
              onChange={(e) => setSelectedCategoryFilter(e.target.value as number | 'all')}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                  },
                },
              }}
            >
              <MenuItem value="all">Todas</MenuItem>
              {flatCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <Divider />
        <DialogContent sx={{ p: 0, overflow: 'auto', maxHeight: '60vh' }}>
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
                    <TableCell sx={{ fontWeight: 600 }}>Categoria</TableCell>
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
                        create_category: { label: 'Criação', color: 'success' },
                        update_category: { label: 'Alteração', color: 'info' },
                        activate_category: { label: 'Ativação', color: 'success' },
                        inactivate_category: { label: 'Inativação', color: 'warning' },
                        delete_category: { label: 'Exclusão', color: 'error' },
                      };
                      return labels[action] || { label: action, color: 'info' };
                    };

                    const actionInfo = getActionLabel(log.action);
                    
                    const categoryName = flatCategories.find(c => c.id === log.categoryId)?.name || `ID: ${log.categoryId}`;
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2">
                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {categoryName}
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
        {!loadingLogs && logs.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={logsTotalPages}
              page={logsPage}
              onChange={(_, value) => setLogsPage(value)}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
        <DialogActions>
          <Button onClick={() => setLogsOpen(false)} variant="contained">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Visualização de Alterações */}
      <ChangesViewer
        open={changesViewerOpen}
        onClose={() => setChangesViewerOpen(false)}
        changes={selectedChanges}
        title="Detalhes das Alterações"
      />

      {/* Modal de Ajuda */}
      <HelpModal open={helpModalOpen} onClose={() => setHelpModalOpen(false)} />

      {/* Modal de Ação em Categoria */}
      <CategoryActionModal
        open={categoryActionModal.open}
        onClose={() => setCategoryActionModal({ open: false, category: null, action: 'delete' })}
        category={categoryActionModal.category}
        action={categoryActionModal.action}
        onSuccess={handleCategoryActionSuccess}
        allCategories={flatCategories}
      />
    </Box>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography,
  CircularProgress,
  useTheme
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import { useAppDispatch, useAppSelector } from '@/redux-files/hooks';
import { fetchCategories } from '@/redux-files/slices/categoriesSlice';
import { fetchContentsByCategory, fetchContentById } from '@/redux-files/slices/contentsSlice';
import api from '@/utils/axios';
import ContentFull from '@/components/content/ContentFull';
import ContentList from '@/components/content/ContentList';
import MenuSidebar from './MenuSidebar';

interface Category {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
  icon: string;
  color: string;
  order: number;
  children?: Category[];
  contents?: Content[];
}

interface Content {
  id: number;
  title: string;
  description: string;
  type: string;
  categoryId: number;
  content?: string;
  views?: number;
  files?: any[];
  author?: { name: string };
  publishedAt?: string;
}

export default function HomePage() {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const categories = useAppSelector((s: any) => s.categories.items) as any as Category[];
  const contents = useAppSelector((s: any) => s.contents.items) as any as Content[];
  const contextGroups = useAppSelector((s: any) => s.context.availableGroups) as any[];
  const contextUnits = useAppSelector((s: any) => s.context.availableUnits) as any[];
  const selectedGroupIds = useAppSelector((s: any) => s.context.selectedGroupIds) as number[];
  const selectedUnitIds = useAppSelector((s: any) => s.context.selectedUnitIds) as number[];
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null | 'uncategorized' | 'none'>('none');
  const loading = useAppSelector((s: any) => s.categories.loading || s.contents.loading);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [filesCount, setFilesCount] = useState<Record<number, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  

  const effectiveGroupIds = selectedGroupIds.length > 0 ? selectedGroupIds : contextGroups.map((g) => g.id);
  const effectiveUnitIds = selectedUnitIds.length > 0 ? selectedUnitIds : contextUnits.map((u) => u.id);
  const filterKey = `${effectiveGroupIds.join(',')}|${effectiveUnitIds.join(',')}`;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Atualizar categorias
      await dispatch(fetchCategories({ groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
      
      // Se houver categoria selecionada, atualizar seus conteúdos também
      if (selectedCategoryId && typeof selectedCategoryId === 'number') {
        await dispatch(fetchContentsByCategory({ categoryId: selectedCategoryId, groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
      } else if (selectedCategoryId === 'uncategorized') {
        await dispatch(fetchContentsByCategory({ categoryId: null, groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
      }
    } finally {
      setTimeout(() => setRefreshing(false), 500); // Pequeno delay para feedback visual
    }
  };

  useEffect(() => {
    // Recarrega sempre que o contexto (grupos/unidades) mudar
    if (contextGroups.length === 0 && contextUnits.length === 0) return;
    dispatch(fetchCategories({ groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    if (selectedCategoryId && typeof selectedCategoryId === 'number') {
      // Limpa conteúdos anteriores e busca novos conteúdos da categoria selecionada
      dispatch(fetchContentsByCategory({ categoryId: selectedCategoryId, groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
    } else if (selectedCategoryId === 'uncategorized') {
      // Para "Sem Categoria", buscamos todos os conteúdos sem categoria
      dispatch(fetchContentsByCategory({ categoryId: null, groupIds: effectiveGroupIds, unitIds: effectiveUnitIds }));
    }
  }, [selectedCategoryId, dispatch, filterKey]);

  // Carregar arquivos para cada conteúdo
  useEffect(() => {
    const loadFilesCount = async () => {
      const counts: Record<number, number> = {};
      for (const content of contents) {
        try {
          const response = await api.get(`/intranet/contents/${content.id}/files`);
          counts[content.id] = response.data.length;
        } catch (error) {
          counts[content.id] = 0;
        }
      }
      setFilesCount(counts);
    };

    if (contents.length > 0) {
      loadFilesCount();
    }
  }, [contents]);

  const handleCategorySelect = (categoryId: number | null | 'uncategorized' | 'none') => {
    setSelectedCategoryId(categoryId);
  };

  // Função recursiva para encontrar uma categoria pelo ID na árvore
  const findCategoryById = (cats: Category[], id: number): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) {
        return cat;
      }
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryById(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedCategory = typeof selectedCategoryId === 'number' ? findCategoryById(categories, selectedCategoryId) : null;
  const categoryContents = selectedCategoryId === 'uncategorized' 
    ? contents.filter(content => !content.categoryId) // Sem categoria
    : typeof selectedCategoryId === 'number' 
      ? contents.filter(content => content.categoryId === selectedCategoryId)
      : [];

  // Se houver apenas 1 conteúdo, carregar automaticamente usando Redux
  useEffect(() => {
    const loadSingleContent = async () => {
      if (categoryContents.length === 1 && selectedCategoryId !== 'none') {
        try {
          setLoadingContent(true);
          const result = await dispatch(fetchContentById(categoryContents[0].id)).unwrap();
          setSelectedContent(result);
        } catch (error) {
          console.error('Error loading content:', error);
        } finally {
          setLoadingContent(false);
        }
      } else {
        setSelectedContent(null);
      }
    };

    loadSingleContent();
  }, [categoryContents.length, selectedCategoryId, dispatch]);


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar Component */}
        <MenuSidebar
          categories={categories}
          contents={contents}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={handleCategorySelect}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: { xs: 2, sm: 3 },
          ml: { xs: 0, md: 0 } // Ajuste para mobile quando sidebar fechada
        }}>
          {selectedCategoryId === 'none' ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              marginTop: '-4rem'
            }}>
              <FolderIcon sx={{ fontSize: 65, color: theme.palette.primary.main, mb: 3, opacity: 0.6 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Bem-vindo aos Documentos Públicos
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mt: 2 }}>
                Selecione uma categoria no menu lateral para visualizar os documentos disponíveis.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mt: 1 }}>
                Use a barra de pesquisa para encontrar documentos específicos rapidamente.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="h5" gutterBottom>
                {selectedCategory?.name || 'Sem Categoria'}
              </Typography>
              {selectedCategory?.description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedCategory.description}
                </Typography>
              )}
              {loading || loadingContent ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <CircularProgress />
                </Box>
              ) : categoryContents.length === 1 && selectedContent ? (
                // Exibir conteúdo completo quando houver apenas 1
                <ContentFull 
                  content={selectedContent} 
                  filesCount={filesCount[selectedContent.id] || 0} 
                />
              ) : (
                // Exibir lista com prévia quando houver múltiplos conteúdos (ou nenhum)
                <ContentList 
                  contents={categoryContents} 
                  filesCount={filesCount} 
                />
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}




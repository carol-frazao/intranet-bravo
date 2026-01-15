'use client';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import api from '@/utils/axios';
import { toast } from 'react-toastify';

export interface Category {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
  icon: string;
  color: string;
  order: number;
  status: string;
  children?: Category[];
}

export interface CategoriesQueryParams {
  status?: string;
  groupIds?: number[];
  unitIds?: number[];
}

interface CategoriesState {
  items: Category[];
  loading: boolean;
  error?: string | null;
}

const initialState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk(
  'categories/fetch',
  async (params: CategoriesQueryParams = {}, { rejectWithValue }) => {
  try {
    const res = await api.get('intranet/categories', { params });
    return res.data as Category[];
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Erro ao buscar categorias');
    return rejectWithValue(error.response?.data?.message || 'Erro ao buscar categorias');
  }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (payload: {
    id: number;
    contentAction?: 'inactivate' | 'move' | 'remove_category';
    newCategoryId?: number | null;
  }, { rejectWithValue }) => {
    try {
      const { id, ...data } = payload;
      await api.delete(`intranet/categories/${id}`, { data });
      toast.success('Categoria deletada com sucesso!');
      return id;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao deletar categoria');
      return rejectWithValue(error.response?.data?.message || 'Erro ao deletar categoria');
    }
  }
);

export const updateCategoryParent = createAsyncThunk(
  'categories/updateParent',
  async (payload: { id: number; parentId: number | null }, { rejectWithValue }) => {
    try {
      await api.put(`intranet/categories/${payload.id}`, { parentId: payload.parentId });
      return payload;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar categoria');
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar categoria');
    }
  }
);

export const updateCategoryOrder = createAsyncThunk(
  'categories/updateOrder',
  async (payload: { id: number; order: number }, { rejectWithValue }) => {
    try {
      await api.put(`intranet/categories/${payload.id}`, { order: payload.order });
      return payload;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar ordem da categoria');
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar ordem da categoria');
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/create',
  async (categoryData: {
    name: string;
    description?: string;
    parentId?: number | null;
    icon?: string;
    color?: string;
    order?: number;
    status?: string;
    groupIds?: number[];
    unitIds?: number[];
  }, { rejectWithValue }) => {
    try {
      const res = await api.post('intranet/categories', categoryData);
      toast.success('Categoria criada com sucesso!');
      return res.data as Category;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar categoria');
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar categoria');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/update',
  async (payload: {
    id: number;
    name?: string;
    description?: string;
    parentId?: number | null;
    icon?: string;
    color?: string;
    order?: number;
    status?: string;
  }, { rejectWithValue }) => {
    try {
      const { id, ...data } = payload;
      const res = await api.put(`intranet/categories/${id}`, data);
      toast.success('Categoria atualizada com sucesso!');
      return res.data as Category;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar categoria');
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar categoria');
    }
  }
);

export const inactivateCategory = createAsyncThunk(
  'categories/inactivate',
  async (payload: {
    id: number;
    contentAction?: 'inactivate' | 'move' | 'remove_category';
    newCategoryId?: number | null;
  }, { rejectWithValue }) => {
    try {
      const { id, ...data } = payload;
      await api.patch(`intranet/categories/${id}/inactivate`, data);
      toast.success('Categoria inativada com sucesso!');
      return id;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao inativar categoria');
      return rejectWithValue(error.response?.data?.message || 'Erro ao inativar categoria');
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar categorias';
      })
      .addCase(deleteCategory.fulfilled, (state, action: PayloadAction<number>) => {
        const removeCategory = (categories: Category[]): Category[] => {
          return categories
            .filter((c) => c.id !== action.payload)
            .map((c) => ({
              ...c,
              children: c.children ? removeCategory(c.children) : undefined,
            }));
        };
        state.items = removeCategory(state.items);
      })
      .addCase(updateCategoryParent.fulfilled, (state, action) => {
        // otimista: apenas refetch na tela normalmente, mas atualizamos parentId local
        const item = findCategoryById(state.items, action.payload.id);
        if (item) item.parentId = action.payload.parentId;
      })
      .addCase(updateCategoryOrder.fulfilled, (state, action) => {
        const item = findCategoryById(state.items, action.payload.id);
        if (item) item.order = action.payload.order;
      })
      .addCase(createCategory.fulfilled, (state, action: PayloadAction<Category>) => {
        // A categoria criada será adicionada quando fizer refetch
        // Mas podemos adicionar aqui para evitar refetch se necessário
        state.items.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action: PayloadAction<Category>) => {
        const item = findCategoryById(state.items, action.payload.id);
        if (item) {
          Object.assign(item, action.payload);
        }
      })
      .addCase(inactivateCategory.fulfilled, (state, action: PayloadAction<number>) => {
        const item = findCategoryById(state.items, action.payload);
        if (item) {
          item.status = 'inactive';
        }
      });
  },
});

export default categoriesSlice.reducer;

// util para achar recursivo
function findCategoryById(list: Category[], id: number): Category | undefined {
  for (const c of list) {
    if (c.id === id) return c;
    if (c.children && c.children.length) {
      const found = findCategoryById(c.children, id);
      if (found) return found;
    }
  }
  return undefined;
}



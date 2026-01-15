'use client';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import api from '@/utils/axios';
import { toast } from 'react-toastify';

export interface Content {
  id: number;
  title: string;
  description: string;
  type: string;
  categoryId: number;
  content?: string;
  url?: string;
  status?: string;
  authorId?: number;
  author?: { name: string };
  category?: { name: string };
  publishedAt?: string;
  views?: number;
}

export interface ContentsQueryParams {
  status?: string;
  categoryId?: number | null;
  search?: string;
  type?: string;
  groupIds?: number[];
  unitIds?: number[];
}

interface ContentsState {
  items: Content[];
  current?: Content | null;
  loading: boolean;
  error?: string | null;
}

const initialState: ContentsState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchContentsByCategory = createAsyncThunk(
  'contents/fetchByCategory',
  async (params: { categoryId: number | null; groupIds?: number[]; unitIds?: number[] }, { rejectWithValue }) => {
    try {
      const res = await api.get('intranet/contents', { params });
      return res.data as Content[];
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao buscar conteúdos');
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar conteúdos');
    }
  }
);

export const fetchContentById = createAsyncThunk('contents/fetchById', async (id: number, { rejectWithValue }) => {
  try {
    const res = await api.get(`intranet/contents/${id}`);
    return res.data as Content;
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Erro ao buscar conteúdo');
    return rejectWithValue(error.response?.data?.message || 'Erro ao buscar conteúdo');
  }
});

export const fetchAllContents = createAsyncThunk(
  'contents/fetchAll',
  async (params: ContentsQueryParams = { status: 'all' }, { rejectWithValue }) => {
    try {
      const res = await api.get('intranet/contents', { params });
      return res.data as Content[];
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao buscar conteúdos');
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar conteúdos');
    }
  }
);

export const createContent = createAsyncThunk(
  'contents/create',
  async (contentData: {
    title: string;
    categoryId?: number | null;
    type: string;
    content?: string;
    url?: string;
    status?: string;
    description?: string;
    accessLevel?: string;
    publishedAt?: Date;
    groupIds?: number[];
    unitIds?: number[];
  }, { rejectWithValue }) => {
    try {
      const res = await api.post('intranet/contents', contentData);
      toast.success('Conteúdo criado com sucesso!');
      return res.data as Content;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar conteúdo');
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar conteúdo');
    }
  }
);

export const updateContent = createAsyncThunk(
  'contents/update',
  async (payload: {
    id: number;
    title?: string;
    categoryId?: number | null;
    type?: string;
    content?: string;
    url?: string;
    status?: string;
    description?: string;
    accessLevel?: string;
    publishedAt?: Date;
  }, { rejectWithValue }) => {
    try {
      const { id, ...data } = payload;
      const res = await api.put(`intranet/contents/${id}`, data);
      toast.success('Conteúdo atualizado com sucesso!');
      return res.data as Content;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar conteúdo');
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar conteúdo');
    }
  }
);

export const deleteContent = createAsyncThunk(
  'contents/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`intranet/contents/${id}`);
      toast.success('Conteúdo deletado com sucesso!');
      return id;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao deletar conteúdo');
      return rejectWithValue(error.response?.data?.message || 'Erro ao deletar conteúdo');
    }
  }
);

export const inactivateContent = createAsyncThunk(
  'contents/inactivate',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.patch(`intranet/contents/${id}/inactivate`);
      toast.success('Conteúdo inativado com sucesso!');
      return id;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao inativar conteúdo');
      return rejectWithValue(error.response?.data?.message || 'Erro ao inativar conteúdo');
    }
  }
);

const contentsSlice = createSlice({
  name: 'contents',
  initialState,
  reducers: {
    clearCurrent(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContentsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContentsByCategory.fulfilled, (state, action: PayloadAction<Content[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchContentsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar conteúdos';
      })
      .addCase(fetchContentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContentById.fulfilled, (state, action: PayloadAction<Content>) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchContentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar conteúdo';
      })
      .addCase(fetchAllContents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllContents.fulfilled, (state, action: PayloadAction<Content[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllContents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar conteúdos';
      })
      .addCase(createContent.fulfilled, (state, action: PayloadAction<Content>) => {
        state.items.push(action.payload);
      })
      .addCase(updateContent.fulfilled, (state, action: PayloadAction<Content>) => {
        const index = state.items.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.current?.id === action.payload.id) {
          state.current = action.payload;
        }
      })
      .addCase(deleteContent.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
        if (state.current?.id === action.payload) {
          state.current = null;
        }
      })
      .addCase(inactivateContent.fulfilled, (state, action: PayloadAction<number>) => {
        const item = state.items.find((c) => c.id === action.payload);
        if (item) {
          item.status = 'inactive';
        }
        if (state.current?.id === action.payload) {
          state.current.status = 'inactive';
        }
      });
  },
});

export const { clearCurrent } = contentsSlice.actions;
export default contentsSlice.reducer;



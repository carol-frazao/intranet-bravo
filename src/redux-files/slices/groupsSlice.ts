import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/utils/axios';
import { toast } from 'react-toastify';

interface Group {
  id: number;
  name: string;
  code: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupsState {
  items: Group[];
  loading: boolean;
  error: string | null;
}

const initialState: GroupsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async (filters: { status?: string; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/intranet/groups', { params: filters });
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao buscar grupos');
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar grupos');
    }
  }
);

export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (groupData: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/intranet/groups', groupData);
      toast.success('Grupo criado com sucesso!');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar grupo');
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar grupo');
    }
  }
);

export const updateGroup = createAsyncThunk(
  'groups/updateGroup',
  async ({ id, groupData }: { id: number; groupData: any }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/intranet/groups/${id}`, groupData);
      toast.success('Grupo atualizado com sucesso!');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar grupo');
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar grupo');
    }
  }
);

export const toggleGroupStatus = createAsyncThunk(
  'groups/toggleGroupStatus',
  async ({ id, force = false }: { id: number; force?: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/intranet/groups/${id}/inactivate`, null, {
        params: { force: force.toString() }
      });
      if (response.data.needsConfirmation) {
        return { needsConfirmation: true, data: response.data, id };
      }
      toast.success('Status do grupo atualizado!');
      return { data: response.data, id };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar status do grupo');
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar status do grupo');
    }
  }
);

export const deleteGroup = createAsyncThunk(
  'groups/deleteGroup',
  async ({ id, force = false }: { id: number; force?: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/intranet/groups/${id}`, {
        params: { force: force.toString() }
      });
      if (response.data.needsConfirmation) {
        return { needsConfirmation: true, data: response.data, id };
      }
      toast.success('Grupo deletado com sucesso!');
      return { data: response.data, id };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao deletar grupo');
      return rejectWithValue(error.response?.data?.message || 'Erro ao deletar grupo');
    }
  }
);

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action: PayloadAction<Group[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createGroup.fulfilled, (state, action: PayloadAction<Group>) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateGroup.fulfilled, (state, action: PayloadAction<Group>) => {
        const index = state.items.findIndex(group => group.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(toggleGroupStatus.fulfilled, (state, action) => {
        if (!action.payload.needsConfirmation) {
          const index = state.items.findIndex(group => group.id === action.payload.id);
          if (index !== -1) {
            state.items[index] = action.payload.data;
          }
        }
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        if (!action.payload.needsConfirmation) {
          state.items = state.items.filter(group => group.id !== action.payload.id);
        }
      });
  },
});

export default groupsSlice.reducer;


import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/utils/axios';
import { toast } from 'react-toastify';

interface Unit {
  id: number;
  name: string;
  code: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UnitsState {
  items: Unit[];
  loading: boolean;
  error: string | null;
}

const initialState: UnitsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchUnits = createAsyncThunk(
  'units/fetchUnits',
  async (filters: { status?: string; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/intranet/units', { params: filters });
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao buscar unidades');
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar unidades');
    }
  }
);

export const createUnit = createAsyncThunk(
  'units/createUnit',
  async (unitData: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/intranet/units', unitData);
      toast.success('Unidade criada com sucesso!');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar unidade');
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar unidade');
    }
  }
);

export const updateUnit = createAsyncThunk(
  'units/updateUnit',
  async ({ id, unitData }: { id: number; unitData: any }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/intranet/units/${id}`, unitData);
      toast.success('Unidade atualizada com sucesso!');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar unidade');
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar unidade');
    }
  }
);

export const toggleUnitStatus = createAsyncThunk(
  'units/toggleUnitStatus',
  async ({ id, force = false }: { id: number; force?: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/intranet/units/${id}/inactivate`, null, {
        params: { force: force.toString() }
      });
      if (response.data.needsConfirmation) {
        return { needsConfirmation: true, data: response.data, id };
      }
      toast.success('Status da unidade atualizado!');
      return { data: response.data, id };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar status da unidade');
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar status da unidade');
    }
  }
);

export const deleteUnit = createAsyncThunk(
  'units/deleteUnit',
  async ({ id, force = false }: { id: number; force?: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/intranet/units/${id}`, {
        params: { force: force.toString() }
      });
      if (response.data.needsConfirmation) {
        return { needsConfirmation: true, data: response.data, id };
      }
      toast.success('Unidade deletada com sucesso!');
      return { data: response.data, id };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao deletar unidade');
      return rejectWithValue(error.response?.data?.message || 'Erro ao deletar unidade');
    }
  }
);

const unitsSlice = createSlice({
  name: 'units',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnits.fulfilled, (state, action: PayloadAction<Unit[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUnits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createUnit.fulfilled, (state, action: PayloadAction<Unit>) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateUnit.fulfilled, (state, action: PayloadAction<Unit>) => {
        const index = state.items.findIndex(unit => unit.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(toggleUnitStatus.fulfilled, (state, action) => {
        if (!action.payload.needsConfirmation) {
          const index = state.items.findIndex(unit => unit.id === action.payload.id);
          if (index !== -1) {
            state.items[index] = action.payload.data;
          }
        }
      })
      .addCase(deleteUnit.fulfilled, (state, action) => {
        if (!action.payload.needsConfirmation) {
          state.items = state.items.filter(unit => unit.id !== action.payload.id);
        }
      });
  },
});

export default unitsSlice.reducer;


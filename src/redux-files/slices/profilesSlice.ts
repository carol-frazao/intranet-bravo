import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/utils/axios';
import { toast } from 'react-toastify';

export interface Profile {
  id: number;
  name: string;
  code: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfilesState {
  profiles: Profile[];
  total: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  currentProfile: Profile | null;
}

const initialState: ProfilesState = {
  profiles: [],
  total: 0,
  totalPages: 0,
  currentPage: 1,
  loading: false,
  error: null,
  currentProfile: null,
};

// Fetch profiles with pagination and filters
export const fetchProfiles = createAsyncThunk(
  'profiles/fetchProfiles',
  async (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/intranet/profiles', { params });
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao buscar perfis');
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar perfis');
    }
  }
);

// Fetch single profile by ID
export const fetchProfileById = createAsyncThunk(
  'profiles/fetchProfileById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/intranet/profiles/${id}`);
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao buscar perfil');
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar perfil');
    }
  }
);

// Create profile
export const createProfile = createAsyncThunk(
  'profiles/createProfile',
  async (profileData: {
    name: string;
    code?: string;
    status?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/intranet/profiles', profileData);
      toast.success('Perfil criado com sucesso!');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar perfil');
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar perfil');
    }
  }
);

// Update profile
export const updateProfile = createAsyncThunk(
  'profiles/updateProfile',
  async ({ id, data }: { id: number; data: Partial<Profile> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/intranet/profiles/${id}`, data);
      toast.success('Perfil atualizado com sucesso!');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar perfil');
    }
  }
);

// Toggle profile status (active/inactive)
export const toggleProfileStatus = createAsyncThunk(
  'profiles/toggleProfileStatus',
  async ({ id, force = false }: { id: number; force?: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/intranet/profiles/${id}/inactivate`, null, {
        params: { force: force.toString() }
      });
      if (response.data.needsConfirmation) {
        return { data: response.data, id };
      }
      toast.success('Status do perfil atualizado!');
      return { data: response.data, id };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status do perfil');
      return rejectWithValue(error.response?.data?.message || 'Erro ao alterar status do perfil');
    }
  }
);

// Delete profile permanently
export const deleteProfile = createAsyncThunk(
  'profiles/deleteProfile',
  async ({ id, force = false }: { id: number; force?: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/intranet/profiles/${id}`, {
        params: { force: force.toString() }
      });
      if (response.data.needsConfirmation) {
        return { data: response.data, id };
      }
      toast.success('Perfil deletado com sucesso!');
      return { data: response.data, id };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao deletar perfil');
      return rejectWithValue(error.response?.data?.message || 'Erro ao deletar perfil');
    }
  }
);

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    clearCurrentProfile: (state) => {
      state.currentProfile = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profiles
      .addCase(fetchProfiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.loading = false;
        state.profiles = action.payload.profiles;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao buscar perfis';
      })

      // Fetch profile by ID
      .addCase(fetchProfileById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfileById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProfile = action.payload;
      })
      .addCase(fetchProfileById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao buscar perfil';
      })

      // Create profile
      .addCase(createProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profiles.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao criar perfil';
      })

      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.profiles.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.profiles[index] = action.payload;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao atualizar perfil';
      })

      // Toggle profile status
      .addCase(toggleProfileStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleProfileStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload.data.needsConfirmation) {
          const index = state.profiles.findIndex((p) => p.id === action.payload.id);
          if (index !== -1) {
            state.profiles[index] = action.payload.data;
          }
        }
      })
      .addCase(toggleProfileStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao alterar status do perfil';
      })

      // Delete profile
      .addCase(deleteProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload.data.needsConfirmation) {
          state.profiles = state.profiles.filter((p) => p.id !== action.payload.id);
          state.total -= 1;
        }
      })
      .addCase(deleteProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao deletar perfil';
      });
  },
});

export const { clearCurrentProfile, clearError } = profilesSlice.actions;
export default profilesSlice.reducer;


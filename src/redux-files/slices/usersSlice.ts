import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/utils/axios';
import { toast } from 'react-toastify';

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  profile: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UsersState {
  users: User[];
  total: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  currentUser: User | null;
}

const initialState: UsersState = {
  users: [],
  total: 0,
  totalPages: 0,
  currentPage: 1,
  loading: false,
  error: null,
  currentUser: null,
};

// Fetch users with pagination and filters
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params: {
    page?: number;
    limit?: number;
    status?: string;
    profile?: string;
    search?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/intranet/users', { params });
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao buscar usuários');
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar usuários');
    }
  }
);

// Fetch single user by ID
export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/intranet/users/${id}`);
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao buscar usuário');
      return rejectWithValue(error.response?.data?.message || 'Erro ao buscar usuário');
    }
  }
);

// Create user
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: {
    name: string;
    email: string;
    password: string;
    profile: string;
    status?: string;
    groupIds?: number[];
    unitIds?: number[];
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/intranet/users', userData);
      toast.success('Usuário criado com sucesso!');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar usuário');
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar usuário');
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, data }: { id: number; data: Partial<User> & { groupIds?: number[]; unitIds?: number[] } }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/intranet/users/${id}`, data);
      toast.success('Usuário atualizado com sucesso!');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar usuário');
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar usuário');
    }
  }
);

// Inactivate/Activate user (toggle status)
export const inactivateUser = createAsyncThunk(
  'users/inactivateUser',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/intranet/users/${id}/inactivate`);
      const isActivating = response.data.user?.status === 'active';
      toast.success(isActivating ? 'Usuário ativado com sucesso!' : 'Usuário inativado com sucesso!');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status do usuário');
      return rejectWithValue(error.response?.data?.message || 'Erro ao alterar status do usuário');
    }
  }
);

// Delete user (hard delete - permanent)
export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/intranet/users/${id}`);
      toast.success('Usuário excluído permanentemente!');
      return id;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir usuário');
      return rejectWithValue(error.response?.data?.message || 'Erro ao excluir usuário');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao buscar usuários';
      })

      // Fetch user by ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao buscar usuário';
      })

      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao criar usuário';
      })

      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao atualizar usuário';
      })

      // Inactivate user
      .addCase(inactivateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(inactivateUser.fulfilled, (state, action) => {
        state.loading = false;
        // O payload pode ser { message, user } ou apenas o user
        const user = action.payload.user || action.payload;
        if (user && user.id) {
          const index = state.users.findIndex((u) => u.id === user.id);
          if (index !== -1) {
            // Atualiza com o status que vem do backend (pode ser 'active' ou 'inactive')
            state.users[index].status = user.status;
          }
        }
      })
      .addCase(inactivateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao inativar usuário';
      })

      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao deletar usuário';
      });
  },
});

export const { clearCurrentUser, clearError } = usersSlice.actions;
export default usersSlice.reducer;


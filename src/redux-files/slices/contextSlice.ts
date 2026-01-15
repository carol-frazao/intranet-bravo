import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ContextGroup {
  id: number;
  name: string;
  code: string;
}

export interface ContextUnit {
  id: number;
  name: string;
  code: string;
}

interface ContextState {
  availableGroups: ContextGroup[];
  availableUnits: ContextUnit[];
  /**
   * Seleção feita no header.
   * Regra: array vazio => "Todas" (todas as permitidas para o usuário).
   */
  selectedGroupIds: number[];
  selectedUnitIds: number[];
  /**
   * Flag para forçar reload dos grupos/unidades do usuário.
   * Incrementa quando o usuário logado é atualizado.
   */
  refreshTrigger: number;
}

const initialState: ContextState = {
  availableGroups: [],
  availableUnits: [],
  selectedGroupIds: [],
  selectedUnitIds: [],
  refreshTrigger: 0,
};

const contextSlice = createSlice({
  name: 'context',
  initialState,
  reducers: {
    setAvailableGroups(state, action: PayloadAction<ContextGroup[]>) {
      state.availableGroups = action.payload;
    },
    setAvailableUnits(state, action: PayloadAction<ContextUnit[]>) {
      state.availableUnits = action.payload;
    },
    setSelectedGroupIds(state, action: PayloadAction<number[]>) {
      state.selectedGroupIds = action.payload;
    },
    setSelectedUnitIds(state, action: PayloadAction<number[]>) {
      state.selectedUnitIds = action.payload;
    },
    resetContext(state) {
      state.availableGroups = [];
      state.availableUnits = [];
      state.selectedGroupIds = [];
      state.selectedUnitIds = [];
    },
    refreshUserContext(state) {
      // Incrementa o trigger para forçar reload no GroupUnitSelector
      state.refreshTrigger += 1;
    },
  },
});

export const {
  setAvailableGroups,
  setAvailableUnits,
  setSelectedGroupIds,
  setSelectedUnitIds,
  resetContext,
  refreshUserContext,
} = contextSlice.actions;

export default contextSlice.reducer;




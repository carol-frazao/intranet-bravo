'use client';
import { configureStore } from '@reduxjs/toolkit';
import categoriesReducer from './slices/categoriesSlice';
import contentsReducer from './slices/contentsSlice';
import usersReducer from './slices/usersSlice';
import profilesReducer from './slices/profilesSlice';
import groupsReducer from './slices/groupsSlice';
import unitsReducer from './slices/unitsSlice';
import contextReducer from './slices/contextSlice';

export const store = configureStore({
  reducer: {
    categories: categoriesReducer,
    contents: contentsReducer,
    users: usersReducer,
    profiles: profilesReducer,
    groups: groupsReducer,
    units: unitsReducer,
    context: contextReducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



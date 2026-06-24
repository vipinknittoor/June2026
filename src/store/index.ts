"use client";

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import authReducer from "./authSlice";
import uiReducer from "./uiSlice";

const createNoopStorage = () => ({
  getItem: async () => null,
  setItem: async (_key: string, value: string) => value,
  removeItem: async () => undefined,
});

const storage =
  typeof window !== "undefined" ? createWebStorage("session") : createNoopStorage();

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
});

const persistedReducer = persistReducer(
  {
    key: "task-dashboard",
    storage,
    whitelist: ["auth"],
  },
  rootReducer,
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

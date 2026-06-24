import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Role, User } from "@/types/user.types";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  role: Role | null;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  role: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken: string;
        user: User;
        role: Role;
      }>,
    ) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.role = action.payload.role;
    },
    setTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken: string }>,
    ) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    },
    clearAuth: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.role = null;
    },
  },
});

export const { setCredentials, setTokens, clearAuth } = authSlice.actions;
export default authSlice.reducer;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Role, User } from "@/types/user.types";

interface AuthState {
  token: string | null;
  user: User | null;
  role: Role | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  role: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: User; role: Role }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.role = action.payload.role;
    },
    clearAuth: (state) => {
      state.token = null;
      state.user = null;
      state.role = null;
    },
  },
});

export const { setCredentials, clearAuth } = authSlice.actions;
export default authSlice.reducer;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Priority, TaskStatus } from "@/types/task.types";

interface TaskFilters {
  status: TaskStatus | "ALL";
  priority: Priority | "ALL";
  employeeId: string;
  dateFrom: string;
  dateTo: string;
}

interface UiState {
  sidebarOpen: boolean;
  taskFilters: TaskFilters;
}

const initialState: UiState = {
  sidebarOpen: false,
  taskFilters: {
    status: "ALL",
    priority: "ALL",
    employeeId: "",
    dateFrom: "",
    dateTo: "",
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTaskFilters: (state, action: PayloadAction<Partial<TaskFilters>>) => {
      state.taskFilters = { ...state.taskFilters, ...action.payload };
    },
  },
});

export const { setSidebarOpen, setTaskFilters } = uiSlice.actions;
export default uiSlice.reducer;

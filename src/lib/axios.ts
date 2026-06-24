import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearAuth, setTokens } from "@/store/authSlice";
import { store } from "@/store";

export interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data: T;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequest | undefined;
    const isAuthRoute =
      request?.url?.includes("/auth/login") ||
      request?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && request && !request._retry && !isAuthRoute) {
      const refreshToken = store.getState().auth.refreshToken;

      if (refreshToken) {
        request._retry = true;

        try {
          refreshPromise ??= refreshClient
            .post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
              "/auth/refresh",
              { refreshToken },
            )
            .then(({ data }) => {
              store.dispatch(
                setTokens({
                  token: data.data.accessToken,
                  refreshToken: data.data.refreshToken,
                }),
              );
              return data.data.accessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });

          const accessToken = await refreshPromise;
          request.headers.Authorization = `Bearer ${accessToken}`;
          return api(request);
        } catch {
          // The refresh token is invalid or expired; clear the local session below.
        }
      }

      store.dispatch(clearAuth());
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export function unwrapApiData<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}

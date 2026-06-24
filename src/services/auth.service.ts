import { api, type ApiResponse, unwrapApiData } from "@/lib/axios";
import { jwtDecode } from "jwt-decode";
import type { Role, User } from "@/types/user.types";
import { createDemoToken, findDemoUser } from "./mockData";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface BackendLoginData {
  accessToken: string;
  refreshToken: string;
  user?: User;
}

interface AccessTokenClaims {
  sub?: string;
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
  title?: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const response = await api.post<ApiResponse<BackendLoginData>>(
      "/auth/login",
      payload,
    );
    const data = unwrapApiData(response);

    if (data.user) {
      return { ...data, user: data.user };
    }

    const claims = jwtDecode<AccessTokenClaims>(data.accessToken);
    const role = claims.role?.toUpperCase();

    if (role !== "ADMIN" && role !== "EMPLOYEE") {
      throw new Error("The access token does not contain a valid user role");
    }

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: {
        id: claims.userId ?? claims.id ?? claims.sub ?? "",
        name: claims.name ?? payload.email.split("@")[0],
        email: claims.email ?? payload.email,
        role: role as Role,
        title: claims.title as User["title"],
      },
    };
  } catch (error) {
    if (process.env.NEXT_PUBLIC_ENABLE_MOCKS !== "true") {
      throw error;
    }

    const demoUser = findDemoUser(payload.email, payload.password);

    if (!demoUser) {
      throw new Error("Invalid demo credentials");
    }

    return {
      accessToken: createDemoToken(demoUser),
      refreshToken: `demo-refresh-${demoUser.id}`,
      user: demoUser,
    };
  }
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

import { api } from "@/lib/axios";
import { createDemoToken, findDemoUser } from "./mockData";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>("/auth/login", payload);
    return response.data;
  } catch {
    const demoUser = findDemoUser(payload.email, payload.password);

    if (!demoUser) {
      throw new Error("Invalid demo credentials");
    }

    return {
      token: createDemoToken(demoUser),
    };
  }
}

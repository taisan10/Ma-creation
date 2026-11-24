"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, setSession, type User, ApiError } from "@/lib/api";
import { adminKeys, authKeys } from "@/lib/query-keys";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  accessToken?: string;
  user: User;
}

/**
 * Senior Custom Mutation Hook for Authentication
 * Uses TanStack Query v5 useMutation for zero-boilerplate async lifecycle.
 * Features:
 * - Session token persistence (mac_token, mac_user)
 * - Automatic TanStack cache invalidation (dashboard + auth)
 * - Immediate router redirect to /admin
 * - Sonner notification feedback
 */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, ApiError, LoginCredentials>({
    mutationFn: (credentials: LoginCredentials) =>
      api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    onSuccess: (data) => {
      setSession(data.token, data.user);
      // Invalidate dashboard and user queries so live MongoDB stats are ready
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      toast.success(`Welcome back, ${data.user.name || "Admin"}!`);
      router.push("/admin");
    },
    onError: (err: ApiError) => {
      toast.error(err.message || "Invalid email or password. Please try again.");
    },
  });
}

import { useAuthStore } from "@/store/use-auth-store";


// 1. Production Type-Safe Error Class
export class ApiError extends Error {
  constructor(public status: number, public code?: string, message?: string) {
    super(message || `API Error: ${status}`);
    this.name = "ApiError";
  }
}

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  phone?: string;
  company?: string;
  [key: string]: unknown;
}

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");

// 2. Safe JSON Helper (Zero Try-Catch Boilerplate)
const safeJSON = async (res: Response) => res.json().catch(() => ({}));

// 3. Shared Single-Promise Refresh Engine
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-refresh-token": "1" },
      credentials: "include",
    });

    const data = await safeJSON(res);

    if (!res.ok) {
      if (data?.code === "SESSION_REPLACED" && typeof window !== "undefined") {
        sessionStorage.setItem("auth_notice", "Aapka account kisi doosre device me login hua hai.");
      }
      return null;
    }

    if (data?.token) {
      if (data.user) {
        useAuthStore.getState().setAuth(data.user, data.token);
      }
      return data.token;
    }
    return null;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// 4. Main Universal Fetcher (With Switch-Case Status Handling)
export async function getValidToken(): Promise<string | null> {
  let token = useAuthStore.getState().token;
  if (!token && typeof window !== "undefined" && document.cookie.includes("mac_session=1")) {
    token = await tryRefreshToken();
  }
  return token;
}

/**
 * For heavy binary streaming (Video uploads & HLS video playback),
 * bypass Next.js dev server 30-second proxy rewrite timeout on localhost
 * and communicate directly with the Express backend.
 */
export function getDirectApiUrl(endpoint: string): string {
  const clean = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")) {
    return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${clean}`;
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return `http://localhost:5000/api${clean}`;
  }
  return `/api${clean}`;
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getValidToken();
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(options.body && !isForm ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string> || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // ⚡ Clean Switch-Case for HTTP Status Codes
  switch (response.status) {
    case 200:
    case 201:
    case 204:
      return (await safeJSON(response)) as T;

    case 401: {
      // Avoid infinite loop on auth endpoints
      if (path.startsWith("/auth/")) break;

      const newToken = await tryRefreshToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        const retryRes = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
        if (retryRes.ok) return (await safeJSON(retryRes)) as T;

        // Sirf tabhi logout karein jab retry bhi 401 de. Server errors (500, 502) par user session persist rehna chahiye.
        if (retryRes.status !== 401) {
          const retryErr = await safeJSON(retryRes);
          throw new ApiError(retryRes.status, retryErr?.code, retryErr?.message);
        }
      }

      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
      break;
    }

    case 403:
      console.warn(`[Forbidden Access]: 403 on ${path}`);
      break;

    default:
      break;
  }

  const errData = await safeJSON(response);
  throw new ApiError(response.status, errData?.code, errData?.message);
}

// 5. Clean Session Helpers
export const setSession = (token: string, user: User) => {
  if (typeof window === "undefined") return;
  useAuthStore.getState().setAuth(user, token);
  document.cookie = `mac_session=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  useAuthStore.getState().clearAuth();
  document.cookie = "mac_session=; path=/; max-age=0; SameSite=Lax";
};

export const getUser = (): User | null => {
  return useAuthStore.getState().user;
};

export const logout = async () => {
  await api("/auth/logout", {
    method: "POST",
    headers: { "x-refresh-token": "1" },
  }).catch(() => {});
  clearSession();
};
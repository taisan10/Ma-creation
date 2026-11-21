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
      localStorage.setItem("mac_token", data.token);
      if (data.user) localStorage.setItem("mac_user", JSON.stringify(data.user));
      return data.token;
    }
    return null;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// 4. Main Universal Fetcher (With Switch-Case Status Handling)
export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("mac_token") : null;
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
      }

      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
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
  localStorage.setItem("mac_token", token);
  localStorage.setItem("mac_user", JSON.stringify(user));
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("mac_token");
  localStorage.removeItem("mac_user");
};

export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;
  return JSON.parse(localStorage.getItem("mac_user") || "null");
};

export const logout = async () => {
  await api("/auth/logout", {
    method: "POST",
    headers: { "x-refresh-token": "1" },
  }).catch(() => {});
  clearSession();
};
// ============================================================
// AthleteSafe — API Client
// Connects frontend to FastAPI backend
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ── Token management ──────────────────────────────────────────
export const getToken = (): string | null => localStorage.getItem('athletesafe_token');
export const setToken = (t: string)        => localStorage.setItem('athletesafe_token', t);
export const clearToken = ()               => localStorage.removeItem('athletesafe_token');

// ── Base fetch wrapper ────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Clear token but do NOT hard-redirect — let React Router handle navigation
    // Hard redirects cause reload loops when called from useEffect on mount
    clearToken();
    throw new Error('Unauthorised');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

// ── Multipart upload ──────────────────────────────────────────
async function upload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    clearToken();
    throw new Error('Unauthorised');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Upload failed');
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────
export interface ApiUser {
  id:           string;
  name:         string;
  email:        string;
  role:         string;
  organisation: string;
  created_at:   string;
}

export interface ApiToken {
  access_token: string;
  token_type:   string;
  user:         ApiUser;
}

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; role: string; organisation: string }) =>
    request<ApiToken>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    request<ApiToken>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request<ApiUser>('/api/auth/me'),

  logout: () => request('/api/auth/logout', { method: 'POST' }),
};

// ── Athletes ──────────────────────────────────────────────────
export const athletesApi = {
  list:   ()                    => request<any[]>('/api/athletes'),
  get:    (id: string)          => request<any>(`/api/athletes/${id}`),
  create: (data: any)           => request<any>('/api/athletes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/api/athletes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string)          => request<void>(`/api/athletes/${id}`, { method: 'DELETE' }),
};

// ── Prediction ────────────────────────────────────────────────
export const predictApi = {
  predict: (data: any) =>
    request<any>('/api/predict', { method: 'POST', body: JSON.stringify(data) }),

  history: () => request<any[]>('/api/predict/history'),
};

// ── Pose Analysis ─────────────────────────────────────────────
export const poseApi = {
  analyze: (file: File, sport: string, athleteName: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('sport', sport);
    fd.append('athlete_name', athleteName);
    return upload<any>('/api/pose/analyze', fd);
  },

  history: () => request<any[]>('/api/pose/history'),
};

// ── Health ────────────────────────────────────────────────────
export const healthApi = {
  check: () => request<{ status: string; version: string }>('/health'),
};

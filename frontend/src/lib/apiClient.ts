const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const getAuthToken = (): string => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
  if (match) return match[2];
  try {
    return localStorage.getItem('auth_token') || '';
  } catch {
    return '';
  }
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  // Si la sesión expiró (401), limpiar y redirigir al login
  if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/login')) {
    const isHttps = window.location.protocol === 'https:';
    const secureFlag = isHttps ? '; Secure' : '';
    document.cookie = `auth_token=; Max-Age=0; path=/; SameSite=Lax${secureFlag}`;
    document.cookie = `user_role=; Max-Age=0; path=/; SameSite=Lax${secureFlag}`;
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
    } catch {}
    window.location.replace('/login');
  }

  return response;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const getAuthToken = (): string => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
  return match ? match[2] : '';
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
    ...options,
    headers,
  });

  // Si la sesión expiró (401), redirigir al login sin exponer detalles
  if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/login')) {
    document.cookie = 'auth_token=; Max-Age=0; path=/';
    window.location.href = '/login';
  }

  return response;
};

// FIXED: checkout/page.tsx used hardcoded 'http://localhost:5000/api' in 3 places — all replaced with this util

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

export const fetchApi = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, { ...fetchOptions, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('glowaura_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('glowaura_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('glowaura_token');
};

export { API_URL };

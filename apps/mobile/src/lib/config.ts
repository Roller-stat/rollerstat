function normalizeBaseUrl(value: string | undefined): string {
  const fallback = 'http://10.0.2.2:3000';
  const raw = (value || fallback).trim();
  return raw.replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
export const ACCOUNT_DELETE_WEB_URL = `${API_BASE_URL}/en/account/delete`;

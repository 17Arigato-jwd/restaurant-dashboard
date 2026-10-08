import { useAppStore } from '@/store/useAppStore';

/** Returns headers including the current session's bearer token, when present. */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = useAppStore.getState().token;
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

/** fetch() wrapper that automatically attaches the session token. */
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const extra: Record<string, string> = {};
  if (init.body) extra['Content-Type'] = 'application/json';
  return fetch(input, { ...init, headers: authHeaders(extra) });
}

const DEFAULT_API_BASE_URL = 'https://astromitra-kundliapi.onrender.com';

export function getApiBaseUrl() {
  return localStorage.getItem('astromitra_admin_api_base') || DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(url) {
  localStorage.setItem('astromitra_admin_api_base', url.replace(/\/+$/, ''));
}

export function getToken() {
  return localStorage.getItem('astromitra_admin_token');
}

export function setToken(token) {
  localStorage.setItem('astromitra_admin_token', token);
}

export function clearToken() {
  localStorage.removeItem('astromitra_admin_token');
}

/**
 * Thin fetch wrapper used by every page. Centralizes the base URL, auth
 * header, and a consistent error shape (throws Error with .message/.code/
 * .status). On a 401 it clears the stale token and throws — callers in
 * pages let that propagate up to the surrounding try/catch, and
 * <ProtectedRoute> separately re-checks auth on next navigation/render.
 */
export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (!token) {
      throw new Error('Not logged in.');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error(
      `Could not reach the backend at ${getApiBaseUrl()}. Check the API Base URL on the login screen and that the server is running.`
    );
  }

  let json = null;
  try {
    json = await response.json();
  } catch (parseErr) {
    // non-JSON response (e.g. a proxy error page) — json stays null
  }

  if (response.status === 401 && auth) {
    clearToken();
    const message = (json && json.error && json.error.message) || 'Session expired. Please log in again.';
    const err = new Error(message);
    err.status = 401;
    throw err;
  }

  if (!response.ok || !json || json.success === false) {
    const message = (json && json.error && json.error.message) || (json && json.message) || `Request failed (${response.status}).`;
    const err = new Error(message);
    err.code = json && json.error && json.error.code;
    err.status = response.status;
    throw err;
  }

  return json;
}

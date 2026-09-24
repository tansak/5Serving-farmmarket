const TOKEN_KEY = "5s_session";

export function getSessionToken() {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setSessionToken(token) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function clearSessionToken() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

export function authHeaders() {
  const token = getSessionToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// Decode the token payload on the client (no crypto — server verifies on API calls)
export function decodeSessionToken() {
  const token = getSessionToken();
  if (!token) return null;
  try {
    const encoded = token.split(".")[0];
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (payload.exp < Date.now()) { clearSessionToken(); return null; }
    return payload;
  } catch { return null; }
}

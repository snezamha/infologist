const SESSION_COOKIE_BASE = "authjs.session-token";
const SESSION_COOKIE_SECURE_PREFIX = "__Secure-";

export function getSessionCookieName(secure: boolean): string {
  return secure
    ? `${SESSION_COOKIE_SECURE_PREFIX}${SESSION_COOKIE_BASE}`
    : SESSION_COOKIE_BASE;
}

export function isSessionCookieName(name: string, secure: boolean): boolean {
  const base = getSessionCookieName(secure);
  return name === base || name.startsWith(`${base}.`);
}

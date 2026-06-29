function getAllowedEmailDomains(): string[] | null {
  const raw = process.env.AUTH_ALLOWED_EMAIL_DOMAINS?.trim();

  if (!raw) {
    return null;
  }

  return raw
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  const allowedDomains = getAllowedEmailDomains();

  if (!allowedDomains) {
    return true;
  }

  if (!email) {
    return false;
  }

  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? allowedDomains.includes(domain) : false;
}

export function getClientIpFromHeaders(
  headers: Headers | { get(name: string): string | null },
): string {
  const forwarded = headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
}

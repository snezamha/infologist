type RemoteRateLimitResponse = {
  allowed: boolean;
  retryAfterMs: number;
};

export async function checkRateLimit(
  request: { url: string },
  key: string,
  limit: number,
  windowMs: number,
): Promise<RemoteRateLimitResponse> {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    return { allowed: false, retryAfterMs: windowMs };
  }

  try {
    const url = new URL(request.url);
    url.pathname = "/api/internal/rate-limit";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-rate-limit-secret": secret,
      },
      body: JSON.stringify({ key, limit, windowMs }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { allowed: false, retryAfterMs: windowMs };
    }

    const result = (await response.json()) as RemoteRateLimitResponse;
    if (
      typeof result.allowed === "boolean" &&
      typeof result.retryAfterMs === "number"
    ) {
      return result;
    }
  } catch {}

  return { allowed: false, retryAfterMs: windowMs };
}

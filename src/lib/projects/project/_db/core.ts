import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type NeonSql = NeonQueryFunction<false, false>;
export type ProjectDbRow = Record<string, unknown>;

const MAX_CACHED_CONNECTIONS = 50;
const sqlCache = new Map<string, NeonSql>();

function normalizeNeonUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return url;
  }
}

export function getProjectSql(databaseUrl: string): NeonSql {
  const normalizedUrl = normalizeNeonUrl(databaseUrl);
  const cached = sqlCache.get(normalizedUrl);

  if (cached) {
    sqlCache.delete(normalizedUrl);
    sqlCache.set(normalizedUrl, cached);
    return cached;
  }

  const sql = neon(normalizedUrl);
  sqlCache.set(normalizedUrl, sql);

  if (sqlCache.size > MAX_CACHED_CONNECTIONS) {
    const oldest = sqlCache.keys().next().value;
    if (oldest !== undefined) sqlCache.delete(oldest);
  }

  return sql;
}

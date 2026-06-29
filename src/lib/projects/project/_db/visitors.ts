import { getProjectSql, type ProjectDbRow } from "./core";
import { ensureProjectVisitorsTable } from "./feature-schemas";

export type ProjectLiveVisitor = {
  visitorId: string;
  userId: string | null;
  path: string;
  os: string | null;
  browser: string | null;
  lastSeenAt: Date;
};

export type ProjectVisitorRecord = {
  id: string;
  visitorId: string;
  userId: string | null;
  path: string;
  ipAddress: string | null;
  os: string | null;
  browser: string | null;
  entryTime: Date;
  lastSeenAt: Date;
  totalActiveTime: number | null;
};

export async function insertProjectVisitor(
  databaseUrl: string,
  data: {
    id: string;
    visitorId: string;
    userId?: string | null;
    path: string;
    url: string;
    referrer?: string;
    userAgent?: string;
    os?: string;
    browser?: string;
    ipAddress?: string;
    entryTime: Date;
  },
): Promise<string> {
  await ensureProjectVisitorsTable(databaseUrl);
  const sql = getProjectSql(databaseUrl);

  await sql`
    INSERT INTO visitors (
      id, visitor_id, user_id, path, url, referrer, user_agent,
      os, browser, ip_address, entry_time
    ) VALUES (
      ${data.id},
      ${data.visitorId},
      ${data.userId ?? null},
      ${data.path},
      ${data.url},
      ${data.referrer ?? null},
      ${data.userAgent ?? null},
      ${data.os ?? null},
      ${data.browser ?? null},
      ${data.ipAddress ?? null},
      ${data.entryTime.toISOString()}
    )
  `;

  return data.id;
}

export async function updateProjectVisitorHeartbeat(
  databaseUrl: string,
  id: string,
  totalActiveTime?: number,
): Promise<void> {
  const sql = getProjectSql(databaseUrl);

  if (totalActiveTime != null && totalActiveTime >= 0) {
    await sql`
      UPDATE visitors
      SET last_seen_at      = NOW(),
          total_active_time = ${totalActiveTime}
      WHERE id = ${id}
    `;
  } else {
    await sql`
      UPDATE visitors
      SET last_seen_at = NOW()
      WHERE id = ${id}
    `;
  }
}

export async function updateProjectVisitorExit(
  databaseUrl: string,
  id: string,
  exitTime: Date,
  totalActiveTime?: number,
): Promise<void> {
  const sql = getProjectSql(databaseUrl);

  if (totalActiveTime != null) {
    await sql`
      UPDATE visitors
      SET exit_time         = ${exitTime.toISOString()},
          total_active_time = ${totalActiveTime}
      WHERE id = ${id}
    `;
  } else {
    await sql`
      UPDATE visitors
      SET exit_time = ${exitTime.toISOString()}
      WHERE id = ${id}
    `;
  }
}

export async function getProjectVisitorSummary(
  databaseUrl: string,
  from: Date,
  to: Date,
): Promise<{
  totalVisitors: number;
  totalSessions: number;
  totalActiveTime: number;
  avgActiveTime: number;
  dailyVisitors: Array<{ date: string; count: number }>;
}> {
  await ensureProjectVisitorsTable(databaseUrl);
  const sql = getProjectSql(databaseUrl);

  const rows = (await sql`
    SELECT
      visitor_id,
      entry_time,
      total_active_time
    FROM visitors
    WHERE entry_time >= ${from.toISOString()}
      AND entry_time <= ${to.toISOString()}
  `) as ProjectDbRow[];

  if (rows.length === 0) {
    return {
      totalVisitors: 0,
      totalSessions: 0,
      totalActiveTime: 0,
      avgActiveTime: 0,
      dailyVisitors: [],
    };
  }

  const uniqueIds = new Set(rows.map((r) => r.visitor_id as string));
  const trackedRows = rows.filter((r) => r.total_active_time != null);
  const totalActiveTime = trackedRows.reduce(
    (sum, r) => sum + Number(r.total_active_time ?? 0),
    0,
  );

  const dailyData: Record<string, number> = {};
  for (const row of rows) {
    const d = new Date(row.entry_time as string | Date);
    const dateStr = d.toISOString().slice(0, 10);
    dailyData[dateStr] = (dailyData[dateStr] ?? 0) + 1;
  }

  const dailyVisitors = Object.entries(dailyData)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalVisitors: uniqueIds.size,
    totalSessions: rows.length,
    totalActiveTime,
    avgActiveTime:
      trackedRows.length > 0 ? totalActiveTime / trackedRows.length : 0,
    dailyVisitors,
  };
}

export async function getProjectDetailedVisitorStats(
  databaseUrl: string,
): Promise<{
  os: Array<{ name: string; uv: number }>;
  browsers: Array<{ name: string; uv: number }>;
  urls: Array<{ name: string; uv: number }>;
  referrals: Array<{ name: string; uv: number }>;
}> {
  await ensureProjectVisitorsTable(databaseUrl);
  const sql = getProjectSql(databaseUrl);

  const rows = (await sql`
    SELECT path, os, browser, referrer FROM visitors
  `) as ProjectDbRow[];

  const osData: Record<string, number> = {};
  const browserData: Record<string, number> = {};
  const urlData: Record<string, number> = {};
  const referralData: Record<string, number> = {};

  for (const row of rows) {
    const os = row.os as string | null;
    const browser = row.browser as string | null;
    const path = row.path as string | null;
    const referrer = row.referrer as string | null;

    if (os) osData[os] = (osData[os] ?? 0) + 1;
    if (browser) browserData[browser] = (browserData[browser] ?? 0) + 1;
    if (path) urlData[path] = (urlData[path] ?? 0) + 1;
    if (referrer) {
      try {
        const domain = new URL(referrer).hostname;
        referralData[domain] = (referralData[domain] ?? 0) + 1;
      } catch {
        referralData[referrer] = (referralData[referrer] ?? 0) + 1;
      }
    }
  }

  const toSorted = (data: Record<string, number>) =>
    Object.entries(data)
      .map(([name, uv]) => ({ name, uv }))
      .sort((a, b) => b.uv - a.uv);

  return {
    os: toSorted(osData),
    browsers: toSorted(browserData),
    urls: toSorted(urlData),
    referrals: toSorted(referralData),
  };
}

export async function getLiveProjectVisitors(
  databaseUrl: string,
  cutoff: Date,
): Promise<ProjectLiveVisitor[]> {
  await ensureProjectVisitorsTable(databaseUrl);
  const sql = getProjectSql(databaseUrl);

  const rows = (await sql`
    SELECT visitor_id, user_id, path, os, browser, last_seen_at
    FROM visitors
    WHERE last_seen_at >= ${cutoff.toISOString()}
      AND exit_time IS NULL
    ORDER BY last_seen_at DESC
  `) as ProjectDbRow[];

  return rows.map((row) => ({
    visitorId: row.visitor_id as string,
    userId: (row.user_id as string | null) ?? null,
    path: row.path as string,
    os: (row.os as string | null) ?? null,
    browser: (row.browser as string | null) ?? null,
    lastSeenAt: new Date(row.last_seen_at as string | Date),
  }));
}

export async function getProjectVisitorRecords(
  databaseUrl: string,
  page = 1,
  pageSize = 20,
  query?: string,
): Promise<{ data: ProjectVisitorRecord[]; total: number }> {
  await ensureProjectVisitorsTable(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  const safePage = Math.max(page, 1);
  const safePageSize = Math.min(Math.max(pageSize, 1), 100);
  const offset = (safePage - 1) * safePageSize;
  const normalizedQuery = query?.trim() || null;
  const searchPattern = normalizedQuery ? `%${normalizedQuery}%` : null;

  const [rows, countRows] = await Promise.all([
    sql`
      SELECT
        id,
        visitor_id,
        user_id,
        path,
        ip_address,
        os,
        browser,
        entry_time,
        last_seen_at,
        total_active_time
      FROM visitors
      WHERE (
        ${searchPattern}::text IS NULL
        OR path ILIKE ${searchPattern}
        OR ip_address ILIKE ${searchPattern}
        OR os ILIKE ${searchPattern}
        OR browser ILIKE ${searchPattern}
        OR visitor_id ILIKE ${searchPattern}
        OR user_id ILIKE ${searchPattern}
      )
      ORDER BY entry_time DESC
      LIMIT ${safePageSize}
      OFFSET ${offset}
    ` as Promise<ProjectDbRow[]>,
    sql`
      SELECT COUNT(*)::int AS count
      FROM visitors
      WHERE (
        ${searchPattern}::text IS NULL
        OR path ILIKE ${searchPattern}
        OR ip_address ILIKE ${searchPattern}
        OR os ILIKE ${searchPattern}
        OR browser ILIKE ${searchPattern}
        OR visitor_id ILIKE ${searchPattern}
        OR user_id ILIKE ${searchPattern}
      )
    ` as Promise<ProjectDbRow[]>,
  ]);

  return {
    data: rows.map((row) => ({
      id: row.id as string,
      visitorId: row.visitor_id as string,
      userId: (row.user_id as string | null) ?? null,
      path: row.path as string,
      ipAddress: (row.ip_address as string | null) ?? null,
      os: (row.os as string | null) ?? null,
      browser: (row.browser as string | null) ?? null,
      entryTime: new Date(row.entry_time as string | Date),
      lastSeenAt: new Date(row.last_seen_at as string | Date),
      totalActiveTime:
        row.total_active_time == null ? null : Number(row.total_active_time),
    })),
    total: Number(countRows[0]?.count ?? 0),
  };
}

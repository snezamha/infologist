import { getProjectSql, type ProjectDbRow } from "./core";
import { ensureProjectMediaTable } from "./feature-schemas";

export type ProjectDbMediaAsset = {
  id: string;
  shortId: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  publicUrl: string;
  uploadedById: string | null;
  alt: string;
  caption: string;
  description: string;
  credit: string;
  createdAt: Date;
  updatedAt: Date;
};

function rowToMediaAsset(row: ProjectDbRow): ProjectDbMediaAsset {
  return {
    id: row.id as string,
    shortId: row.short_id as string,
    filename: row.filename as string,
    mimeType: row.mime_type as string,
    size: Number(row.size ?? 0),
    path: row.path as string,
    publicUrl: row.public_url as string,
    uploadedById: (row.uploaded_by_id as string | null) ?? null,
    alt: (row.alt as string | null) ?? "",
    caption: (row.caption as string | null) ?? "",
    description: (row.description as string | null) ?? "",
    credit: (row.credit as string | null) ?? "",
    createdAt: new Date(row.created_at as string | Date),
    updatedAt: new Date(row.updated_at as string | Date),
  };
}

export async function listProjectMediaAssets(
  databaseUrl: string,
  page = 1,
  limit = 24,
): Promise<{
  files: ProjectDbMediaAsset[];
  total: number;
  page: number;
  totalPages: number;
}> {
  await ensureProjectMediaTable(databaseUrl);

  const sql = getProjectSql(databaseUrl);
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const [rows, countRows] = await Promise.all([
    sql`
      SELECT *
      FROM media_assets
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
      OFFSET ${offset}
    ` as Promise<ProjectDbRow[]>,
    sql`
      SELECT COUNT(*)::int AS count
      FROM media_assets
    ` as Promise<ProjectDbRow[]>,
  ]);

  const total = Number(countRows[0]?.count ?? 0);

  return {
    files: rows.map(rowToMediaAsset),
    total,
    page: safePage,
    totalPages: Math.max(Math.ceil(total / safeLimit), 1),
  };
}

export async function getProjectMediaUsage(
  databaseUrl: string,
  options?: {
    uploadedById?: string | null;
    since?: Date;
  },
): Promise<{
  usedBytes: number;
  totalFiles: number;
}> {
  await ensureProjectMediaTable(databaseUrl);

  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    SELECT
      COALESCE(SUM(size), 0)::bigint AS used_bytes,
      COUNT(*)::int AS total_files
    FROM media_assets
    WHERE (
      ${options?.uploadedById ?? null}::text IS NULL
      OR uploaded_by_id = ${options?.uploadedById ?? null}
    )
    AND (
      ${options?.since ?? null}::timestamptz IS NULL
      OR created_at >= ${options?.since ?? null}
    )
  `) as ProjectDbRow[];

  return {
    usedBytes: Number(rows[0]?.used_bytes ?? 0),
    totalFiles: Number(rows[0]?.total_files ?? 0),
  };
}

export async function createProjectMediaAsset(
  databaseUrl: string,
  data: {
    id: string;
    shortId: string;
    filename: string;
    mimeType: string;
    size: number;
    path: string;
    publicUrl: string;
    uploadedById: string | null;
  },
): Promise<ProjectDbMediaAsset> {
  await ensureProjectMediaTable(databaseUrl);

  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    INSERT INTO media_assets (
      id,
      short_id,
      filename,
      mime_type,
      size,
      path,
      public_url,
      uploaded_by_id
    )
    VALUES (
      ${data.id},
      ${data.shortId},
      ${data.filename},
      ${data.mimeType},
      ${data.size},
      ${data.path},
      ${data.publicUrl},
      ${data.uploadedById}
    )
    RETURNING *
  `) as ProjectDbRow[];

  return rowToMediaAsset(rows[0]);
}

export async function getProjectMediaAsset(
  databaseUrl: string,
  id: string,
): Promise<ProjectDbMediaAsset | null> {
  await ensureProjectMediaTable(databaseUrl);

  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    SELECT *
    FROM media_assets
    WHERE id = ${id}
    LIMIT 1
  `) as ProjectDbRow[];

  return rows[0] ? rowToMediaAsset(rows[0]) : null;
}

export async function getProjectMediaAssetByPublicUrl(
  databaseUrl: string,
  publicUrl: string,
): Promise<ProjectDbMediaAsset | null> {
  await ensureProjectMediaTable(databaseUrl);

  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    SELECT *
    FROM media_assets
    WHERE public_url = ${publicUrl}
    LIMIT 1
  `) as ProjectDbRow[];

  return rows[0] ? rowToMediaAsset(rows[0]) : null;
}

export async function updateProjectMediaAssetMetadata(
  databaseUrl: string,
  id: string,
  data: {
    alt: string;
    caption: string;
    description: string;
    credit: string;
  },
): Promise<ProjectDbMediaAsset | null> {
  await ensureProjectMediaTable(databaseUrl);

  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    UPDATE media_assets
    SET alt = ${data.alt},
        caption = ${data.caption},
        description = ${data.description},
        credit = ${data.credit},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `) as ProjectDbRow[];

  return rows[0] ? rowToMediaAsset(rows[0]) : null;
}

export async function updateProjectMediaAssetFile(
  databaseUrl: string,
  id: string,
  data: {
    size: number;
    mimeType: string;
  },
): Promise<ProjectDbMediaAsset | null> {
  await ensureProjectMediaTable(databaseUrl);

  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    UPDATE media_assets
    SET size = ${data.size},
        mime_type = ${data.mimeType},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `) as ProjectDbRow[];

  return rows[0] ? rowToMediaAsset(rows[0]) : null;
}

export async function deleteProjectMediaAsset(
  databaseUrl: string,
  id: string,
): Promise<ProjectDbMediaAsset | null> {
  await ensureProjectMediaTable(databaseUrl);

  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    DELETE FROM media_assets
    WHERE id = ${id}
    RETURNING *
  `) as ProjectDbRow[];

  return rows[0] ? rowToMediaAsset(rows[0]) : null;
}

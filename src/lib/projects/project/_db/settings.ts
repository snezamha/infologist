import { getProjectSql, type ProjectDbRow } from "./core";

export type ProjectDbSettings = {
  general: unknown;
  seo: unknown;
  appearance: unknown;
};

export async function getProjectDbSettings(
  databaseUrl: string,
): Promise<ProjectDbSettings> {
  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    SELECT key, value FROM settings
    WHERE key IN ('general', 'seo', 'appearance')
  `) as ProjectDbRow[];
  const map = Object.fromEntries(
    rows.map((row) => [row.key as string, row.value]),
  );

  return {
    general: map.general ?? {},
    seo: map.seo ?? {},
    appearance: map.appearance ?? {},
  };
}

export async function setProjectDbSetting(
  databaseUrl: string,
  key: "general" | "seo" | "appearance",
  value: Record<string, unknown>,
): Promise<void> {
  const sql = getProjectSql(databaseUrl);
  const valueJson = JSON.stringify(value);

  await sql`
    INSERT INTO settings (key, value)
    VALUES (${key}, ${valueJson}::jsonb)
    ON CONFLICT (key) DO UPDATE
      SET value      = EXCLUDED.value,
          updated_at = NOW()
  `;
}

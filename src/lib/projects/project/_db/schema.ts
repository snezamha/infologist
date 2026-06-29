import { getProjectSql } from "./core";

export async function provisionProjectDatabase(
  databaseUrl: string,
): Promise<void> {
  const sql = getProjectSql(databaseUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT        PRIMARY KEY,
      email      TEXT        UNIQUE,
      name       TEXT,
      image      TEXT,
      role       TEXT        NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT  PRIMARY KEY,
      value      JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    INSERT INTO settings (key, value)
    VALUES ('general', '{}'), ('seo', '{}'), ('appearance', '{}')
    ON CONFLICT (key) DO NOTHING
  `;
}

import { getProjectSql } from "./core";

export async function ensureProjectMediaTable(
  databaseUrl: string,
): Promise<void> {
  const sql = getProjectSql(databaseUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS media_assets (
      id             TEXT        PRIMARY KEY,
      short_id       TEXT        UNIQUE NOT NULL,
      filename       TEXT        NOT NULL,
      mime_type      TEXT        NOT NULL,
      size           INTEGER     NOT NULL,
      path           TEXT        NOT NULL,
      public_url     TEXT        NOT NULL,
      uploaded_by_id TEXT,
      alt            TEXT        NOT NULL DEFAULT '',
      caption        TEXT        NOT NULL DEFAULT '',
      description    TEXT        NOT NULL DEFAULT '',
      credit         TEXT        NOT NULL DEFAULT '',
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function ensureProjectVisitorsTable(
  databaseUrl: string,
): Promise<void> {
  const sql = getProjectSql(databaseUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS visitors (
      id                TEXT        PRIMARY KEY,
      visitor_id        TEXT        NOT NULL,
      user_id           TEXT,
      path              TEXT        NOT NULL,
      url               TEXT        NOT NULL,
      referrer          TEXT,
      user_agent        TEXT,
      os                TEXT,
      browser           TEXT,
      ip_address        TEXT,
      entry_time        TIMESTAMPTZ NOT NULL,
      last_seen_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      exit_time         TIMESTAMPTZ,
      total_active_time INTEGER,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE visitors ADD COLUMN IF NOT EXISTS user_id TEXT
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS visitors_visitor_id_idx    ON visitors (visitor_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS visitors_user_id_idx       ON visitors (user_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS visitors_entry_time_idx    ON visitors (entry_time)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS visitors_last_seen_at_idx  ON visitors (last_seen_at)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS visitors_ip_path_idx       ON visitors (ip_address, path)
  `;
}

export async function ensureProjectAiAssistantTables(
  databaseUrl: string,
): Promise<void> {
  const sql = getProjectSql(databaseUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS ai_assistant_settings (
      id         TEXT        PRIMARY KEY,
      config     JSONB       NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS prompt_templates (
      id            TEXT        PRIMARY KEY,
      name          TEXT        UNIQUE NOT NULL,
      description   TEXT        NOT NULL DEFAULT '',
      system_prompt TEXT        NOT NULL DEFAULT '',
      user_prompt   TEXT        NOT NULL,
      max_tokens    INTEGER,
      type          TEXT        NOT NULL DEFAULT 'user',
      inputs        JSONB       NOT NULL DEFAULT '[]',
      outputs       JSONB       NOT NULL DEFAULT '[]',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS prompt_templates_type_idx
    ON prompt_templates (type)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS prompt_templates_updated_at_idx
    ON prompt_templates (updated_at DESC)
  `;
}

export async function ensureProjectPageBuilderTables(
  databaseUrl: string,
): Promise<void> {
  const sql = getProjectSql(databaseUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS pages (
      id            TEXT        PRIMARY KEY,
      status        TEXT        NOT NULL DEFAULT 'draft',
      is_homepage   BOOLEAN     NOT NULL DEFAULT FALSE,
      no_index      BOOLEAN     NOT NULL DEFAULT FALSE,
      author_id     TEXT,
      theme_data    JSONB,
      scheduled_at  TIMESTAMPTZ,
      published_at  TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS page_content (
      id                TEXT        PRIMARY KEY,
      page_id           TEXT        NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      locale            TEXT        NOT NULL,
      slug              TEXT        NOT NULL,
      title             TEXT        NOT NULL DEFAULT '',
      excerpt           TEXT        NOT NULL DEFAULT '',
      builder_data      JSONB       NOT NULL DEFAULT '{}',
      seo_title         TEXT        NOT NULL DEFAULT '',
      seo_description   TEXT        NOT NULL DEFAULT '',
      navigation_title  TEXT        NOT NULL DEFAULT '',
      og_image          TEXT        NOT NULL DEFAULT '',
      canonical_url     TEXT        NOT NULL DEFAULT '',
      enabled           BOOLEAN     NOT NULL DEFAULT TRUE,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(locale, slug),
      UNIQUE(page_id, locale)
    )
  `;
}

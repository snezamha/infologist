import { randomUUID } from "node:crypto";

import { getProjectSql, type ProjectDbRow } from "./core";
import { ensureProjectAiAssistantTables } from "./feature-schemas";

export type ProjectPromptTemplateRecord = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number | null;
  type: string;
  inputs: unknown[];
  outputs: unknown[];
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectPromptTemplateData = {
  name: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number | null;
  type: string;
  inputs: unknown[];
  outputs: unknown[];
};

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function rowToPromptTemplate(row: ProjectDbRow): ProjectPromptTemplateRecord {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? "",
    systemPrompt: (row.system_prompt as string | null) ?? "",
    userPrompt: row.user_prompt as string,
    maxTokens:
      row.max_tokens === null || row.max_tokens === undefined
        ? null
        : Number(row.max_tokens),
    type: (row.type as string | null) ?? "user",
    inputs: toArray(row.inputs),
    outputs: toArray(row.outputs),
    createdAt: new Date(row.created_at as string | Date),
    updatedAt: new Date(row.updated_at as string | Date),
  };
}

export async function readProjectAiAssistantConfig(
  databaseUrl: string,
): Promise<Record<string, unknown>> {
  await ensureProjectAiAssistantTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    SELECT config
    FROM ai_assistant_settings
    WHERE id = 'singleton'
    LIMIT 1
  `) as ProjectDbRow[];
  return toObject(rows[0]?.config);
}

export async function upsertProjectAiAssistantConfig(
  databaseUrl: string,
  config: Record<string, unknown>,
): Promise<void> {
  await ensureProjectAiAssistantTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  await sql`
    INSERT INTO ai_assistant_settings (id, config, updated_at)
    VALUES ('singleton', ${JSON.stringify(config)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE
    SET config = EXCLUDED.config,
        updated_at = NOW()
  `;
}

export async function listProjectPromptTemplates(
  databaseUrl: string,
): Promise<ProjectPromptTemplateRecord[]> {
  await ensureProjectAiAssistantTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    SELECT *
    FROM prompt_templates
    ORDER BY updated_at DESC
  `) as ProjectDbRow[];
  return rows.map(rowToPromptTemplate);
}

export async function getProjectPromptTemplateById(
  databaseUrl: string,
  id: string,
): Promise<ProjectPromptTemplateRecord | null> {
  await ensureProjectAiAssistantTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    SELECT *
    FROM prompt_templates
    WHERE id = ${id}
    LIMIT 1
  `) as ProjectDbRow[];
  return rows[0] ? rowToPromptTemplate(rows[0]) : null;
}

export async function getProjectPromptTemplateByName(
  databaseUrl: string,
  name: string,
): Promise<ProjectPromptTemplateRecord | null> {
  await ensureProjectAiAssistantTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    SELECT *
    FROM prompt_templates
    WHERE name = ${name}
    LIMIT 1
  `) as ProjectDbRow[];
  return rows[0] ? rowToPromptTemplate(rows[0]) : null;
}

export async function getProjectPromptTemplateByIdOrName(
  databaseUrl: string,
  idOrName: string,
): Promise<ProjectPromptTemplateRecord | null> {
  await ensureProjectAiAssistantTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    SELECT *
    FROM prompt_templates
    WHERE id = ${idOrName} OR name = ${idOrName}
    LIMIT 1
  `) as ProjectDbRow[];
  return rows[0] ? rowToPromptTemplate(rows[0]) : null;
}

export async function createProjectPromptTemplate(
  databaseUrl: string,
  data: ProjectPromptTemplateData,
): Promise<ProjectPromptTemplateRecord> {
  await ensureProjectAiAssistantTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  const id = randomUUID();
  const rows = (await sql`
    INSERT INTO prompt_templates (
      id,
      name,
      description,
      system_prompt,
      user_prompt,
      max_tokens,
      type,
      inputs,
      outputs
    )
    VALUES (
      ${id},
      ${data.name},
      ${data.description},
      ${data.systemPrompt},
      ${data.userPrompt},
      ${data.maxTokens},
      ${data.type},
      ${JSON.stringify(data.inputs)}::jsonb,
      ${JSON.stringify(data.outputs)}::jsonb
    )
    RETURNING *
  `) as ProjectDbRow[];
  return rowToPromptTemplate(rows[0]);
}

export async function createProjectPromptTemplateIfMissing(
  databaseUrl: string,
  data: ProjectPromptTemplateData,
): Promise<void> {
  await ensureProjectAiAssistantTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  await sql`
    INSERT INTO prompt_templates (
      id,
      name,
      description,
      system_prompt,
      user_prompt,
      max_tokens,
      type,
      inputs,
      outputs
    )
    VALUES (
      ${randomUUID()},
      ${data.name},
      ${data.description},
      ${data.systemPrompt},
      ${data.userPrompt},
      ${data.maxTokens},
      ${data.type},
      ${JSON.stringify(data.inputs)}::jsonb,
      ${JSON.stringify(data.outputs)}::jsonb
    )
    ON CONFLICT (name) DO NOTHING
  `;
}

export async function updateProjectPromptTemplate(
  databaseUrl: string,
  id: string,
  data: ProjectPromptTemplateData,
): Promise<ProjectPromptTemplateRecord | null> {
  await ensureProjectAiAssistantTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    UPDATE prompt_templates
    SET name = ${data.name},
        description = ${data.description},
        system_prompt = ${data.systemPrompt},
        user_prompt = ${data.userPrompt},
        max_tokens = ${data.maxTokens},
        inputs = ${JSON.stringify(data.inputs)}::jsonb,
        outputs = ${JSON.stringify(data.outputs)}::jsonb,
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `) as ProjectDbRow[];
  return rows[0] ? rowToPromptTemplate(rows[0]) : null;
}

export async function deleteProjectPromptTemplate(
  databaseUrl: string,
  id: string,
): Promise<boolean> {
  await ensureProjectAiAssistantTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    DELETE FROM prompt_templates
    WHERE id = ${id}
    RETURNING id
  `) as ProjectDbRow[];
  return rows.length > 0;
}

export async function deleteProjectModulePromptTemplates(
  databaseUrl: string,
  moduleNamePrefix: string,
): Promise<void> {
  const sql = getProjectSql(databaseUrl);
  const tables = (await sql`
    SELECT to_regclass('public.prompt_templates') AS table_name
  `) as ProjectDbRow[];
  if (!tables[0]?.table_name) return;

  await sql`
    DELETE FROM prompt_templates
    WHERE type = 'module' AND name LIKE ${`${moduleNamePrefix}%`}
  `;
}

"use server";

import { callAI } from "@/features/ai-assistant/lib/call-ai";
import { requireAiAssistantProjectSession } from "@/features/ai-assistant/lib/project-context";
import {
  createProjectPromptTemplate,
  deleteProjectPromptTemplate,
  getProjectPromptTemplateById,
  getProjectPromptTemplateByIdOrName,
  listProjectPromptTemplates,
  updateProjectPromptTemplate,
} from "@/lib/projects/project/_db/ai-assistant";

async function requirePromptTemplateProject(projectPublicId: string) {
  return requireAiAssistantProjectSession(projectPublicId);
}

export type PromptTemplateInputItem = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  order: number;
};

export type PromptTemplateOutputItem = {
  key: string;
  label: string;
  description: string;
  order: number;
};

export type PromptTemplateType = "system" | "module" | "user";

export type PromptTemplateItem = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number | null;
  type: PromptTemplateType;
  inputs: PromptTemplateInputItem[];
  outputs: PromptTemplateOutputItem[];
  createdAt: string;
  updatedAt: string;
};

export type PromptTemplateListItem = {
  id: string;
  name: string;
  description: string;
  type: PromptTemplateType;
  inputCount: number;
  outputCount: number;
  updatedAt: string;
};

export async function apiListPromptTemplates(
  projectPublicId: string,
): Promise<PromptTemplateListItem[]> {
  const { databaseUrl } = await requirePromptTemplateProject(projectPublicId);
  const rows = await listProjectPromptTemplates(databaseUrl);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    type: r.type as PromptTemplateType,
    inputCount: (r.inputs as unknown as PromptTemplateInputItem[]).length,
    outputCount: (r.outputs as unknown as PromptTemplateOutputItem[]).length,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function apiGetPromptTemplate(
  projectPublicId: string,
  id: string,
): Promise<PromptTemplateItem> {
  const { databaseUrl } = await requirePromptTemplateProject(projectPublicId);
  const row = await getProjectPromptTemplateById(databaseUrl, id);
  if (!row) throw new Error("Template not found");
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    systemPrompt: row.systemPrompt,
    userPrompt: row.userPrompt,
    maxTokens: row.maxTokens,
    type: row.type as PromptTemplateType,
    inputs: row.inputs as unknown as PromptTemplateInputItem[],
    outputs: row.outputs as unknown as PromptTemplateOutputItem[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

type TemplatePayload = {
  name: string;
  description?: string;
  systemPrompt?: string;
  userPrompt: string;
  maxTokens?: number | null;
  type?: PromptTemplateType;
  inputs?: PromptTemplateInputItem[];
  outputs?: PromptTemplateOutputItem[];
};

function sanitizeKey(key: string) {
  return key.trim().replace(/\s+/g, "_");
}

function validatePayload(data: TemplatePayload) {
  if (!data.name?.trim()) throw new Error("Name is required");
  if (!data.userPrompt?.trim()) throw new Error("User prompt is required");

  const inputs = data.inputs ?? [];
  const outputs = data.outputs ?? [];

  const inputKeys = new Set<string>();
  for (const input of inputs) {
    const key = sanitizeKey(input.key);
    if (!key) throw new Error("Input key cannot be empty");
    if (!input.label?.trim()) throw new Error("Input label cannot be empty");
    if (inputKeys.has(key)) throw new Error(`Duplicate input key: ${key}`);
    inputKeys.add(key);
  }

  const outputKeys = new Set<string>();
  for (const output of outputs) {
    const key = sanitizeKey(output.key);
    if (!key) throw new Error("Output key cannot be empty");
    if (!output.label?.trim()) throw new Error("Output label cannot be empty");
    if (outputKeys.has(key)) throw new Error(`Duplicate output key: ${key}`);
    outputKeys.add(key);
  }
}

export async function apiCreatePromptTemplate(
  projectPublicId: string,
  data: TemplatePayload,
): Promise<PromptTemplateItem> {
  const { databaseUrl, session } =
    await requirePromptTemplateProject(projectPublicId);
  const type = data.type ?? "user";

  if (session.role !== "admin" && type !== "user") {
    throw new Error("Forbidden");
  }

  validatePayload(data);

  const inputs = (data.inputs ?? []).map((i, idx) => ({
    key: sanitizeKey(i.key),
    label: i.label.trim(),
    description: i.description?.trim() ?? "",
    required: i.required ?? true,
    order: i.order ?? idx,
  }));

  const outputs = (data.outputs ?? []).map((o, idx) => ({
    key: sanitizeKey(o.key),
    label: o.label.trim(),
    description: o.description?.trim() ?? "",
    order: o.order ?? idx,
  }));

  const row = await createProjectPromptTemplate(databaseUrl, {
    name: data.name.trim(),
    description: data.description?.trim() ?? "",
    systemPrompt: data.systemPrompt?.trim() ?? "",
    userPrompt: data.userPrompt.trim(),
    maxTokens: data.maxTokens ?? null,
    type,
    inputs,
    outputs,
  });

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    systemPrompt: row.systemPrompt,
    userPrompt: row.userPrompt,
    maxTokens: row.maxTokens,
    type: row.type as PromptTemplateType,
    inputs,
    outputs,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function apiUpdatePromptTemplate(
  projectPublicId: string,
  id: string,
  data: TemplatePayload,
): Promise<PromptTemplateItem> {
  const { databaseUrl, session } =
    await requirePromptTemplateProject(projectPublicId);
  const canManageProtectedTemplates = session.role === "admin";

  const existing = await getProjectPromptTemplateById(databaseUrl, id);
  if (!existing) throw new Error("Template not found");
  if (!canManageProtectedTemplates && existing.type !== "user") {
    throw new Error("Forbidden");
  }

  validatePayload(data);

  const inputs = (data.inputs ?? []).map((i, idx) => ({
    key: sanitizeKey(i.key),
    label: i.label.trim(),
    description: i.description?.trim() ?? "",
    required: i.required ?? true,
    order: i.order ?? idx,
  }));

  const outputs = (data.outputs ?? []).map((o, idx) => ({
    key: sanitizeKey(o.key),
    label: o.label.trim(),
    description: o.description?.trim() ?? "",
    order: o.order ?? idx,
  }));

  const row = await updateProjectPromptTemplate(databaseUrl, id, {
    name: data.name.trim(),
    description: data.description?.trim() ?? "",
    systemPrompt: data.systemPrompt?.trim() ?? "",
    userPrompt: data.userPrompt.trim(),
    maxTokens: data.maxTokens ?? null,
    type: existing.type,
    inputs,
    outputs,
  });
  if (!row) throw new Error("Template not found");

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    systemPrompt: row.systemPrompt,
    userPrompt: row.userPrompt,
    maxTokens: row.maxTokens,
    type: row.type as PromptTemplateType,
    inputs,
    outputs,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function apiDeletePromptTemplate(
  projectPublicId: string,
  id: string,
): Promise<void> {
  const { databaseUrl, session } =
    await requirePromptTemplateProject(projectPublicId);
  const canManageProtectedTemplates = session.role === "admin";

  const row = await getProjectPromptTemplateById(databaseUrl, id);
  if (!row) throw new Error("Template not found");
  if (!canManageProtectedTemplates && row.type !== "user") {
    throw new Error("Forbidden");
  }

  await deleteProjectPromptTemplate(databaseUrl, id);
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (_, key) => {
    const k = key.trim();
    return Object.prototype.hasOwnProperty.call(vars, k)
      ? (vars[k] ?? "")
      : `{{${k}}}`;
  });
}

export async function apiRunPromptTemplate(
  projectPublicId: string,
  idOrName: string,
  inputs: Record<string, string>,
): Promise<{ output: string; templateName: string }> {
  const { databaseUrl } = await requirePromptTemplateProject(projectPublicId);
  const row = await getProjectPromptTemplateByIdOrName(databaseUrl, idOrName);

  if (!row) throw new Error("Template not found");

  const templateInputs = row.inputs as unknown as PromptTemplateInputItem[];

  for (const input of templateInputs) {
    if (input.required && !inputs[input.key]?.trim()) {
      throw new Error(`Required input missing: ${input.key}`);
    }
  }

  const systemPrompt = row.systemPrompt
    ? interpolate(row.systemPrompt, inputs)
    : "You are a helpful assistant.";

  const userMessage = interpolate(row.userPrompt, inputs);

  const output = await callAI({
    databaseUrl,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: row.maxTokens ?? undefined,
  });

  return { output, templateName: row.name };
}

"use server";

import {
  CLAUDE_API_VERSION,
  readDefaultProvider,
  readModuleConfigForAdmin,
  normalizeClaudeConfig,
  normalizeDeepSeekConfig,
  normalizeGrokConfig,
  normalizeOpenAIConfig,
  writeAiAssistantConfig,
} from "@/features/ai-assistant/lib/ai-provider";
import { requireAiAssistantProjectAdmin } from "@/features/ai-assistant/lib/project-context";
import { throwAiProviderError } from "@/features/ai-assistant/lib/ai-errors";

type AIProvider = "deepseek" | "claude" | "openai" | "grok";

function normalizeBaseUrl(value: unknown, fallback: string) {
  const candidate =
    typeof value === "string" && value.trim() ? value.trim() : fallback;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Base URL must be a valid URL");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Base URL must use HTTP or HTTPS");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "Base URL cannot include credentials, query parameters, or fragments",
    );
  }

  return candidate.replace(/\/+$/, "");
}

async function requireProjectAdminDatabaseUrl(projectPublicId: string) {
  const project = await requireAiAssistantProjectAdmin(projectPublicId);
  return project.databaseUrl;
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "";
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;

  const output = record.output;
  if (!Array.isArray(output)) return "";

  for (const item of output) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const itemRecord = item as Record<string, unknown>;
    const content = itemRecord.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || typeof block !== "object" || Array.isArray(block)) continue;
      const blockRecord = block as Record<string, unknown>;
      if (typeof blockRecord.text === "string") return blockRecord.text;
    }
  }

  return "";
}

async function testResponsesConnection(args: {
  baseUrl: string;
  apiKey: string;
  model: string;
}) {
  const response = await fetch(`${args.baseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      input: [
        { role: "system", content: 'Return JSON: {"ok": true}' },
        { role: "user", content: "Test." },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throwAiProviderError("OpenAI", response.status, err);
  }

  const payload = await response.json().catch(() => null);
  const text = extractResponseText(payload);
  if (!text) {
    throw new Error("Connection test failed: empty response");
  }
}

export async function apiGetAiAssistantDeepSeekSettings(
  projectPublicId: string,
) {
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const config = await readModuleConfigForAdmin(databaseUrl);
  const cfg = normalizeDeepSeekConfig(config.deepseek);
  return {
    provider: "deepseek" as const,
    hasApiKey: Boolean(cfg.apiKey),
    configured: Boolean(cfg.apiKey),
    model: cfg.model,
    baseUrl: cfg.baseUrl,
  };
}

export async function apiSaveAiAssistantDeepSeekSettings(
  input: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  },
  projectPublicId: string,
) {
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const existingConfig = await readModuleConfigForAdmin(databaseUrl);
  const cfg = normalizeDeepSeekConfig(existingConfig.deepseek);

  const nextApiKey =
    typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  const nextModel =
    typeof input.model === "string" && input.model.trim()
      ? input.model.trim()
      : cfg.model;
  const nextBaseUrl = normalizeBaseUrl(input.baseUrl, cfg.baseUrl);

  if (!nextApiKey && !cfg.apiKey) throw new Error("API key is required");

  const nextConfig = {
    ...existingConfig,
    deepseek: {
      apiKey: nextApiKey || cfg.apiKey,
      model: nextModel,
      baseUrl: nextBaseUrl,
    },
  };

  await writeAiAssistantConfig(databaseUrl, nextConfig);

  return {
    provider: "deepseek" as const,
    hasApiKey: Boolean(nextConfig.deepseek.apiKey),
    configured: Boolean(nextConfig.deepseek.apiKey),
    model: nextConfig.deepseek.model,
    baseUrl: nextConfig.deepseek.baseUrl,
  };
}

export async function apiTestAiAssistantDeepSeekConnection(
  input?: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  },
  projectPublicId?: string,
) {
  if (!projectPublicId) throw new Error("Project is required");
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const config = await readModuleConfigForAdmin(databaseUrl);
  const cfg = normalizeDeepSeekConfig(config.deepseek);
  const apiKey =
    typeof input?.apiKey === "string" && input.apiKey.trim()
      ? input.apiKey.trim()
      : cfg.apiKey;
  if (!apiKey) throw new Error("API key is required");
  const baseUrl = normalizeBaseUrl(input?.baseUrl, cfg.baseUrl);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: input?.model ?? cfg.model,
      messages: [
        { role: "system", content: 'Return JSON: {"ok": true}' },
        { role: "user", content: "Test." },
      ],
      max_tokens: 20,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throwAiProviderError("Connection test", response.status, err);
  }

  return {
    provider: "deepseek" as const,
    ok: true,
    model: input?.model ?? cfg.model,
    baseUrl,
  };
}

export async function apiGetAiAssistantClaudeSettings(projectPublicId: string) {
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const config = await readModuleConfigForAdmin(databaseUrl);
  const cfg = normalizeClaudeConfig(config.claude);
  return {
    provider: "claude" as const,
    hasApiKey: Boolean(cfg.apiKey),
    configured: Boolean(cfg.apiKey),
    model: cfg.model,
    baseUrl: cfg.baseUrl,
  };
}

export async function apiSaveAiAssistantClaudeSettings(
  input: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  },
  projectPublicId: string,
) {
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const existingConfig = await readModuleConfigForAdmin(databaseUrl);
  const cfg = normalizeClaudeConfig(existingConfig.claude);

  const nextApiKey =
    typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  const nextModel =
    typeof input.model === "string" && input.model.trim()
      ? input.model.trim()
      : cfg.model;
  const nextBaseUrl = normalizeBaseUrl(input.baseUrl, cfg.baseUrl);

  if (!nextApiKey && !cfg.apiKey) throw new Error("API key is required");

  const nextConfig = {
    ...existingConfig,
    claude: {
      apiKey: nextApiKey || cfg.apiKey,
      model: nextModel,
      baseUrl: nextBaseUrl,
    },
  };

  await writeAiAssistantConfig(databaseUrl, nextConfig);

  return {
    provider: "claude" as const,
    hasApiKey: Boolean(nextConfig.claude.apiKey),
    configured: Boolean(nextConfig.claude.apiKey),
    model: nextConfig.claude.model,
    baseUrl: nextConfig.claude.baseUrl,
  };
}

export async function apiTestAiAssistantClaudeConnection(
  input?: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  },
  projectPublicId?: string,
) {
  if (!projectPublicId) throw new Error("Project is required");
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const config = await readModuleConfigForAdmin(databaseUrl);
  const cfg = normalizeClaudeConfig(config.claude);
  const apiKey =
    typeof input?.apiKey === "string" && input.apiKey.trim()
      ? input.apiKey.trim()
      : cfg.apiKey;
  if (!apiKey) throw new Error("API key is required");
  const baseUrl = normalizeBaseUrl(input?.baseUrl, cfg.baseUrl);

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": CLAUDE_API_VERSION,
    },
    body: JSON.stringify({
      model: input?.model ?? cfg.model,
      max_tokens: 20,
      messages: [{ role: "user", content: "Test." }],
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throwAiProviderError("Connection test", response.status, err);
  }

  return {
    provider: "claude" as const,
    ok: true,
    model: input?.model ?? cfg.model,
    baseUrl,
  };
}

export async function apiGetAiAssistantOpenAISettings(projectPublicId: string) {
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const config = await readModuleConfigForAdmin(databaseUrl);
  const cfg = normalizeOpenAIConfig(config.openai);
  return {
    provider: "openai" as const,
    hasApiKey: Boolean(cfg.apiKey),
    configured: Boolean(cfg.apiKey),
    model: cfg.model,
    baseUrl: cfg.baseUrl,
  };
}

export async function apiSaveAiAssistantOpenAISettings(
  input: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  },
  projectPublicId: string,
) {
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const existingConfig = await readModuleConfigForAdmin(databaseUrl);
  const cfg = normalizeOpenAIConfig(existingConfig.openai);

  const nextApiKey =
    typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  const nextModel =
    typeof input.model === "string" && input.model.trim()
      ? input.model.trim()
      : cfg.model;
  const nextBaseUrl = normalizeBaseUrl(input.baseUrl, cfg.baseUrl);

  if (!nextApiKey && !cfg.apiKey) throw new Error("API key is required");

  const nextConfig = {
    ...existingConfig,
    openai: {
      apiKey: nextApiKey || cfg.apiKey,
      model: nextModel,
      baseUrl: nextBaseUrl,
    },
  };

  await writeAiAssistantConfig(databaseUrl, nextConfig);

  return {
    provider: "openai" as const,
    hasApiKey: Boolean(nextConfig.openai.apiKey),
    configured: Boolean(nextConfig.openai.apiKey),
    model: nextConfig.openai.model,
    baseUrl: nextConfig.openai.baseUrl,
  };
}

export async function apiTestAiAssistantOpenAIConnection(
  input?: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  },
  projectPublicId?: string,
) {
  if (!projectPublicId) throw new Error("Project is required");
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const config = await readModuleConfigForAdmin(databaseUrl);
  const cfg = normalizeOpenAIConfig(config.openai);
  const apiKey =
    typeof input?.apiKey === "string" && input.apiKey.trim()
      ? input.apiKey.trim()
      : cfg.apiKey;
  if (!apiKey) throw new Error("API key is required");
  const baseUrl = normalizeBaseUrl(input?.baseUrl, cfg.baseUrl);

  await testResponsesConnection({
    baseUrl,
    apiKey,
    model: input?.model ?? cfg.model,
  });

  return {
    provider: "openai" as const,
    ok: true,
    model: input?.model ?? cfg.model,
    baseUrl,
  };
}

export async function apiGetAiAssistantGrokSettings(projectPublicId: string) {
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const config = await readModuleConfigForAdmin(databaseUrl);
  const cfg = normalizeGrokConfig(config.grok);
  return {
    provider: "grok" as const,
    hasApiKey: Boolean(cfg.apiKey),
    configured: Boolean(cfg.apiKey),
    model: cfg.model,
    baseUrl: cfg.baseUrl,
  };
}

export async function apiSaveAiAssistantGrokSettings(
  input: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  },
  projectPublicId: string,
) {
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const existingConfig = await readModuleConfigForAdmin(databaseUrl);
  const cfg = normalizeGrokConfig(existingConfig.grok);

  const nextApiKey =
    typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  const nextModel =
    typeof input.model === "string" && input.model.trim()
      ? input.model.trim()
      : cfg.model;
  const nextBaseUrl = normalizeBaseUrl(input.baseUrl, cfg.baseUrl);

  if (!nextApiKey && !cfg.apiKey) throw new Error("API key is required");

  const nextConfig = {
    ...existingConfig,
    grok: {
      apiKey: nextApiKey || cfg.apiKey,
      model: nextModel,
      baseUrl: nextBaseUrl,
    },
  };

  await writeAiAssistantConfig(databaseUrl, nextConfig);

  return {
    provider: "grok" as const,
    hasApiKey: Boolean(nextConfig.grok.apiKey),
    configured: Boolean(nextConfig.grok.apiKey),
    model: nextConfig.grok.model,
    baseUrl: nextConfig.grok.baseUrl,
  };
}

export async function apiTestAiAssistantGrokConnection(
  input?: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  },
  projectPublicId?: string,
) {
  if (!projectPublicId) throw new Error("Project is required");
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const config = await readModuleConfigForAdmin(databaseUrl);
  const cfg = normalizeGrokConfig(config.grok);
  const apiKey =
    typeof input?.apiKey === "string" && input.apiKey.trim()
      ? input.apiKey.trim()
      : cfg.apiKey;
  if (!apiKey) throw new Error("API key is required");
  const baseUrl = normalizeBaseUrl(input?.baseUrl, cfg.baseUrl);

  const response = await fetch(`${baseUrl}/models`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throwAiProviderError("Connection test", response.status, err);
  }

  const payload = await response.json().catch(() => null);
  const models = Array.isArray((payload as { data?: unknown })?.data)
    ? ((payload as { data: Array<{ id?: unknown }> }).data ?? [])
    : [];
  const model = input?.model ?? cfg.model;
  if (models.length && !models.some((item) => item?.id === model)) {
    throw new Error(`Connection test failed: model ${model} is not available`);
  }

  return {
    provider: "grok" as const,
    ok: true,
    model,
    baseUrl,
  };
}

export async function apiGetAiAssistantDefaultProvider(
  projectPublicId: string,
): Promise<{
  provider: AIProvider;
}> {
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const provider = await readDefaultProvider(databaseUrl);
  return { provider };
}

export async function apiSetAiAssistantDefaultProvider(
  provider: AIProvider,
  projectPublicId: string,
) {
  const databaseUrl = await requireProjectAdminDatabaseUrl(projectPublicId);
  const existingConfig = await readModuleConfigForAdmin(databaseUrl);
  await writeAiAssistantConfig(databaseUrl, {
    ...existingConfig,
    defaultProvider: provider,
  });
  return { provider };
}

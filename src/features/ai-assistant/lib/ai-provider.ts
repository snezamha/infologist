import { decryptValue } from "@/lib/projects/project/_config/encrypt";
import {
  readProjectAiAssistantConfig,
  upsertProjectAiAssistantConfig,
} from "@/lib/projects/project/_db";

import {
  CLAUDE_API_VERSION,
  CLAUDE_BASE_URL,
  DEFAULT_CLAUDE_MODEL,
  DEFAULT_DEEPSEEK_MODEL,
  DEFAULT_GROK_MODEL,
  DEFAULT_OPENAI_MODEL,
  DEEPSEEK_BASE_URL,
  OPENAI_BASE_URL,
  XAI_BASE_URL,
} from "./ai-constants";

export {
  CLAUDE_API_VERSION,
  CLAUDE_BASE_URL,
  DEFAULT_CLAUDE_MODEL,
  DEFAULT_DEEPSEEK_MODEL,
  DEFAULT_GROK_MODEL,
  DEFAULT_OPENAI_MODEL,
  DEEPSEEK_BASE_URL,
  OPENAI_BASE_URL,
  XAI_BASE_URL,
};

type AIProvider = "deepseek" | "claude" | "openai" | "grok";

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function normalizeDeepSeekConfig(config: unknown) {
  const record = toRecord(config);
  return {
    apiKey: typeof record.apiKey === "string" ? record.apiKey : "",
    model:
      typeof record.model === "string" && record.model.trim()
        ? record.model.trim()
        : DEFAULT_DEEPSEEK_MODEL,
    baseUrl:
      typeof record.baseUrl === "string" && record.baseUrl.trim()
        ? record.baseUrl.trim()
        : DEEPSEEK_BASE_URL,
  };
}

export function normalizeClaudeConfig(config: unknown) {
  const record = toRecord(config);
  return {
    apiKey: typeof record.apiKey === "string" ? record.apiKey : "",
    model:
      typeof record.model === "string" && record.model.trim()
        ? record.model.trim()
        : DEFAULT_CLAUDE_MODEL,
    baseUrl:
      typeof record.baseUrl === "string" && record.baseUrl.trim()
        ? record.baseUrl.trim()
        : CLAUDE_BASE_URL,
  };
}

export function normalizeOpenAIConfig(config: unknown) {
  const record = toRecord(config);
  return {
    apiKey: typeof record.apiKey === "string" ? record.apiKey : "",
    model:
      typeof record.model === "string" && record.model.trim()
        ? record.model.trim()
        : DEFAULT_OPENAI_MODEL,
    baseUrl:
      typeof record.baseUrl === "string" && record.baseUrl.trim()
        ? record.baseUrl.trim()
        : OPENAI_BASE_URL,
  };
}

export function normalizeGrokConfig(config: unknown) {
  const record = toRecord(config);
  return {
    apiKey: typeof record.apiKey === "string" ? record.apiKey : "",
    model:
      typeof record.model === "string" && record.model.trim()
        ? record.model.trim()
        : DEFAULT_GROK_MODEL,
    baseUrl:
      typeof record.baseUrl === "string" && record.baseUrl.trim()
        ? record.baseUrl.trim()
        : XAI_BASE_URL,
  };
}

async function readStoredConfig(databaseUrl: string) {
  return toRecord(await readProjectAiAssistantConfig(databaseUrl));
}

async function decryptApiKey(encrypted: string): Promise<string> {
  if (!encrypted) return "";
  try {
    return await decryptValue(encrypted);
  } catch {
    return "";
  }
}

export async function readModuleConfigForAdmin(databaseUrl: string) {
  return readStoredConfig(databaseUrl);
}

export async function writeAiAssistantConfig(
  databaseUrl: string,
  config: Record<string, unknown>,
) {
  await upsertProjectAiAssistantConfig(databaseUrl, config);
}

export async function readDefaultProvider(
  databaseUrl: string,
): Promise<AIProvider> {
  const config = await readStoredConfig(databaseUrl);
  return config.defaultProvider === "claude" ||
    config.defaultProvider === "openai" ||
    config.defaultProvider === "grok"
    ? (config.defaultProvider as AIProvider)
    : "deepseek";
}

export async function getDeepSeekConfigForAssistant(databaseUrl: string) {
  const config = await readStoredConfig(databaseUrl);
  const raw = normalizeDeepSeekConfig(config.deepseek);
  return { ...raw, apiKey: await decryptApiKey(raw.apiKey) };
}

export async function getClaudeConfigForAssistant(databaseUrl: string) {
  const config = await readStoredConfig(databaseUrl);
  const raw = normalizeClaudeConfig(config.claude);
  return { ...raw, apiKey: await decryptApiKey(raw.apiKey) };
}

export async function getOpenAIConfigForAssistant(databaseUrl: string) {
  const config = await readStoredConfig(databaseUrl);
  const raw = normalizeOpenAIConfig(config.openai);
  return { ...raw, apiKey: await decryptApiKey(raw.apiKey) };
}

export async function getGrokConfigForAssistant(databaseUrl: string) {
  const config = await readStoredConfig(databaseUrl);
  const raw = normalizeGrokConfig(config.grok);
  return { ...raw, apiKey: await decryptApiKey(raw.apiKey) };
}

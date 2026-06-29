import {
  CLAUDE_API_VERSION,
  getClaudeConfigForAssistant,
  getDeepSeekConfigForAssistant,
  getGrokConfigForAssistant,
  getOpenAIConfigForAssistant,
  readDefaultProvider,
} from "./ai-provider";
import { throwAiEmptyResponse, throwAiProviderError } from "./ai-errors";

const AI_TIMEOUT_MS = 60_000;

function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

type Message = { role: "user" | "assistant"; content: string };

async function callDeepSeek(args: {
  databaseUrl: string;
  system: string;
  messages: Message[];
  maxTokens?: number;
}): Promise<string> {
  const cfg = await getDeepSeekConfigForAssistant(args.databaseUrl);
  if (!cfg.apiKey) throw new Error("DeepSeek API key not configured");

  const { signal, clear } = withTimeout(AI_TIMEOUT_MS);
  const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: "system", content: args.system }, ...args.messages],
      temperature: 0,
      max_tokens: args.maxTokens ?? 2048,
    }),
  }).finally(clear);

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throwAiProviderError("DeepSeek", response.status, err);
  }

  const payload = await response.json();
  const message = payload.choices?.[0]?.message;
  const content = (message?.content ?? message?.reasoning_content ?? "").trim();
  if (!content) throwAiEmptyResponse("DeepSeek");
  return content;
}

async function callClaude(args: {
  databaseUrl: string;
  system: string;
  messages: Message[];
  maxTokens?: number;
}): Promise<string> {
  const cfg = await getClaudeConfigForAssistant(args.databaseUrl);
  if (!cfg.apiKey) throw new Error("Claude API key not configured");

  const { signal, clear } = withTimeout(AI_TIMEOUT_MS);
  const response = await fetch(`${cfg.baseUrl}/v1/messages`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": CLAUDE_API_VERSION,
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: args.maxTokens ?? 2048,
      system: args.system,
      messages: args.messages,
    }),
  }).finally(clear);

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throwAiProviderError("Claude", response.status, err);
  }

  const payload = await response.json();
  const content = payload.content?.[0]?.text?.trim();
  if (!content) throwAiEmptyResponse("Claude");
  return content;
}

async function callOpenAI(args: {
  databaseUrl: string;
  system: string;
  messages: Message[];
  maxTokens?: number;
}): Promise<string> {
  const cfg = await getOpenAIConfigForAssistant(args.databaseUrl);
  if (!cfg.apiKey) throw new Error("OpenAI API key not configured");

  const { signal, clear } = withTimeout(AI_TIMEOUT_MS);
  const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: "system", content: args.system }, ...args.messages],
      max_tokens: args.maxTokens ?? 2048,
      temperature: 0,
    }),
  }).finally(clear);

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throwAiProviderError("OpenAI", response.status, err);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throwAiEmptyResponse("OpenAI");
  return content;
}

async function callGrok(args: {
  databaseUrl: string;
  system: string;
  messages: Message[];
  maxTokens?: number;
}): Promise<string> {
  const cfg = await getGrokConfigForAssistant(args.databaseUrl);
  if (!cfg.apiKey) throw new Error("Grok API key not configured");

  const { signal, clear } = withTimeout(AI_TIMEOUT_MS);
  const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: "system", content: args.system }, ...args.messages],
      max_tokens: args.maxTokens ?? 2048,
      temperature: 0,
    }),
  }).finally(clear);

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throwAiProviderError("Grok", response.status, err);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throwAiEmptyResponse("Grok");
  return content;
}

export async function callAI(args: {
  databaseUrl: string;
  system: string;
  messages: Message[];
  maxTokens?: number;
}): Promise<string> {
  const provider = await readDefaultProvider(args.databaseUrl);

  switch (provider) {
    case "claude":
      return callClaude(args);
    case "openai":
      return callOpenAI(args);
    case "grok":
      return callGrok(args);
    default:
      return callDeepSeek(args);
  }
}

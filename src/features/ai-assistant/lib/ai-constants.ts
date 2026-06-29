export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-pro";

export const CLAUDE_BASE_URL = "https://api.anthropic.com";
export const CLAUDE_API_VERSION = "2023-06-01";
export const DEFAULT_CLAUDE_MODEL = "claude-fable-5";

export const OPENAI_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_OPENAI_MODEL = "gpt-5.5-2026-04-23";

export const XAI_BASE_URL = "https://api.x.ai/v1";
export const DEFAULT_GROK_MODEL = "grok-4.3";

export const DEEPSEEK_MODELS = [
  { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
  { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
  { value: "deepseek-reasoner", label: "DeepSeek Reasoner" },
] as const;

export const CLAUDE_MODELS = [
  {
    value: "claude-fable-5",
    label: "Claude Fable 5",
  },
  {
    value: "claude-mythos-5",
    label: "Claude Mythos 5",
  },
  { value: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
] as const;

export const OPENAI_MODELS = [
  { value: "gpt-5.5-2026-04-23", label: "GPT-5.5" },
  { value: "gpt-5.4-2026-03-05", label: "GPT-5.4" },
  { value: "gpt-5.2-2025-12-11", label: "GPT-5.2" },
  { value: "gpt-5.1-2025-11-13", label: "GPT-5.1" },
  { value: "gpt-5.1-codex", label: "GPT-5.1 Codex" },
  { value: "gpt-5-codex", label: "GPT-5 Codex" },
  { value: "gpt-5-chat-latest", label: "GPT-5 Chat Latest" },
] as const;

export const GROK_MODELS = [
  { value: "grok-4.3", label: "Grok 4.3" },
  { value: "grok-build-0.1", label: "Grok Build 0.1" },
  { value: "grok-3", label: "Grok 3" },
] as const;

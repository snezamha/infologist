"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  BrainCircuit,
  Check,
  Globe2,
  KeyRound,
  Loader2,
  Save,
  Star,
  Wifi,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AlignedBadge } from "@/components/ui/aligned-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteSpinnerSection } from "@/components/loading/site-spinner";
import { toastManager } from "@/lib/toast-manager";
import { cn } from "@/lib/utils";
import {
  apiGetAiAssistantClaudeSettings,
  apiGetAiAssistantDeepSeekSettings,
  apiGetAiAssistantDefaultProvider,
  apiGetAiAssistantGrokSettings,
  apiGetAiAssistantOpenAISettings,
  apiSaveAiAssistantClaudeSettings,
  apiSaveAiAssistantDeepSeekSettings,
  apiSaveAiAssistantGrokSettings,
  apiSaveAiAssistantOpenAISettings,
  apiSetAiAssistantDefaultProvider,
  apiTestAiAssistantClaudeConnection,
  apiTestAiAssistantDeepSeekConnection,
  apiTestAiAssistantGrokConnection,
  apiTestAiAssistantOpenAIConnection,
} from "@/features/ai-assistant/actions/ai/settings";
import {
  CLAUDE_MODELS,
  CLAUDE_BASE_URL,
  DEFAULT_CLAUDE_MODEL,
  DEFAULT_DEEPSEEK_MODEL,
  DEFAULT_GROK_MODEL,
  DEFAULT_OPENAI_MODEL,
  DEEPSEEK_BASE_URL,
  DEEPSEEK_MODELS,
  GROK_MODELS,
  OPENAI_BASE_URL,
  OPENAI_MODELS,
  XAI_BASE_URL,
} from "@/features/ai-assistant/lib/ai-constants";

type ProviderKey = "deepseek" | "claude" | "openai" | "grok";

type ProviderState = {
  apiKey: string;
  model: string;
  baseUrl: string;
  hasApiKey: boolean;
  saving: boolean;
  testing: boolean;
  testResult: { ok: boolean; message: string } | null;
};

const OTHER_VALUE = "__other__";

const PROVIDER_ORDER: ProviderKey[] = ["deepseek", "claude", "openai", "grok"];

type ProviderSettingsMap = {
  deepseek: Awaited<ReturnType<typeof apiGetAiAssistantDeepSeekSettings>>;
  claude: Awaited<ReturnType<typeof apiGetAiAssistantClaudeSettings>>;
  openai: Awaited<ReturnType<typeof apiGetAiAssistantOpenAISettings>>;
  grok: Awaited<ReturnType<typeof apiGetAiAssistantGrokSettings>>;
};

const PROVIDER_CONFIG = {
  deepseek: {
    title: "deepseek.title",
    statusConfigured: "deepseek.status.configured",
    statusMissing: "deepseek.status.missing",
    apiKeyLabel: "deepseek.apiKey.label",
    apiKeyPlaceholder: "deepseek.apiKey.placeholder",
    apiKeyHelper: "deepseek.apiKey.helper",
    apiKeyHelperExisting: "deepseek.apiKey.helperExisting",
    modelLabel: "deepseek.model.label",
    modelPlaceholder: "deepseek.model.placeholder",
    modelHelper: "deepseek.model.helper",
    saveLabel: "deepseek.save",
    saved: "deepseek.saved",
    saveError: "deepseek.saveError",
    apiKeyRequired: "deepseek.apiKeyRequired",
    testLabel: "deepseek.testConnection",
    testSuccess: "deepseek.testSuccess",
    testError: "deepseek.testError",
    models: DEEPSEEK_MODELS,
  },
  claude: {
    title: "claude.title",
    statusConfigured: "claude.status.configured",
    statusMissing: "claude.status.missing",
    apiKeyLabel: "claude.apiKey.label",
    apiKeyPlaceholder: "claude.apiKey.placeholder",
    apiKeyHelper: "claude.apiKey.helper",
    apiKeyHelperExisting: "claude.apiKey.helperExisting",
    modelLabel: "claude.model.label",
    modelPlaceholder: "claude.model.placeholder",
    modelHelper: "claude.model.helper",
    saveLabel: "claude.save",
    saved: "claude.saved",
    saveError: "claude.saveError",
    apiKeyRequired: "claude.apiKeyRequired",
    testLabel: "claude.testConnection",
    testSuccess: "claude.testSuccess",
    testError: "claude.testError",
    models: CLAUDE_MODELS,
  },
  openai: {
    title: "openai.title",
    statusConfigured: "openai.status.configured",
    statusMissing: "openai.status.missing",
    apiKeyLabel: "openai.apiKey.label",
    apiKeyPlaceholder: "openai.apiKey.placeholder",
    apiKeyHelper: "openai.apiKey.helper",
    apiKeyHelperExisting: "openai.apiKey.helperExisting",
    modelLabel: "openai.model.label",
    modelPlaceholder: "openai.model.placeholder",
    modelHelper: "openai.model.helper",
    saveLabel: "openai.save",
    saved: "openai.saved",
    saveError: "openai.saveError",
    apiKeyRequired: "openai.apiKeyRequired",
    testLabel: "openai.testConnection",
    testSuccess: "openai.testSuccess",
    testError: "openai.testError",
    models: OPENAI_MODELS,
  },
  grok: {
    title: "grok.title",
    statusConfigured: "grok.status.configured",
    statusMissing: "grok.status.missing",
    apiKeyLabel: "grok.apiKey.label",
    apiKeyPlaceholder: "grok.apiKey.placeholder",
    apiKeyHelper: "grok.apiKey.helper",
    apiKeyHelperExisting: "grok.apiKey.helperExisting",
    modelLabel: "grok.model.label",
    modelPlaceholder: "grok.model.placeholder",
    modelHelper: "grok.model.helper",
    saveLabel: "grok.save",
    saved: "grok.saved",
    saveError: "grok.saveError",
    apiKeyRequired: "grok.apiKeyRequired",
    testLabel: "grok.testConnection",
    testSuccess: "grok.testSuccess",
    testError: "grok.testError",
    models: GROK_MODELS,
  },
} as const;

const providerSettingsLoaders: {
  [K in ProviderKey]: (
    projectPublicId: string,
  ) => Promise<ProviderSettingsMap[K]>;
} = {
  deepseek: apiGetAiAssistantDeepSeekSettings,
  claude: apiGetAiAssistantClaudeSettings,
  openai: apiGetAiAssistantOpenAISettings,
  grok: apiGetAiAssistantGrokSettings,
};

function loadDefaultProvider(projectPublicId: string) {
  return apiGetAiAssistantDefaultProvider(projectPublicId);
}

function loadProviderSettings<K extends ProviderKey>(
  provider: K,
  projectPublicId: string,
) {
  return providerSettingsLoaders[provider](projectPublicId);
}

function ModelSelect({
  models,
  value,
  onChange,
  placeholder,
  otherLabel,
  recommendedLabel,
  recommendedValue,
}: {
  models: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  otherLabel: string;
  recommendedLabel: string;
  recommendedValue: string;
}) {
  const known = models.some((model) => model.value === value);
  const [customSelection, setCustomSelection] = useState(false);

  const selectValue = customSelection || !known ? OTHER_VALUE : value || "";

  function handleSelectChange(nextValue: string | null) {
    if (!nextValue) return;

    if (nextValue === OTHER_VALUE) {
      setCustomSelection(true);
      return;
    }

    setCustomSelection(false);
    onChange(nextValue);
  }

  return (
    <div className="space-y-2">
      <Select value={selectValue} onValueChange={handleSelectChange}>
        <SelectTrigger className="border-border bg-background !h-11 w-full rounded-[var(--radius)] border shadow-none">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              <div className="flex w-full items-center justify-between gap-3">
                <span>{model.label}</span>
                {model.value === recommendedValue ? (
                  <AlignedBadge
                    variant="secondary"
                    className="rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.16em]"
                  >
                    {recommendedLabel}
                  </AlignedBadge>
                ) : null}
              </div>
            </SelectItem>
          ))}
          <SelectItem value={OTHER_VALUE}>{otherLabel}</SelectItem>
        </SelectContent>
      </Select>
      {customSelection ? (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="border-border bg-background h-11 rounded-[var(--radius)] border font-mono text-sm shadow-none"
          dir="ltr"
        />
      ) : null}
    </div>
  );
}

function ProviderCard({
  provider,
  title,
  apiKeyLabel,
  apiKeyPlaceholder,
  apiKeyHelper,
  apiKeyHelperExisting,
  modelLabel,
  modelPlaceholder,
  modelHelper,
  baseUrlLabel,
  baseUrlHelper,
  models,
  statusConfigured,
  statusMissing,
  saveLabel,
  testLabel,
  apiKeyRequired,
  selectedModelLabel,
  helperReady,
  isDefault,
  settingProvider,
  providerState,
  onApiKeyChange,
  onModelChange,
  onBaseUrlChange,
  onSave,
  onTest,
  onSetDefault,
  otherLabel,
  recommendedLabel,
  defaultLabel,
  currentDefaultLabel,
}: {
  provider: ProviderKey;
  title: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  apiKeyHelper: string;
  apiKeyHelperExisting: string;
  modelLabel: string;
  modelPlaceholder: string;
  modelHelper: string;
  baseUrlLabel: string;
  baseUrlHelper: string;
  models: ReadonlyArray<{ value: string; label: string }>;
  statusConfigured: string;
  statusMissing: string;
  saveLabel: string;
  testLabel: string;
  apiKeyRequired: string;
  selectedModelLabel: string;
  helperReady: string;
  isDefault: boolean;
  settingProvider: boolean;
  providerState: ProviderState;
  onApiKeyChange: (provider: ProviderKey, value: string) => void;
  onModelChange: (provider: ProviderKey, value: string) => void;
  onBaseUrlChange: (provider: ProviderKey, value: string) => void;
  onSave: (
    provider: ProviderKey,
    event: FormEvent<HTMLFormElement>,
  ) => Promise<void>;
  onTest: (provider: ProviderKey) => Promise<void>;
  onSetDefault: (provider: ProviderKey) => Promise<void>;
  otherLabel: string;
  recommendedLabel: string;
  defaultLabel: string;
  currentDefaultLabel: string;
}) {
  const apiKeyHelperText = providerState.hasApiKey
    ? apiKeyHelperExisting
    : apiKeyHelper;
  const selectedModel =
    models.find((model) => model.value === providerState.model) ?? null;
  const isRecommendedModel = selectedModel?.value === models[0]?.value;

  return (
    <Card className="border-border bg-background overflow-hidden rounded-[var(--radius)] border shadow-none">
      <CardHeader className="border-border/70 border-b p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-primary/10 text-primary inline-flex size-11 shrink-0 items-center justify-center rounded-[calc(var(--radius)-2px)]">
              <BrainCircuit className="size-5" />
            </span>
            <div className="min-w-0 text-start">
              <CardTitle className="text-lg font-black">{title}</CardTitle>
              <CardDescription className="mt-1 text-xs">
                {providerState.hasApiKey ? helperReady : apiKeyRequired}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={isDefault ? "secondary" : "outline"}
              size="sm"
              disabled={isDefault || settingProvider}
              onClick={() => onSetDefault(provider)}
              className="rounded-full"
            >
              {settingProvider ? (
                <Loader2 className="me-1.5 size-3.5 animate-spin" />
              ) : (
                <Star className="me-1.5 size-3.5" />
              )}
              {isDefault ? currentDefaultLabel : defaultLabel}
            </Button>
            <AlignedBadge
              variant={providerState.hasApiKey ? "secondary" : "outline"}
              className={cn(
                "w-fit rounded-full px-3 py-1 text-[0.68rem] font-bold tracking-[0.14em] uppercase",
                providerState.hasApiKey
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
              )}
            >
              {providerState.hasApiKey ? statusConfigured : statusMissing}
            </AlignedBadge>
          </div>
        </div>
      </CardHeader>
      <div>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <form
            className="space-y-6"
            onSubmit={(event) => onSave(provider, event)}
          >
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="text-muted-foreground size-4" />
                  <Label className="text-sm font-semibold">{apiKeyLabel}</Label>
                </div>
                <Input
                  value={providerState.apiKey}
                  onChange={(event) =>
                    onApiKeyChange(provider, event.target.value)
                  }
                  placeholder={apiKeyPlaceholder}
                  className="border-border bg-background h-11 rounded-[var(--radius)] border font-mono text-sm shadow-none"
                  dir="ltr"
                />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {apiKeyHelperText}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="text-muted-foreground size-4" />
                  <Label className="text-sm font-semibold">{modelLabel}</Label>
                </div>
                <ModelSelect
                  models={models}
                  value={providerState.model}
                  onChange={(value) => onModelChange(provider, value)}
                  placeholder={modelPlaceholder}
                  otherLabel={otherLabel}
                  recommendedLabel={recommendedLabel}
                  recommendedValue={models[0]?.value ?? ""}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {selectedModelLabel}:
                  </span>
                  <span className="text-xs font-semibold">
                    {(selectedModel?.label ?? providerState.model) ||
                      modelPlaceholder}
                  </span>
                  {isRecommendedModel ? (
                    <AlignedBadge
                      variant="secondary"
                      className="rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.12em]"
                    >
                      {recommendedLabel}
                    </AlignedBadge>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {modelHelper}
                </p>
              </div>
              <div className="space-y-3 xl:col-span-2">
                <div className="flex items-center gap-2">
                  <Globe2 className="text-muted-foreground size-4" />
                  <Label className="text-sm font-semibold">
                    {baseUrlLabel}
                  </Label>
                </div>
                <Input
                  type="url"
                  value={providerState.baseUrl}
                  onChange={(event) =>
                    onBaseUrlChange(provider, event.target.value)
                  }
                  className="border-border bg-background h-11 rounded-[var(--radius)] border font-mono text-sm shadow-none"
                  dir="ltr"
                  required
                />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {baseUrlHelper}
                </p>
              </div>
            </div>
            <div className="border-border/70 flex flex-wrap gap-3 border-t pt-5">
              <Button type="submit" disabled={providerState.saving}>
                {providerState.saving ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="me-2 h-4 w-4" />
                )}
                {saveLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onTest(provider)}
                disabled={providerState.testing}
              >
                {providerState.testing ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wifi className="me-2 h-4 w-4" />
                )}
                {testLabel}
              </Button>
            </div>
          </form>
          {providerState.testResult ? (
            <p
              className={cn(
                "text-sm",
                providerState.testResult.ok
                  ? "text-emerald-600"
                  : "text-rose-600",
              )}
            >
              {providerState.testResult.message}
            </p>
          ) : null}
        </CardContent>
      </div>
    </Card>
  );
}

type Props = {
  projectPublicId: string;
};

export default function AiAssistantModuleSettings({ projectPublicId }: Props) {
  const t = useTranslations("ai-assistant.management");
  const locale = useLocale();
  const isRtl = ["fa", "ar", "ur", "he"].includes(locale);
  const loadErrorMessage = t("loadError");
  const initialLoadedState = {
    deepseek: false,
    claude: false,
    openai: false,
    grok: false,
  };

  const [loading, setLoading] = useState(true);
  const [defaultProvider, setDefaultProvider] =
    useState<ProviderKey>("deepseek");
  const [activeProvider, setActiveProvider] = useState<ProviderKey>("deepseek");
  const [settingProvider, setSettingProvider] = useState(false);
  const [loadedProviders, setLoadedProviders] =
    useState<Record<ProviderKey, boolean>>(initialLoadedState);
  const [loadingProviders, setLoadingProviders] =
    useState<Record<ProviderKey, boolean>>(initialLoadedState);
  const [providerStates, setProviderStates] = useState<
    Record<ProviderKey, ProviderState>
  >({
    deepseek: {
      apiKey: "",
      model: DEFAULT_DEEPSEEK_MODEL,
      baseUrl: DEEPSEEK_BASE_URL,
      hasApiKey: false,
      saving: false,
      testing: false,
      testResult: null,
    },
    claude: {
      apiKey: "",
      model: DEFAULT_CLAUDE_MODEL,
      baseUrl: CLAUDE_BASE_URL,
      hasApiKey: false,
      saving: false,
      testing: false,
      testResult: null,
    },
    openai: {
      apiKey: "",
      model: DEFAULT_OPENAI_MODEL,
      baseUrl: OPENAI_BASE_URL,
      hasApiKey: false,
      saving: false,
      testing: false,
      testResult: null,
    },
    grok: {
      apiKey: "",
      model: DEFAULT_GROK_MODEL,
      baseUrl: XAI_BASE_URL,
      hasApiKey: false,
      saving: false,
      testing: false,
      testResult: null,
    },
  });

  const applyProviderSettings = (
    provider: ProviderKey,
    settings: ProviderSettingsMap[ProviderKey],
  ) => {
    setProviderStates((current) => ({
      ...current,
      [provider]: {
        ...current[provider],
        apiKey: "",
        model: settings.model,
        baseUrl: settings.baseUrl,
        hasApiKey: settings.hasApiKey,
        saving: false,
        testing: false,
        testResult: null,
      },
    }));
  };

  const markProviderLoading = (provider: ProviderKey, value: boolean) => {
    setLoadingProviders((current) => ({
      ...current,
      [provider]: value,
    }));
  };

  const markProviderLoaded = (provider: ProviderKey) => {
    setLoadedProviders((current) => ({
      ...current,
      [provider]: true,
    }));
  };

  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoading(true);
      try {
        const { provider } = await loadDefaultProvider(projectPublicId);
        const settings = await loadProviderSettings(provider, projectPublicId);

        if (!active) return;

        setDefaultProvider(provider);
        setActiveProvider(provider);
        applyProviderSettings(provider, settings);
        markProviderLoaded(provider);
      } catch {
        toastManager.add({
          description: loadErrorMessage,
          type: "error",
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [loadErrorMessage, projectPublicId]);

  useEffect(() => {
    if (loading || loadedProviders[activeProvider]) return;

    let active = true;

    async function loadActiveProvider() {
      markProviderLoading(activeProvider, true);
      try {
        const settings = await loadProviderSettings(
          activeProvider,
          projectPublicId,
        );

        if (!active) return;

        applyProviderSettings(activeProvider, settings);
        markProviderLoaded(activeProvider);
      } catch {
        if (!active) return;
        toastManager.add({
          description: loadErrorMessage,
          type: "error",
        });
      } finally {
        if (active) {
          markProviderLoading(activeProvider, false);
        }
      }
    }

    void loadActiveProvider();

    return () => {
      active = false;
    };
  }, [
    activeProvider,
    loadedProviders,
    loadErrorMessage,
    loading,
    projectPublicId,
  ]);

  const updateProviderState = (
    provider: ProviderKey,
    patch: Partial<ProviderState>,
  ) => {
    setProviderStates((current) => ({
      ...current,
      [provider]: { ...current[provider], ...patch },
    }));
  };

  const handleSetDefault = async (provider: ProviderKey) => {
    if (provider === defaultProvider) return;

    setSettingProvider(true);
    try {
      await apiSetAiAssistantDefaultProvider(provider, projectPublicId);
      setDefaultProvider(provider);
      toastManager.add({
        description: t("defaultProvider.saved"),
        type: "success",
      });
    } catch (error) {
      toastManager.add({
        description:
          error instanceof Error ? error.message : t("defaultProvider.saved"),
        type: "error",
      });
    } finally {
      setSettingProvider(false);
    }
  };

  const handleSave = async (
    provider: ProviderKey,
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    updateProviderState(provider, { saving: true });
    try {
      const current = providerStates[provider];
      const nextApiKey = current.apiKey.trim();
      if (!nextApiKey && !current.hasApiKey) {
        throw new Error(t(PROVIDER_CONFIG[provider].apiKeyRequired));
      }

      const model =
        current.model.trim() || PROVIDER_CONFIG[provider].models[0].value;
      const baseUrl = current.baseUrl.trim();

      if (provider === "deepseek") {
        const next = await apiSaveAiAssistantDeepSeekSettings(
          {
            apiKey: nextApiKey,
            model,
            baseUrl,
          },
          projectPublicId,
        );
        updateProviderState(provider, {
          hasApiKey: next.hasApiKey,
          apiKey: "",
          model: next.model,
          baseUrl: next.baseUrl,
        });
      } else if (provider === "claude") {
        const next = await apiSaveAiAssistantClaudeSettings(
          {
            apiKey: nextApiKey,
            model,
            baseUrl,
          },
          projectPublicId,
        );
        updateProviderState(provider, {
          hasApiKey: next.hasApiKey,
          apiKey: "",
          model: next.model,
          baseUrl: next.baseUrl,
        });
      } else if (provider === "openai") {
        const next = await apiSaveAiAssistantOpenAISettings(
          {
            apiKey: nextApiKey,
            model,
            baseUrl,
          },
          projectPublicId,
        );
        updateProviderState(provider, {
          hasApiKey: next.hasApiKey,
          apiKey: "",
          model: next.model,
          baseUrl: next.baseUrl,
        });
      } else {
        const next = await apiSaveAiAssistantGrokSettings(
          {
            apiKey: nextApiKey,
            model,
            baseUrl,
          },
          projectPublicId,
        );
        updateProviderState(provider, {
          hasApiKey: next.hasApiKey,
          apiKey: "",
          model: next.model,
          baseUrl: next.baseUrl,
        });
      }

      markProviderLoaded(provider);

      toastManager.add({
        description: t(PROVIDER_CONFIG[provider].saved),
        type: "success",
      });
    } catch (error) {
      toastManager.add({
        description:
          error instanceof Error
            ? error.message
            : t(PROVIDER_CONFIG[provider].saveError),
        type: "error",
      });
    } finally {
      updateProviderState(provider, { saving: false });
    }
  };

  const handleTest = async (provider: ProviderKey) => {
    updateProviderState(provider, { testing: true, testResult: null });
    try {
      const current = providerStates[provider];
      const testInput = {
        apiKey: current.apiKey.trim() || undefined,
        model: current.model.trim() || undefined,
        baseUrl: current.baseUrl.trim() || undefined,
      };

      const result =
        provider === "deepseek"
          ? await apiTestAiAssistantDeepSeekConnection(
              testInput,
              projectPublicId,
            )
          : provider === "claude"
            ? await apiTestAiAssistantClaudeConnection(
                testInput,
                projectPublicId,
              )
            : provider === "openai"
              ? await apiTestAiAssistantOpenAIConnection(
                  testInput,
                  projectPublicId,
                )
              : await apiTestAiAssistantGrokConnection(
                  testInput,
                  projectPublicId,
                );

      updateProviderState(provider, {
        testResult: {
          ok: true,
          message: `${t(PROVIDER_CONFIG[provider].testSuccess)} · ${result.model}`,
        },
      });
      toastManager.add({
        description: t(PROVIDER_CONFIG[provider].testSuccess),
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t(PROVIDER_CONFIG[provider].testError);
      updateProviderState(provider, {
        testResult: { ok: false, message },
      });
      toastManager.add({ description: message, type: "error" });
    } finally {
      updateProviderState(provider, { testing: false });
    }
  };

  if (loading) {
    return (
      <div dir={isRtl ? "rtl" : "ltr"}>
        <SiteSpinnerSection className="h-44" />
      </div>
    );
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="text-start">
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="border-border bg-background h-fit overflow-hidden rounded-[var(--radius)] border shadow-none">
          <CardHeader className="border-border/70 border-b p-4">
            <CardTitle className="text-sm font-black">
              {t("activeProvider.label")}
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              {t("activeProvider.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 p-2 sm:grid-cols-2 lg:grid-cols-1">
            {PROVIDER_ORDER.map((provider) => {
              const isActive = activeProvider === provider;
              const isDefault = defaultProvider === provider;
              const state = providerStates[provider];
              const isProviderLoaded = loadedProviders[provider];
              const isProviderLoading = loadingProviders[provider];

              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setActiveProvider(provider)}
                  className={cn(
                    "group flex min-w-0 items-center gap-3 rounded-[calc(var(--radius)-2px)] border px-3 py-3 text-start transition-colors",
                    isActive
                      ? "border-primary/30 bg-primary/8 text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
                      state.hasApiKey
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isProviderLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : state.hasApiKey ? (
                      <Check className="size-4" />
                    ) : (
                      <KeyRound className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {t(`defaultProvider.${provider}`)}
                    </span>
                    <span className="mt-0.5 block truncate text-[0.68rem]">
                      {!isProviderLoaded
                        ? "..."
                        : state.hasApiKey
                          ? t(PROVIDER_CONFIG[provider].statusConfigured)
                          : t(PROVIDER_CONFIG[provider].statusMissing)}
                    </span>
                  </span>
                  {isDefault ? (
                    <Star className="text-primary size-3.5 shrink-0 fill-current" />
                  ) : null}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {loadedProviders[activeProvider] ? (
          <ProviderCard
            provider={activeProvider}
            title={t(PROVIDER_CONFIG[activeProvider].title)}
            apiKeyLabel={t(PROVIDER_CONFIG[activeProvider].apiKeyLabel)}
            apiKeyPlaceholder={t(
              PROVIDER_CONFIG[activeProvider].apiKeyPlaceholder,
            )}
            apiKeyHelper={t(PROVIDER_CONFIG[activeProvider].apiKeyHelper)}
            apiKeyHelperExisting={t(
              PROVIDER_CONFIG[activeProvider].apiKeyHelperExisting,
            )}
            modelLabel={t(PROVIDER_CONFIG[activeProvider].modelLabel)}
            modelPlaceholder={t(
              PROVIDER_CONFIG[activeProvider].modelPlaceholder,
            )}
            modelHelper={t(PROVIDER_CONFIG[activeProvider].modelHelper)}
            baseUrlLabel={t("baseUrl.label")}
            baseUrlHelper={t("baseUrl.helper")}
            models={PROVIDER_CONFIG[activeProvider].models}
            statusConfigured={t(
              PROVIDER_CONFIG[activeProvider].statusConfigured,
            )}
            statusMissing={t(PROVIDER_CONFIG[activeProvider].statusMissing)}
            saveLabel={t(PROVIDER_CONFIG[activeProvider].saveLabel)}
            testLabel={t(PROVIDER_CONFIG[activeProvider].testLabel)}
            apiKeyRequired={t(PROVIDER_CONFIG[activeProvider].apiKeyRequired)}
            selectedModelLabel={t("selectedModel")}
            helperReady={t("helperReady")}
            isDefault={defaultProvider === activeProvider}
            settingProvider={settingProvider}
            providerState={providerStates[activeProvider]}
            onApiKeyChange={(nextProvider, value) =>
              updateProviderState(nextProvider, { apiKey: value })
            }
            onModelChange={(nextProvider, value) =>
              updateProviderState(nextProvider, { model: value })
            }
            onBaseUrlChange={(nextProvider, value) =>
              updateProviderState(nextProvider, { baseUrl: value })
            }
            onSave={handleSave}
            onTest={handleTest}
            onSetDefault={handleSetDefault}
            otherLabel={t("other")}
            recommendedLabel={t("recommended")}
            defaultLabel={t("defaultProvider.label")}
            currentDefaultLabel={t("currentDefault")}
          />
        ) : (
          <Card className="border-border bg-background rounded-[var(--radius)] border shadow-none">
            <CardContent className="p-6">
              <SiteSpinnerSection className="h-44" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

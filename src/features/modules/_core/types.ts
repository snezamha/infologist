import type { Metadata } from "next";
import type { ReactNode } from "react";

export type ProjectModuleKey = string;

export type LocalizedModuleText = {
  en: string;
  fa: string;
  de: string;
};

export type PackageDependency = {
  name: string;
  version: string;
  isDev?: boolean;
};

export type ProjectModuleManifest = {
  key: ProjectModuleKey;
  type: "module";
  version: string;
  title: LocalizedModuleText;
  description: LocalizedModuleText;
  widget: boolean;
  dbTables: string[];
  dependencies: string[];
  packageDependencies?: PackageDependency[];
  isPrivate?: boolean;
};

export type ProjectModuleSummary = ProjectModuleManifest & {
  active: boolean;
  installedVersion: string | null;
};

type ProjectModuleRouteContext = {
  locale: string;
  projectPublicId: string;
  basePath: string;
  segments: readonly string[];
  searchParams: Record<string, string | string[] | undefined>;
};

type ProjectModuleRouteDefinition = {
  matches: (segments: readonly string[]) => boolean;
  render: (context: ProjectModuleRouteContext) => ReactNode;
  metadata?: (context: ProjectModuleRouteContext) => Promise<Metadata>;
};

export type TemplateInputVar = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  order: number;
};

export type TemplateOutputField = {
  key: string;
  label: string;
  description: string;
  order: number;
};

export type ModuleAiTemplate = {
  name: string;
  description?: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  inputs?: TemplateInputVar[];
  outputs?: TemplateOutputField[];
};

export type ProjectModuleServerDefinition = {
  manifest: ProjectModuleManifest;
  aiTemplates?: readonly ModuleAiTemplate[];
  database?: {
    migrate: (
      databaseUrl: string,
      installedVersion: string | null,
    ) => Promise<void>;
    cleanup: (databaseUrl: string) => Promise<void>;
  };
  routes?: readonly ProjectModuleRouteDefinition[];
};

export type ProjectModuleServerConfig = Omit<
  ProjectModuleServerDefinition,
  "manifest"
>;

export type ProjectModulePrivateSource = {
  manifests?: readonly ProjectModuleManifest[];
  frontends?: Record<string, unknown>;
  serverDefinitions?: readonly ProjectModuleServerDefinition[];
};

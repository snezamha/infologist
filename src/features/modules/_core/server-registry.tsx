import "server-only";

import privateProjectModules from "@infologist/private-modules";
import { listProjectModules } from "./registry";
import { generatedProjectModuleServers } from "./generated/module-servers";
import type {
  ProjectModulePrivateSource,
  ProjectModuleServerConfig,
  ProjectModuleServerDefinition,
} from "./types";

const privateSource = privateProjectModules as ProjectModulePrivateSource;

const manifests = new Map(
  listProjectModules().map((manifest) => [manifest.key, manifest]),
);

for (const manifest of privateSource.manifests ?? []) {
  manifests.set(manifest.key, { ...manifest, isPrivate: true });
}

const projectModuleServerDefinitionMap = new Map<
  string,
  ProjectModuleServerDefinition
>();
const projectModuleServerDefinitionLoaders = new Map<
  string,
  () => ProjectModuleServerDefinition
>();

function parseServerConfig(value: unknown): ProjectModuleServerConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid module server configuration");
  }

  const config = value as ProjectModuleServerConfig;
  if (
    config.database &&
    (typeof config.database.migrate !== "function" ||
      typeof config.database.cleanup !== "function")
  ) {
    throw new Error("Invalid module database configuration");
  }
  if (
    config.routes &&
    (!Array.isArray(config.routes) ||
      config.routes.some(
        (route) =>
          typeof route.matches !== "function" ||
          typeof route.render !== "function" ||
          (route.metadata !== undefined &&
            typeof route.metadata !== "function"),
      ))
  ) {
    throw new Error("Invalid module route configuration");
  }
  if (
    config.aiTemplates &&
    (!Array.isArray(config.aiTemplates) ||
      config.aiTemplates.some(
        (template) =>
          typeof template.name !== "string" ||
          typeof template.systemPrompt !== "string" ||
          typeof template.userPrompt !== "string",
      ))
  ) {
    throw new Error("Invalid module AI template configuration");
  }

  return config;
}

for (const [moduleKey, serverConfig] of Object.entries(
  generatedProjectModuleServers,
)) {
  const manifest = manifests.get(moduleKey);
  if (!manifest) continue;

  projectModuleServerDefinitionLoaders.set(moduleKey, () => {
    const parsedServerConfig = parseServerConfig(serverConfig);
    return {
      manifest,
      ...parsedServerConfig,
    };
  });
}

for (const definition of privateSource.serverDefinitions ?? []) {
  const manifest =
    manifests.get(definition.manifest.key) ?? definition.manifest;
  projectModuleServerDefinitionMap.set(manifest.key, {
    ...definition,
    manifest,
  });
}

for (const manifest of manifests.values()) {
  if (
    !projectModuleServerDefinitionMap.has(manifest.key) &&
    !projectModuleServerDefinitionLoaders.has(manifest.key)
  ) {
    throw new Error(`Missing server configuration for module ${manifest.key}`);
  }
}

export function getProjectModuleServerDefinition(
  key: string,
): ProjectModuleServerDefinition | null {
  const cached = projectModuleServerDefinitionMap.get(key);
  if (cached) return cached;

  const loader = projectModuleServerDefinitionLoaders.get(key);
  if (!loader) return null;

  const definition = loader();
  projectModuleServerDefinitionMap.set(key, definition);
  return definition;
}

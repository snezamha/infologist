#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const PATHS_CONFIG_PATH = join(ROOT, "tsconfig.paths.json");
const PUBLIC_MODULES_DIR = join(ROOT, "src", "features", "modules");
const PRIVATE_MODULES_DIR = join(ROOT, ".private-modules");
const GENERATED_DIR = join(PUBLIC_MODULES_DIR, "_core", "generated");
const MODULE_KEY_PATTERN = /^[a-z][a-z0-9-]*$/;
const LOCALES = ["en", "fa", "de"];

const BASE_PATHS = {
  "@/*": ["./src/*"],
};

function toImportPath(fromDir, targetPath) {
  const normalized = relative(fromDir, targetPath).split(sep).join("/");
  return normalized.startsWith(".") ? normalized : `./${normalized}`;
}

function toModuleImportPath(fromDir, targetPath) {
  const path = toImportPath(fromDir, targetPath);
  const extension = extname(path);
  return extension === ".tsx" || extension === ".ts"
    ? path.slice(0, -extension.length)
    : path;
}

function listModuleEntries(root, isPrivate) {
  if (!existsSync(root)) return [];

  return readdirSync(root, { withFileTypes: true })
    .filter(
      (entry) => entry.isDirectory() && MODULE_KEY_PATTERN.test(entry.name),
    )
    .map((entry) => {
      const moduleRoot = join(root, entry.name);
      return {
        key: entry.name,
        isPrivate,
        manifest: join(moduleRoot, "module.json"),
        frontend: join(moduleRoot, "frontend.tsx"),
        server: join(moduleRoot, "_server.tsx"),
        widget: join(moduleRoot, "widget.tsx"),
        messages: Object.fromEntries(
          LOCALES.map((locale) => [
            locale,
            join(moduleRoot, "messages", `${locale}.json`),
          ]),
        ),
      };
    })
    .filter((entry) => existsSync(entry.manifest))
    .sort((left, right) => left.key.localeCompare(right.key));
}

function writeGeneratedFile(filename, content) {
  mkdirSync(GENERATED_DIR, { recursive: true });
  writeFileSync(join(GENERATED_DIR, filename), `${content.trim()}\n`);
}

function generateManifestRegistry(entries) {
  const imports = entries.map((entry, index) => {
    const path = toImportPath(GENERATED_DIR, entry.manifest);
    return `import manifest${index} from "${path}";`;
  });
  const records = entries.map(
    (entry, index) =>
      `  { key: ${JSON.stringify(entry.key)}, isPrivate: ${entry.isPrivate}, manifest: manifest${index} },`,
  );

  return `
${imports.join("\n")}

export const generatedProjectModuleManifests = [
${records.join("\n")}
] as const;
`;
}

function generateFrontendRegistry(entries) {
  const available = entries.filter((entry) => existsSync(entry.frontend));
  const imports = available.map((entry, index) => {
    const path = toModuleImportPath(GENERATED_DIR, entry.frontend);
    return `import frontend${index} from "${path}";`;
  });
  const records = available.map(
    (entry, index) => `  ${JSON.stringify(entry.key)}: frontend${index},`,
  );

  return `
${imports.join("\n")}

export const generatedProjectModuleFrontends = {
${records.join("\n")}
};
`;
}

function generateServerRegistry(entries) {
  const available = entries.filter((entry) => existsSync(entry.server));
  const imports = available.map((entry, index) => {
    const path = toModuleImportPath(GENERATED_DIR, entry.server);
    return `import server${index} from "${path}";`;
  });
  const records = available.map(
    (entry, index) => `  ${JSON.stringify(entry.key)}: server${index},`,
  );

  return `
${imports.join("\n")}

export const generatedProjectModuleServers = {
${records.join("\n")}
};
`;
}

function generateWidgetRegistry(entries) {
  const available = entries.filter((entry) => existsSync(entry.widget));
  const records = available.map((entry) => {
    const path = toModuleImportPath(GENERATED_DIR, entry.widget);
    return `  ${JSON.stringify(`module:${entry.key}`)}: () => import("${path}"),`;
  });

  return `
export const generatedProjectModuleWidgetLoaders = {
${records.join("\n")}
};
`;
}

function generateMessageRegistry(entries) {
  const records = entries.flatMap((entry) =>
    LOCALES.filter((locale) => existsSync(entry.messages[locale])).map(
      (locale) => {
        const path = toImportPath(GENERATED_DIR, entry.messages[locale]);
        return `  ${JSON.stringify(`${entry.key}:${locale}`)}: async () => import("${path}").then((module) => module.default as Record<string, unknown>),`;
      },
    ),
  );

  return `
import type { Locale } from "@/i18n/config";

type GeneratedMessageLoader = (locale: Locale) => Promise<Record<string, unknown>>;

const generatedProjectModuleMessageLoaders = {
${records.join("\n")}
} satisfies Record<string, GeneratedMessageLoader>;

export function getGeneratedProjectModuleMessageLoaders(locale: Locale) {
  return Object.fromEntries(
    Object.entries(generatedProjectModuleMessageLoaders)
      .filter(([key]) => key.endsWith(\`:\${locale}\`))
      .map(([key, loader]) => [key.slice(0, -locale.length - 1), loader]),
  ) as Record<string, GeneratedMessageLoader>;
}
`;
}

function syncGeneratedModuleRegistries() {
  const entries = [
    ...listModuleEntries(PUBLIC_MODULES_DIR, false),
    ...listModuleEntries(PRIVATE_MODULES_DIR, true),
  ];

  writeGeneratedFile("module-manifests.ts", generateManifestRegistry(entries));
  writeGeneratedFile("module-frontends.ts", generateFrontendRegistry(entries));
  writeGeneratedFile("module-servers.ts", generateServerRegistry(entries));
  writeGeneratedFile("module-widgets.ts", generateWidgetRegistry(entries));
  writeGeneratedFile("module-messages.ts", generateMessageRegistry(entries));
}

export function syncModulePaths() {
  const config = {
    compilerOptions: {
      paths: BASE_PATHS,
    },
  };

  writeFileSync(PATHS_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
  syncGeneratedModuleRegistries();

  console.log("Generated tsconfig.paths.json and module registries");
}

const isMain = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isMain) {
  syncModulePaths();
}

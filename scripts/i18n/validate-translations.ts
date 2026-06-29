#!/usr/bin/env node

import fs from "fs";
import path from "path";

interface TranslationUsage {
  namespace: string;
  key: string;
  file: string;
  line: number;
}

interface ValidationResult {
  missingInFiles: Map<string, Set<string>>;
  unusedKeys: Map<string, Set<string>>;
  errors: string[];
}

interface TranslatorBinding {
  index: number;
  namespace: string;
  prefix: string;
}

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, "src");
const LANGUAGES = ["en", "fa", "de"] as const;

function flattenKeys(
  value: unknown,
  prefix = "",
  result = new Set<string>(),
): Set<string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return result;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flattenKeys(child, nextKey, result);
    } else {
      result.add(nextKey);
    }
  }

  return result;
}

function findTsFiles(dir: string, files: string[] = []): string[] {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      if (![".next", "node_modules", "dist", ".git"].includes(item.name)) {
        findTsFiles(path.join(dir, item.name), files);
      }
      continue;
    }

    if (
      (item.name.endsWith(".ts") || item.name.endsWith(".tsx")) &&
      !item.name.endsWith(".test.ts") &&
      !item.name.endsWith(".test.tsx") &&
      !item.name.endsWith(".spec.ts") &&
      !item.name.endsWith(".spec.tsx")
    ) {
      files.push(path.join(dir, item.name));
    }
  }

  return files;
}

function loadJson(filePath: string): Record<string, unknown> | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
  }

  return null;
}

function addTranslation(
  translations: Map<string, Map<string, Record<string, unknown>>>,
  lang: string,
  namespace: string,
  value: Record<string, unknown> | null,
): void {
  if (!value) {
    return;
  }

  if (!translations.has(lang)) {
    translations.set(lang, new Map());
  }

  translations.get(lang)!.set(namespace, value);
}

function loadTranslations(): Map<string, Map<string, Record<string, unknown>>> {
  const translations = new Map<string, Map<string, Record<string, unknown>>>();

  for (const lang of LANGUAGES) {
    const langDir = path.join(SRC_DIR, "messages", lang);

    if (fs.existsSync(langDir)) {
      for (const file of fs.readdirSync(langDir)) {
        if (!file.endsWith(".json")) {
          continue;
        }

        addTranslation(
          translations,
          lang,
          path.parse(file).name,
          loadJson(path.join(langDir, file)),
        );
      }
    }

    addTranslation(
      translations,
      lang,
      "media",
      loadJson(
        path.join(SRC_DIR, "features", "media", "messages", lang, "media.json"),
      ),
    );
    addTranslation(
      translations,
      lang,
      "pageBuilder",
      loadJson(
        path.join(
          SRC_DIR,
          "features",
          "page-builder",
          "messages",
          `${lang}.json`,
        ),
      ),
    );
    addTranslation(
      translations,
      lang,
      "ai-assistant",
      loadJson(
        path.join(
          SRC_DIR,
          "features",
          "ai-assistant",
          "messages",
          `${lang}.json`,
        ),
      ),
    );
  }

  const moduleRoot = path.join(SRC_DIR, "features", "modules");
  if (fs.existsSync(moduleRoot)) {
    for (const entry of fs.readdirSync(moduleRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith("_")) {
        continue;
      }

      for (const lang of LANGUAGES) {
        addTranslation(
          translations,
          lang,
          entry.name,
          loadJson(
            path.join(moduleRoot, entry.name, "messages", `${lang}.json`),
          ),
        );
      }
    }
  }

  return translations;
}

function resolveNamespace(rawNamespace: string): {
  namespace: string;
  prefix: string;
} {
  const dotIndex = rawNamespace.indexOf(".");

  if (dotIndex === -1) {
    return { namespace: rawNamespace, prefix: "" };
  }

  return {
    namespace: rawNamespace.slice(0, dotIndex),
    prefix: rawNamespace.slice(dotIndex + 1),
  };
}

function lineNumberAt(content: string, index: number): number {
  let line = 1;

  for (let cursor = 0; cursor < index; cursor++) {
    if (content.charCodeAt(cursor) === 10) {
      line++;
    }
  }

  return line;
}

function findTranslatorBindings(
  content: string,
): Map<string, TranslatorBinding[]> {
  const bindings = new Map<string, TranslatorBinding[]>();
  const pattern =
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*(?:\{[\s\S]*?\bnamespace\s*:\s*["'`]([^"'`]+)["'`][\s\S]*?\}|["'`]([^"'`]+)["'`])\s*\)/g;

  for (const match of content.matchAll(pattern)) {
    const name = match[1];
    const rawNamespace = match[2] ?? match[3];

    if (!rawNamespace) {
      continue;
    }

    const resolved = resolveNamespace(rawNamespace);
    const binding = {
      index: match.index ?? 0,
      namespace: resolved.namespace,
      prefix: resolved.prefix,
    };

    if (!bindings.has(name)) {
      bindings.set(name, []);
    }

    bindings.get(name)!.push(binding);
  }

  return bindings;
}

function getBindingForCall(
  bindings: Map<string, TranslatorBinding[]>,
  name: string,
  index: number,
): TranslatorBinding | null {
  const candidates = bindings.get(name);
  if (!candidates || candidates.length === 0) {
    return null;
  }

  let selected: TranslatorBinding | null = null;
  for (const candidate of candidates) {
    if (candidate.index > index) {
      break;
    }
    selected = candidate;
  }

  return selected;
}

function scanForTranslationKeys(): Map<string, Set<TranslationUsage>> {
  const keysByNamespace = new Map<string, Set<TranslationUsage>>();
  const files = findTsFiles(SRC_DIR);
  const callPattern = /\b([A-Za-z_$][\w$]*)\s*\(\s*["'`]([^"'`]+)["'`]/g;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const bindings = findTranslatorBindings(content);

    for (const match of content.matchAll(callPattern)) {
      const name = match[1];
      const rawKey = match[2];

      if (!rawKey || rawKey.includes("${")) {
        continue;
      }

      const binding = getBindingForCall(bindings, name, match.index ?? 0);
      if (!binding) {
        continue;
      }

      const key = binding.prefix ? `${binding.prefix}.${rawKey}` : rawKey;
      if (!keysByNamespace.has(binding.namespace)) {
        keysByNamespace.set(binding.namespace, new Set());
      }

      keysByNamespace.get(binding.namespace)!.add({
        namespace: binding.namespace,
        key,
        file: path.relative(ROOT_DIR, file),
        line: lineNumberAt(content, match.index ?? 0),
      });
    }
  }

  return keysByNamespace;
}

function validate(
  usedKeys: Map<string, Set<TranslationUsage>>,
  translations: Map<string, Map<string, Record<string, unknown>>>,
): ValidationResult {
  const result: ValidationResult = {
    missingInFiles: new Map(),
    unusedKeys: new Map(),
    errors: [],
  };

  for (const [namespace, usages] of usedKeys) {
    const englishTranslations = translations.get("en")?.get(namespace);
    if (!englishTranslations) {
      result.errors.push(
        `Namespace "${namespace}" not found in English translations`,
      );
      continue;
    }

    const englishKeys = flattenKeys(englishTranslations);

    for (const usage of usages) {
      if (!englishKeys.has(usage.key)) {
        if (!result.missingInFiles.has(namespace)) {
          result.missingInFiles.set(namespace, new Set());
        }
        result.missingInFiles.get(namespace)!.add(usage.key);
      }

      for (const lang of LANGUAGES) {
        const langTranslations = translations.get(lang)?.get(namespace);
        if (!langTranslations) {
          result.errors.push(
            `Namespace "${namespace}" not found in ${lang} translations`,
          );
          continue;
        }

        const langKeys = flattenKeys(langTranslations);
        if (!langKeys.has(usage.key)) {
          const location = `${namespace}/${lang}`;
          if (!result.missingInFiles.has(location)) {
            result.missingInFiles.set(location, new Set());
          }
          result.missingInFiles.get(location)!.add(usage.key);
        }
      }
    }
  }

  for (const [lang, namespaces] of translations) {
    for (const [namespace, translationObj] of namespaces) {
      if (lang !== "en") {
        continue;
      }

      const translationKeys = flattenKeys(translationObj);
      for (const key of translationKeys) {
        const isUsed = Array.from(usedKeys.get(namespace) ?? []).some(
          (usage) => usage.key === key,
        );

        if (!isUsed) {
          if (!result.unusedKeys.has(namespace)) {
            result.unusedKeys.set(namespace, new Set());
          }
          result.unusedKeys.get(namespace)!.add(key);
        }
      }
    }
  }

  return result;
}

function printResults(
  result: ValidationResult,
  usedKeys: Map<string, Set<TranslationUsage>>,
): void {
  console.log("\n" + "═".repeat(80));
  console.log("📋 Translation Validation Report");
  console.log("═".repeat(80) + "\n");

  if (result.errors.length > 0) {
    console.log("❌ Errors:");
    for (const error of result.errors) {
      console.log(`   ${error}`);
    }
    console.log("");
  }

  if (result.missingInFiles.size > 0) {
    console.log("❌ Missing Translation Keys:");
    let totalMissing = 0;

    for (const [location, keys] of result.missingInFiles) {
      console.log(`\n   ${location}:`);
      for (const key of keys) {
        console.log(`      - ${key}`);
        totalMissing++;

        const namespace = location.split("/")[0];
        const usages = Array.from(usedKeys.get(namespace) ?? []).filter(
          (usage) => usage.key === key,
        );

        for (const usage of usages) {
          console.log(`        → Used in ${usage.file}:${usage.line}`);
        }
      }
    }

    console.log(`\n   Total missing: ${totalMissing} keys\n`);
  }

  if (result.unusedKeys.size > 0) {
    console.log("⚠️  Unused Translation Keys (might be safe to remove):");
    let totalUnused = 0;

    for (const [namespace, keys] of result.unusedKeys) {
      console.log(`\n   ${namespace}:`);
      for (const key of keys) {
        console.log(`      - ${key}`);
        totalUnused++;
      }
    }

    console.log(`\n   Total unused: ${totalUnused} keys\n`);
  }

  console.log("═".repeat(80));
  console.log("📊 Summary:");
  console.log(`   Namespaces scanned: ${usedKeys.size}`);
  console.log(
    `   Total keys used: ${Array.from(usedKeys.values()).reduce((sum, set) => sum + set.size, 0)}`,
  );
  console.log(
    `   Missing translations: ${Array.from(result.missingInFiles.values()).reduce((sum, set) => sum + set.size, 0)}`,
  );
  console.log(
    `   Unused translations: ${Array.from(result.unusedKeys.values()).reduce((sum, set) => sum + set.size, 0)}`,
  );
  console.log("═".repeat(80) + "\n");

  if (result.missingInFiles.size > 0) {
    process.exit(1);
  }
}

console.log("🔍 Scanning for translation keys...");
const translations = loadTranslations();
const usedKeys = scanForTranslationKeys();
const result = validate(usedKeys, translations);
printResults(result, usedKeys);
console.log("✅ Validation complete!");

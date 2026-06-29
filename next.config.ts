import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const require = createRequire(import.meta.url);
const privateModulesPackage = process.env.INFOLOGIST_PRIVATE_MODULES_PACKAGE;
const localPrivateModulesPath =
  "./src/features/modules/_core/private-modules.ts";
const localPrivateModulesSourcePath = "./.private-modules/index.tsx";
const isPrivateModulesPath =
  privateModulesPackage?.startsWith(".") ||
  privateModulesPackage?.startsWith("/");
const configuredPrivateModulesPath =
  privateModulesPackage ??
  (existsSync(path.resolve(localPrivateModulesSourcePath))
    ? localPrivateModulesSourcePath
    : localPrivateModulesPath);
const turbopackPrivateModulesAlias = configuredPrivateModulesPath;
const webpackPrivateModulesAlias =
  isPrivateModulesPath || configuredPrivateModulesPath.startsWith(".")
    ? path.resolve(configuredPrivateModulesPath)
    : configuredPrivateModulesPath;

const privateModulesDir = path.resolve("./.private-modules");
const privateModuleAliases = existsSync(privateModulesDir)
  ? Object.fromEntries(
      readdirSync(privateModulesDir, { withFileTypes: true })
        .filter((entry) => {
          if (!entry.isDirectory()) return false;
          const moduleJsonPath = path.join(
            privateModulesDir,
            entry.name,
            "module.json",
          );
          return existsSync(moduleJsonPath);
        })
        .map((entry) => [
          `@/features/modules/${entry.name}`,
          path.join(privateModulesDir, entry.name),
        ]),
    )
  : {};

function packageExists(packageName: string) {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    try {
      require.resolve(`${packageName}/package.json`);
      return true;
    } catch {
      return false;
    }
  }
}

function loadModuleStubAliases(modulesRoot: string): Record<string, string> {
  if (!existsSync(modulesRoot)) return {};

  const result: Record<string, string> = {};

  for (const entry of readdirSync(modulesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const stubsIndexPath = path.join(
      modulesRoot,
      entry.name,
      "stubs",
      "index.json",
    );
    if (!existsSync(stubsIndexPath)) continue;

    let stubMap: Record<string, string>;
    try {
      stubMap = JSON.parse(readFileSync(stubsIndexPath, "utf8")) as Record<
        string,
        string
      >;
    } catch {
      continue;
    }

    const stubsDir = path.join(modulesRoot, entry.name, "stubs");

    for (const [packageImport, relativeStubPath] of Object.entries(stubMap)) {
      const packageRoot = packageImport.split("/")[0].startsWith("@")
        ? packageImport.split("/").slice(0, 2).join("/")
        : packageImport.split("/")[0];

      if (!packageExists(packageRoot)) {
        result[packageImport] = path.join(stubsDir, relativeStubPath);
      }
    }
  }

  return result;
}

const moduleSourceRoots = [
  path.resolve("./.private-modules"),
  path.resolve("./src/features/modules"),
];

const webpackModulePackageStubAliases = moduleSourceRoots.reduce(
  (acc, root) => Object.assign(acc, loadModuleStubAliases(root)),
  {} as Record<string, string>,
);

const modulePackageStubAliases = Object.fromEntries(
  Object.entries(webpackModulePackageStubAliases).map(([alias, absPath]) => [
    alias,
    "./" + path.relative(process.cwd(), absPath),
  ]),
);

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  allowedDevOrigins: ["*.localhost"],
  turbopack: {
    resolveAlias: {
      "@infologist/private-modules": turbopackPrivateModulesAlias,
      ...privateModuleAliases,
      ...modulePackageStubAliases,
    },
  },
  experimental: {
    turbopackFileSystemCacheForDev: false,
    cssChunking: "strict",
    globalNotFound: true,
    optimizePackageImports: ["lucide-react", "@base-ui/react"],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  webpack(config) {
    config.resolve.alias["@infologist/private-modules"] =
      webpackPrivateModulesAlias;
    Object.assign(config.resolve.alias, privateModuleAliases);
    Object.assign(config.resolve.alias, webpackModulePackageStubAliases);
    return config;
  },
};

export default withNextIntl(nextConfig);

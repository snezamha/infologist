import { cache } from "react";

import { getPrisma } from "@/lib/prisma";
import { encryptValue, decryptValue } from "./encrypt";

export type ProjectConfig = {
  clerkPublishableKey: string | null;
  clerkSecretKey: string | null;
  databaseUrl: string | null;
};

const ENCRYPTED_FIELDS: (keyof ProjectConfig)[] = [
  "clerkSecretKey",
  "databaseUrl",
];

type RawConfig = Record<string, string | null>;

async function encryptConfig(
  input: Partial<ProjectConfig>,
): Promise<RawConfig> {
  const result: RawConfig = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined || value === "") {
      result[key] = null;
    } else if ((ENCRYPTED_FIELDS as readonly string[]).includes(key)) {
      result[key] = await encryptValue(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function decryptConfig(raw: RawConfig): Promise<ProjectConfig> {
  const result: Partial<ProjectConfig> = {};

  for (const key of Object.keys(raw) as (keyof ProjectConfig)[]) {
    const value = raw[key];
    if (!value) {
      result[key] = null;
    } else if ((ENCRYPTED_FIELDS as readonly string[]).includes(key)) {
      try {
        result[key] = await decryptValue(value);
      } catch {
        result[key] = null;
      }
    } else {
      result[key] = value;
    }
  }

  return {
    clerkPublishableKey: result.clerkPublishableKey ?? null,
    clerkSecretKey: result.clerkSecretKey ?? null,
    databaseUrl: result.databaseUrl ?? null,
  };
}

export const getProjectConfig = cache(async function getProjectConfig(
  projectId: string,
): Promise<ProjectConfig> {
  const row = await getPrisma().project.findUnique({
    where: { id: projectId },
    select: { config: true },
  });

  if (!row) {
    return {
      clerkPublishableKey: null,
      clerkSecretKey: null,
      databaseUrl: null,
    };
  }

  return decryptConfig((row.config ?? {}) as RawConfig);
});

export async function updateProjectConfig(
  projectId: string,
  data: Partial<ProjectConfig>,
): Promise<void> {
  const existing = await getPrisma().project.findUnique({
    where: { id: projectId },
    select: { config: true },
  });

  const existingRaw = (existing?.config ?? {}) as RawConfig;

  const incoming = await encryptConfig(data);

  const merged: RawConfig = { ...existingRaw };
  for (const [key, value] of Object.entries(incoming)) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }

  await getPrisma().project.update({
    where: { id: projectId },
    data: { config: merged },
  });
}

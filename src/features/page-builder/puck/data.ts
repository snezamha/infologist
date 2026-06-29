import { migrate, type Data } from "@puckeditor/core";

import type { PuckData } from "@/features/page-builder/puck/config";
import { puckMigrationConfig } from "@/features/page-builder/puck/migration";
import { builderDataSchema } from "@/features/page-builder/puck/schema";

const emptyPuckData: PuckData = {
  root: { props: {} },
  content: [],
};

export function parsePuckData(value: unknown): PuckData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const content = (value as Record<string, unknown>).content;

  if (!Array.isArray(content)) {
    return null;
  }

  try {
    const record = value as Record<string, unknown>;
    const zones = record.zones;
    const hasLegacyZones =
      Boolean(zones) &&
      typeof zones === "object" &&
      Object.keys(zones as Record<string, unknown>).length > 0;
    const migrated = migrate(
      value as Data,
      hasLegacyZones ? puckMigrationConfig : undefined,
    );
    const parsed = builderDataSchema.safeParse(migrated);
    return parsed.success ? (parsed.data as PuckData) : null;
  } catch {
    return null;
  }
}

export function normalizePuckData(value: unknown): PuckData {
  return parsePuckData(value) ?? emptyPuckData;
}

export function normalizePuckDataWithTitle(
  value: unknown,
  title: string,
): PuckData {
  const data = normalizePuckData(value);

  return {
    ...data,
    root: {
      ...data.root,
      props: {
        ...data.root.props,
        title,
      },
    },
  };
}

export function hasPuckContent(value: unknown): boolean {
  const data = parsePuckData(value);
  return Boolean(data && data.content.length > 0);
}

export function serializePuckData(value: unknown): PuckData | null {
  const data = parsePuckData(value);

  if (!data || data.content.length === 0) {
    return null;
  }

  return data;
}

import "server-only";

import crypto from "node:crypto";
import { getProjectSql } from "@/lib/projects/project/_db/core";

const dbIdentifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

type ModuleTableSnapshot = {
  columns: Array<{ name: string; dataType: string }>;
  rows: Record<string, unknown>[];
};

export type ModuleDataSnapshot = {
  version: 1;
  exportedAt: string;
  sourceModuleVersion?: string;
  checksum: string;
  tables: Record<string, ModuleTableSnapshot>;
};

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function assertValidIdentifier(value: string, label: string) {
  if (!dbIdentifierPattern.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function haveSameItems(left: readonly string[], right: readonly string[]) {
  const rightSet = new Set(right);
  return (
    left.length === right.length && left.every((value) => rightSet.has(value))
  );
}

function computeChecksum(
  snapshot: Omit<ModuleDataSnapshot, "checksum">,
): string {
  const data = JSON.stringify(snapshot);
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function parseModuleDataSnapshot(
  value: unknown,
  allowedTables: readonly string[],
): ModuleDataSnapshot {
  if (!isRecord(value) || value.version !== 1) {
    throw new Error("Unsupported module data snapshot");
  }
  if (
    typeof value.exportedAt !== "string" ||
    typeof value.checksum !== "string" ||
    (value.sourceModuleVersion !== undefined &&
      typeof value.sourceModuleVersion !== "string") ||
    !isRecord(value.tables)
  ) {
    throw new Error("Invalid module data snapshot");
  }

  const tableNames = Object.keys(value.tables);
  if (!haveSameItems(tableNames, allowedTables)) {
    throw new Error("Snapshot tables do not match the module manifest");
  }

  const tables: Record<string, ModuleTableSnapshot> = {};
  for (const table of tableNames) {
    assertValidIdentifier(table, "table name");
    const tableValue = value.tables[table];
    if (!isRecord(tableValue) || !Array.isArray(tableValue.columns)) {
      throw new Error(`Invalid snapshot table: ${table}`);
    }

    const columnNames = new Set<string>();
    const columns = tableValue.columns.map((col, idx) => {
      if (
        !isRecord(col) ||
        typeof col.name !== "string" ||
        typeof col.dataType !== "string"
      ) {
        throw new Error(`Invalid column at index ${idx} in table: ${table}`);
      }
      assertValidIdentifier(col.name, `column name in ${table}`);
      if (columnNames.has(col.name)) {
        throw new Error(`Duplicate column in snapshot: ${table}.${col.name}`);
      }
      columnNames.add(col.name);
      return { name: col.name, dataType: col.dataType };
    });

    if (
      !Array.isArray(tableValue.rows) ||
      !tableValue.rows.every((row) => isRecord(row))
    ) {
      throw new Error(`Invalid snapshot rows: ${table}`);
    }

    const rows = tableValue.rows.map((row) => {
      const unknownColumns = Object.keys(row).filter(
        (column) => !columnNames.has(column),
      );
      if (unknownColumns.length > 0) {
        throw new Error(
          `Snapshot contains unknown columns in ${table}: ${unknownColumns.join(", ")}`,
        );
      }
      return row;
    });

    tables[table] = { columns, rows };
  }

  const snapshotWithoutChecksum = {
    version: 1 as const,
    exportedAt: value.exportedAt,
    sourceModuleVersion: value.sourceModuleVersion as string | undefined,
    tables,
  };

  const computedChecksum = computeChecksum(snapshotWithoutChecksum);
  if (computedChecksum !== value.checksum) {
    throw new Error("Snapshot checksum mismatch - data may be corrupted");
  }

  return {
    ...snapshotWithoutChecksum,
    checksum: value.checksum,
  };
}

export async function exportModuleData(
  databaseUrl: string | null,
  tables: readonly string[],
  sourceModuleVersion?: string,
): Promise<ModuleDataSnapshot> {
  const snapshotData: Omit<ModuleDataSnapshot, "checksum"> = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sourceModuleVersion,
    tables: {},
  };

  if (tables.length === 0) {
    return { ...snapshotData, checksum: computeChecksum(snapshotData) };
  }
  if (!databaseUrl) {
    throw new Error("Project database is not configured");
  }

  const sql = getProjectSql(databaseUrl);

  for (const table of tables) {
    assertValidIdentifier(table, "table name");
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = ${table}
      ORDER BY ordinal_position
    `;
    if (columns.length === 0) {
      throw new Error(`Module table not found: ${table}`);
    }

    const rows = await sql`${sql.unsafe(
      `SELECT to_jsonb(t) AS row FROM ${quoteIdentifier(table)} AS t`,
    )}`;

    snapshotData.tables[table] = {
      columns: columns.map((column) => ({
        name: column.column_name as string,
        dataType: column.data_type as string,
      })),
      rows: rows.map((row) => (row as { row: Record<string, unknown> }).row),
    };
  }

  const checksum = computeChecksum(snapshotData);
  return {
    ...snapshotData,
    checksum,
  };
}

import { getProjectSql } from "./core";

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function deleteProjectDatabase(
  databaseUrl: string,
): Promise<void> {
  if (!databaseUrl) return;

  try {
    const sql = getProjectSql(databaseUrl);

    const tables = (await sql`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
        AND table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `) as Array<{ table_schema: string; table_name: string }>;

    console.log(
      `[deleteProjectDatabase] found ${tables.length} tables to delete`,
    );

    if (tables.length === 0) {
      console.log("[deleteProjectDatabase] no tables to delete");
      return;
    }

    for (const { table_schema, table_name } of tables) {
      const qualifiedName = `${quoteIdentifier(table_schema)}.${quoteIdentifier(table_name)}`;

      try {
        await sql.unsafe(`DROP TABLE IF EXISTS ${qualifiedName} CASCADE`);
        console.log(
          `[deleteProjectDatabase] dropped table: ${table_schema}.${table_name}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `[deleteProjectDatabase] failed to drop table ${table_schema}.${table_name}:`,
          message,
        );
        throw error;
      }
    }

    console.log(
      `[deleteProjectDatabase] successfully deleted ${tables.length} tables`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[deleteProjectDatabase] cleanup error:", message);
    throw error;
  }
}

import { getProjectSql, type ProjectDbRow } from "./core";

export type ProjectDbUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "admin" | "user";
};

function rowToUser(row: ProjectDbRow): ProjectDbUser {
  return {
    id: row.id as string,
    name: (row.name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    image: (row.image as string | null) ?? null,
    role: (row.role as string) === "admin" ? "admin" : "user",
  };
}

export async function listProjectUsers(
  databaseUrl: string,
): Promise<ProjectDbUser[]> {
  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    SELECT id, name, email, image, role
    FROM users
    ORDER BY created_at ASC
  `) as ProjectDbRow[];

  return rows.map(rowToUser);
}

export async function upsertProjectUserFromClerk(
  databaseUrl: string,
  data: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  },
): Promise<ProjectDbUser> {
  const sql = getProjectSql(databaseUrl);
  const rows = (await sql`
    INSERT INTO users (id, email, name, image, role)
    VALUES (${data.id}, ${data.email}, ${data.name}, ${data.image}, 'user')
    ON CONFLICT (email) DO UPDATE
      SET id         = EXCLUDED.id,
          name       = COALESCE(EXCLUDED.name, users.name),
          image      = COALESCE(EXCLUDED.image, users.image),
          updated_at = NOW()
    RETURNING id, email, name, image, role
  `) as ProjectDbRow[];

  return rowToUser(rows[0]);
}

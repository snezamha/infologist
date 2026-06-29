import { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/prisma";

type Body = {
  key?: string;
  limit?: number;
  windowMs?: number;
};

const TABLE_NAME = "rate_limit_buckets";

let tableReady: Promise<void> | null = null;

function ensureTable() {
  tableReady ??= getPrisma()
    .$executeRawUnsafe(
      `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at TIMESTAMPTZ NOT NULL
    )
  `,
    )
    .then(() => undefined)
    .catch((error) => {
      tableReady = null;
      throw error;
    });

  return tableReady;
}

export async function POST(request: Request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
  if (request.headers.get("x-rate-limit-secret") !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const key = typeof body.key === "string" ? body.key.trim() : "";
  const limit = Number.isInteger(body.limit) ? Number(body.limit) : NaN;
  const windowMs = Number.isInteger(body.windowMs)
    ? Number(body.windowMs)
    : NaN;

  if (!key || limit <= 0 || windowMs <= 0) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  await ensureTable();

  const prisma = getPrisma();
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const result = await prisma.$transaction(async (transaction) => {
    const rows = await transaction.$queryRaw<
      Array<{ count: number; reset_at: Date }>
    >(
      Prisma.sql`SELECT count, reset_at FROM ${Prisma.raw(TABLE_NAME)} WHERE key = ${key} FOR UPDATE`,
    );
    const current = rows[0];

    if (!current) {
      await transaction.$executeRaw(
        Prisma.sql`INSERT INTO ${Prisma.raw(TABLE_NAME)} (key, count, reset_at) VALUES (${key}, 1, ${resetAt})`,
      );
      return { allowed: true, retryAfterMs: 0 };
    }

    if (current.reset_at <= now) {
      await transaction.$executeRaw(
        Prisma.sql`UPDATE ${Prisma.raw(TABLE_NAME)} SET count = 1, reset_at = ${resetAt} WHERE key = ${key}`,
      );
      return { allowed: true, retryAfterMs: 0 };
    }

    if (current.count >= limit) {
      return {
        allowed: false,
        retryAfterMs: current.reset_at.getTime() - now.getTime(),
      };
    }

    await transaction.$executeRaw(
      Prisma.sql`UPDATE ${Prisma.raw(TABLE_NAME)} SET count = count + 1 WHERE key = ${key}`,
    );
    return { allowed: true, retryAfterMs: 0 };
  });

  prisma
    .$executeRawUnsafe(`DELETE FROM ${TABLE_NAME} WHERE reset_at <= NOW()`)
    .catch(() => {});

  return Response.json(result, {
    headers: {
      "cache-control": "no-store",
    },
  });
}

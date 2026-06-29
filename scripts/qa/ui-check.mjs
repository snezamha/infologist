import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import postgres from "postgres";
import { encode } from "next-auth/jwt";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..", "..");
const storagePath = path.join(rootDir, ".cache", "ui-check", "storage.json");
const screenshotPath = path.join(
  rootDir,
  ".cache",
  "ui-check",
  "screenshot.png",
);

dotenv.config({ path: path.join(rootDir, ".env.local") });

const env = process.env;

if (!env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is missing");
}

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

mkdirSync(path.dirname(storagePath), { recursive: true });

const sql = postgres(env.DATABASE_URL, { ssl: "require" });

try {
  const [user] = await sql.unsafe(
    "select id, email, name from users where role = 'super_admin' limit 1",
  );

  if (!user?.id) {
    throw new Error("No super admin user was found");
  }

  const token = await encode({
    secret: env.AUTH_SECRET,
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: null,
    },
    maxAge: 60 * 60 * 24 * 30,
    salt: "authjs.session-token",
  });

  writeFileSync(
    storagePath,
    JSON.stringify(
      {
        cookies: [
          {
            name: "authjs.session-token",
            value: token,
            domain: "localhost",
            path: "/",
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
          },
        ],
        origins: [],
      },
      null,
      2,
    ),
    "utf8",
  );

  execFileSync(
    "npx",
    [
      "-y",
      "playwright@1.51.1",
      "screenshot",
      "--load-storage",
      storagePath,
      "--wait-for-timeout",
      "3000",
      "--viewport-size",
      "1440,1200",
      "http://localhost:3000/en/dashboard",
      screenshotPath,
    ],
    { stdio: "inherit", cwd: rootDir },
  );

  console.log(`Saved storage state to ${storagePath}`);
  console.log(`Saved screenshot to ${screenshotPath}`);
} finally {
  await sql.end();
}

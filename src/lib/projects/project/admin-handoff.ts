import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

export const projectAdminHandoffCookieName = "project-admin-handoff";

type ProjectAdminHandoffPayload = {
  projectId: string;
  userId: string;
  exp: number;
};

function getSecret() {
  return process.env.AUTH_SECRET;
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function createProjectAdminHandoffToken(
  projectId: string,
  userId: string,
) {
  const secret = getSecret();
  if (!secret) return null;

  const payload = encode({
    projectId,
    userId,
    exp: Math.floor(Date.now() / 1000) + 5 * 60,
  } satisfies ProjectAdminHandoffPayload);

  return `${payload}.${sign(payload, secret)}`;
}

export function verifyProjectAdminHandoffToken(
  token: string | undefined | null,
  projectId: string,
) {
  const secret = getSecret();
  if (!secret || !token) return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expectedSignature = sign(payload, secret);
  if (!signaturesMatch(signature, expectedSignature)) return null;

  let parsed: ProjectAdminHandoffPayload;

  try {
    parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as ProjectAdminHandoffPayload;
  } catch {
    return null;
  }

  if (
    parsed.projectId !== projectId ||
    typeof parsed.userId !== "string" ||
    parsed.userId.length === 0 ||
    typeof parsed.exp !== "number" ||
    parsed.exp <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return parsed;
}

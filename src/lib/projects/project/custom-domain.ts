import { promises as dns } from "node:dns";

import { getPrisma } from "@/lib/prisma";
import {
  getProjectDomainId,
  getProjectDomainRoot,
} from "@/lib/projects/project/domain";
import { ActionError } from "@/lib/errors/action-error";

const DOMAIN_REGEX =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function normalizeCustomDomain(input: string): string | null {
  const hostname = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");

  if (!DOMAIN_REGEX.test(hostname) || hostname.length > 253) return null;

  return hostname;
}

export async function setProjectCustomDomain(
  projectId: string,
  domain: string | null,
): Promise<void> {
  if (domain === null) {
    await getPrisma().project.update({
      where: { id: projectId },
      data: { customDomain: null, customDomainVerifiedAt: null },
    });
    return;
  }

  const normalized = normalizeCustomDomain(domain);
  if (!normalized) {
    throw new ActionError("VALIDATION", "Invalid domain format");
  }

  const existing = await getPrisma().project.findFirst({
    where: { customDomain: normalized, id: { not: projectId } },
  });
  if (existing) {
    throw new ActionError(
      "CONFLICT",
      "Domain is already in use by another project",
    );
  }

  await getPrisma().project.update({
    where: { id: projectId },
    data: { customDomain: normalized, customDomainVerifiedAt: null },
  });
}

export type DomainVerificationResult = {
  verified: boolean;
  target: string;
  found: string[];
  error?: string;
};

export async function verifyProjectCustomDomain(
  projectId: string,
): Promise<DomainVerificationResult> {
  const row = await getPrisma().project.findUnique({
    where: { id: projectId },
    select: { customDomain: true, publicId: true },
  });

  if (!row?.customDomain) {
    throw new ActionError("NOT_FOUND", "No custom domain configured");
  }

  const expectedTarget = `${getProjectDomainId(row.publicId)}.${getProjectDomainRoot()}`;

  try {
    const cnames = await dns.resolveCname(row.customDomain);
    const normalizedCnames = cnames.map((c) =>
      c.replace(/\.$/, "").toLowerCase(),
    );
    const matched = normalizedCnames.includes(expectedTarget.toLowerCase());

    if (matched) {
      await getPrisma().project.update({
        where: { id: projectId },
        data: { customDomainVerifiedAt: new Date() },
      });
    }

    return {
      verified: matched,
      target: expectedTarget,
      found: normalizedCnames,
      error: matched
        ? undefined
        : `CNAME points to "${normalizedCnames.join(", ")}" instead of "${expectedTarget}"`,
    };
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    const notFound =
      code === "ENODATA" || code === "ENOTFOUND" || code === "ESERVFAIL";
    return {
      verified: false,
      target: expectedTarget,
      found: [],
      error: notFound
        ? "No CNAME record found for this domain"
        : "DNS lookup failed",
    };
  }
}

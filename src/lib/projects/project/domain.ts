const PROJECT_ID_PREFIX = "prj";
const LEGACY_PROJECT_ID_SEPARATOR = "_";
const PROJECT_ID_SEPARATOR = "-";

function stripPort(host: string) {
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

export function getProjectDomainId(publicId: string) {
  return publicId.replace(
    `${PROJECT_ID_PREFIX}${LEGACY_PROJECT_ID_SEPARATOR}`,
    `${PROJECT_ID_PREFIX}${PROJECT_ID_SEPARATOR}`,
  );
}

export function getProjectPublicIdCandidates(domainId: string) {
  const candidates = [domainId];

  if (domainId.startsWith(`${PROJECT_ID_PREFIX}${PROJECT_ID_SEPARATOR}`)) {
    candidates.push(
      domainId.replace(
        `${PROJECT_ID_PREFIX}${PROJECT_ID_SEPARATOR}`,
        `${PROJECT_ID_PREFIX}${LEGACY_PROJECT_ID_SEPARATOR}`,
      ),
    );
  }

  return candidates;
}

export function getProjectDomainRoot() {
  const configuredRoot = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (configuredRoot) return stripPort(configuredRoot);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) return new URL(siteUrl).hostname.toLowerCase();

  return "localhost";
}

export function getProjectDomainIdFromHost(host: string) {
  const hostname = stripPort(host);
  const rootDomain = getProjectDomainRoot();
  const suffix = `.${rootDomain}`;

  if (!hostname.endsWith(suffix)) return null;

  const domainId = hostname.slice(0, -suffix.length);
  if (
    !domainId ||
    domainId.includes(".") ||
    !/^[a-z0-9-]+$/.test(domainId) ||
    !domainId.startsWith(`${PROJECT_ID_PREFIX}${PROJECT_ID_SEPARATOR}`)
  ) {
    return null;
  }

  return domainId;
}

export function getCustomDomainFromHost(host: string): string | null {
  const hostname = stripPort(host);
  const rootDomain = getProjectDomainRoot();

  if (hostname === rootDomain || hostname.endsWith(`.${rootDomain}`))
    return null;
  if (hostname === "localhost" || hostname === "127.0.0.1") return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;
  if (hostname.endsWith(".localhost")) return null;
  if (!hostname.includes(".")) return null;

  return hostname;
}

export function getProjectUrl(publicId: string) {
  const siteUrl = new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  );
  const rootDomain = getProjectDomainRoot();
  const domainId = getProjectDomainId(publicId);

  siteUrl.hostname = `${domainId}.${rootDomain}`;
  siteUrl.pathname = "/";
  siteUrl.search = "";
  siteUrl.hash = "";

  return siteUrl.toString();
}

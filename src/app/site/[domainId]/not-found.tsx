import type { Metadata } from "next";
import { headers } from "next/headers";

import { NotFoundView } from "@/components/not-found-view";
import type { Locale } from "@/i18n/config";
import deCommon from "@/messages/de/common.json";
import enCommon from "@/messages/en/common.json";
import faCommon from "@/messages/fa/common.json";
import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { getProjectDomainIdFromHost } from "@/lib/projects/project/domain";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";

const notFoundMessages = {
  de: deCommon.notFound,
  en: enCommon.notFound,
  fa: faCommon.notFound,
} satisfies Record<
  Locale,
  {
    title: string;
    description: string;
    goBack: string;
    backHome: string;
  }
>;

export const dynamic = "force-dynamic";

async function getNotFoundLocale(): Promise<Locale> {
  const requestHeaders = await headers();
  const domainId = getProjectDomainIdFromHost(requestHeaders.get("host") ?? "");

  if (!domainId) return "en";

  const project = await getPublicProject(domainId);
  if (!project) return "en";

  const settings = await getPublicProjectSettings(project.id);
  return (await getProjectRequestContext(domainId, settings.general)).locale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getNotFoundLocale();
  const messages = notFoundMessages[locale];

  return {
    title: `404 - ${messages.title}`,
  };
}

export default async function SiteNotFound() {
  const locale = await getNotFoundLocale();
  const messages = notFoundMessages[locale];

  return (
    <NotFoundView
      title={messages.title}
      description={messages.description}
      goBackLabel={messages.goBack}
      backHomeLabel={messages.backHome}
    />
  );
}

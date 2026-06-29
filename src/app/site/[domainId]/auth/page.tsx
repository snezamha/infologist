import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

import {
  getPublicProject,
  getPublicProjectSettings,
} from "@/lib/projects/project/public";
import { getProjectConfig } from "@/lib/projects/project/_config";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { getProjectRequestContext } from "@/lib/projects/project/site-server";

type Props = {
  params: Promise<{ domainId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function sanitizeProjectCallbackUrl(value: unknown) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (typeof candidate !== "string") return "/dashboard";

  const trimmed = candidate.trim();

  if (
    !trimmed ||
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed === "/auth" ||
    trimmed.startsWith("/auth/") ||
    trimmed.startsWith("/api/")
  ) {
    return "/dashboard";
  }

  return trimmed;
}

export default async function ProjectAuthPage({ params, searchParams }: Props) {
  const { domainId } = await params;
  const resolvedSearchParams = await searchParams;
  const project = await getPublicProject(domainId);

  if (!project) redirect("/");

  const [settings, config, session] = await Promise.all([
    getPublicProjectSettings(project.id),
    getProjectConfig(project.id),
    getProjectSession(project.id, domainId),
  ]);

  const context = await getProjectRequestContext(domainId, settings.general);
  const callbackUrl = sanitizeProjectCallbackUrl(
    resolvedSearchParams.callbackUrl,
  );
  if (session) {
    redirect(callbackUrl);
  }

  if (!config.clerkPublishableKey) {
    return (
      <main
        dir={context.dir}
        className="bg-muted/40 flex min-h-screen items-center justify-center px-4 py-12"
      >
        <p className="text-muted-foreground text-sm">
          Auth is not configured for this project.
        </p>
      </main>
    );
  }

  return (
    <main
      dir={context.dir}
      className="bg-muted/40 flex min-h-screen items-center justify-center px-4 py-12"
    >
      <SignIn routing="hash" fallbackRedirectUrl={callbackUrl} />
    </main>
  );
}

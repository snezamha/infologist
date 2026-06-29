import { NextResponse } from "next/server";

import { getPublicProject } from "@/lib/projects/project/public";
import {
  projectAdminHandoffCookieName,
  verifyProjectAdminHandoffToken,
} from "@/lib/projects/project/admin-handoff";
import { getProjectUrl } from "@/lib/projects/project/domain";

type Props = {
  params: Promise<{ domainId: string }>;
};

function getCallbackUrl(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/api/") || value === "/auth") return "/";
  if (value.startsWith("/auth/")) return "/";

  return value;
}

function getProjectRedirectUrl(projectPublicId: string, pathname: string) {
  return new URL(pathname, getProjectUrl(projectPublicId));
}

export async function GET(request: Request, { params }: Props) {
  const { domainId } = await params;
  const project = await getPublicProject(domainId);
  const url = new URL(request.url);
  const callbackUrl = getCallbackUrl(url.searchParams.get("callbackUrl"));

  if (!project) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const payload = verifyProjectAdminHandoffToken(
    url.searchParams.get("token"),
    project.id,
  );

  if (!payload) {
    return NextResponse.redirect(
      getProjectRedirectUrl(project.publicId, "/auth"),
    );
  }

  const response = NextResponse.redirect(
    getProjectRedirectUrl(project.publicId, callbackUrl),
  );

  response.cookies.set(
    projectAdminHandoffCookieName,
    url.searchParams.get("token")!,
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 5 * 60,
    },
  );

  return response;
}

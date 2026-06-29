"use server";

import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";

import { getProjectFeatures } from "@/features/_core/lib";
import { getProjectConfig } from "@/lib/projects/project/_config";
import { getPublicProject } from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import {
  insertProjectVisitor,
  updateProjectVisitorExit,
  updateProjectVisitorHeartbeat,
} from "@/lib/projects/project/_db";

function getClientIp(request: NextRequest) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

function parseUA(uaString: string) {
  const parser = new UAParser(uaString);
  const os = parser.getOS();
  const browser = parser.getBrowser();

  return {
    os:
      os.name && os.version
        ? `${os.name} ${os.version}`.trim()
        : (os.name ?? null),
    browser: browser.name
      ? `${browser.name}${browser.version ? ` ${browser.version}` : ""}`.trim()
      : null,
  };
}

function isExcludedPath(path: string) {
  return (
    /\/(auth|unauthorized|forbidden|server-error)(\/|$)/.test(path) ||
    /\/dashboard(\/|$)/.test(path)
  );
}

export async function handleStatisticsTrack(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      domainId,
      path,
      url,
      id: existingSessionId,
      referrer,
      userAgent: clientUA,
      visitorId,
      entryTime,
      exitTime,
      totalActivityTime,
      heartbeat,
    } = body;

    if (!domainId || typeof domainId !== "string") {
      return Response.json({ error: "Missing domain" }, { status: 400 });
    }

    const project = await getPublicProject(domainId);
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const features = await getProjectFeatures(project.id);
    if (!features.statistics.enabled) {
      return Response.json({ success: true });
    }

    const config = await getProjectConfig(project.id);
    if (!config.databaseUrl) {
      return Response.json(
        { error: "Project database not configured" },
        { status: 500 },
      );
    }

    const ip = getClientIp(request);
    const uaString = request.headers.get("user-agent") ?? clientUA ?? "";
    const { os, browser } = parseUA(String(uaString));
    const vid =
      typeof visitorId === "string" && visitorId.length > 0
        ? visitorId
        : `anon-${ip}-${String(uaString).slice(0, 50)}`;

    const session = await getProjectSession(project.id, domainId).catch(
      () => null,
    );

    if (heartbeat === true && existingSessionId) {
      await updateProjectVisitorHeartbeat(
        config.databaseUrl,
        existingSessionId,
        typeof totalActivityTime === "number" ? totalActivityTime : undefined,
      );

      return Response.json({ success: true, id: existingSessionId });
    }

    if (exitTime != null && existingSessionId) {
      await updateProjectVisitorExit(
        config.databaseUrl,
        existingSessionId,
        new Date(exitTime as number),
        typeof totalActivityTime === "number" ? totalActivityTime : undefined,
      );

      return Response.json({ success: true, id: existingSessionId });
    }

    if (!path || typeof path !== "string") {
      return Response.json({ error: "Invalid path" }, { status: 400 });
    }

    if (isExcludedPath(path)) {
      return Response.json({ success: true });
    }

    if (!url || typeof url !== "string") {
      return Response.json({ error: "Invalid url" }, { status: 400 });
    }

    const sessionId = randomUUID();
    const sessionStartTime =
      typeof entryTime === "number" ? new Date(entryTime) : new Date();

    await insertProjectVisitor(config.databaseUrl, {
      id: sessionId,
      visitorId: vid,
      userId: session?.id ?? null,
      path,
      url,
      referrer: typeof referrer === "string" ? referrer : undefined,
      os: os ?? undefined,
      browser: browser ?? undefined,
      ipAddress: ip !== "unknown" ? ip : undefined,
      userAgent: uaString ? String(uaString) : undefined,
      entryTime: sessionStartTime,
    });

    return Response.json({ success: true, id: sessionId });
  } catch {
    return Response.json({ error: "Failed to track event" }, { status: 500 });
  }
}

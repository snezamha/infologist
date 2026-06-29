"use server";

import { getProjectConfig } from "@/lib/projects/project/_config";
import {
  getLiveProjectVisitors,
  getProjectDetailedVisitorStats,
  getProjectVisitorRecords,
  getProjectVisitorSummary,
} from "@/lib/projects/project/_db";
import { getPublicProject } from "@/lib/projects/project/public";
import { getPrisma } from "@/lib/prisma";
import { parseStatisticsSettings } from "@/features/statistics/lib/settings";

const emptyAnalytics = {
  totalVisitors: 0,
  totalSessions: 0,
  totalActiveTime: 0,
  avgActiveTime: 0,
  dailyVisitors: [] as Array<{ date: string; count: number }>,
};

const emptyDetailedAnalytics = {
  urls: [] as Array<{ name: string; uv: number }>,
  referrals: [] as Array<{ name: string; uv: number }>,
  os: [] as Array<{ name: string; uv: number }>,
  browsers: [] as Array<{ name: string; uv: number }>,
};

async function getProjectStatisticsDatabaseUrl(domainId: string) {
  const project = await getPublicProject(domainId);
  if (!project) return null;

  const config = await getProjectConfig(project.id);
  return config.databaseUrl;
}

async function getProjectStatisticsSettings(projectId: string) {
  const prisma = getPrisma();
  const feature = await prisma.projectFeature.findUnique({
    where: {
      projectId_key: {
        projectId,
        key: "statistics",
      },
    },
  });

  return (
    parseStatisticsSettings(feature?.settings) ?? {
      sessionTimeoutSeconds: 30 * 60,
      liveThresholdSeconds: 3 * 60,
    }
  );
}

export async function getProjectAnalyticsData(
  domainId: string,
  from: Date,
  to: Date,
) {
  const databaseUrl = await getProjectStatisticsDatabaseUrl(domainId);
  if (!databaseUrl) return emptyAnalytics;

  const endDate = new Date(to);
  endDate.setHours(23, 59, 59, 999);

  return getProjectVisitorSummary(databaseUrl, from, endDate);
}

export async function getProjectDetailedAnalytics(domainId: string) {
  const databaseUrl = await getProjectStatisticsDatabaseUrl(domainId);
  if (!databaseUrl) return emptyDetailedAnalytics;

  return getProjectDetailedVisitorStats(databaseUrl);
}

export async function getProjectLiveCount(domainId: string) {
  const project = await getPublicProject(domainId);
  if (!project) return { count: 0, users: [] };

  const databaseUrl = await getProjectStatisticsDatabaseUrl(domainId);
  if (!databaseUrl) return { count: 0, users: [] };

  const settings = await getProjectStatisticsSettings(project.id);
  const cutoff = new Date(Date.now() - settings.liveThresholdSeconds * 1000);
  const users = await getLiveProjectVisitors(databaseUrl, cutoff);

  return { count: users.length, users };
}

export async function getProjectVisitors(
  domainId: string,
  page = 1,
  pageSize = 20,
  query?: string,
) {
  const databaseUrl = await getProjectStatisticsDatabaseUrl(domainId);
  if (!databaseUrl) return { data: [], total: 0 };

  return getProjectVisitorRecords(databaseUrl, page, pageSize, query);
}

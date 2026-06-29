"use server";

import { getProjectConfig } from "@/lib/projects/project/_config";
import {
  getLiveProjectVisitors,
  getProjectVisitorSummary,
} from "@/lib/projects/project/_db";

const LIVE_THRESHOLD_MS = 5 * 60 * 1000;

export async function getStatisticsWidgetData(
  projectId: string,
  from?: Date,
  to?: Date,
) {
  const config = await getProjectConfig(projectId);
  if (!config.databaseUrl) {
    return {
      uniqueSessions: 0,
      uniqueVisitors: 0,
      avgSessionDuration: 0,
      dailyEvents: [] as Array<{ date: string; count: number }>,
    };
  }

  const startDate = new Date(
    from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  );
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(to ?? new Date());
  endDate.setHours(23, 59, 59, 999);
  const data = await getProjectVisitorSummary(
    config.databaseUrl,
    startDate,
    endDate,
  );

  return {
    uniqueSessions: data.totalSessions,
    uniqueVisitors: data.totalVisitors,
    avgSessionDuration: data.avgActiveTime,
    dailyEvents: data.dailyVisitors,
  };
}

export async function getStatisticsWidgetLiveCount(projectId: string) {
  const config = await getProjectConfig(projectId);
  if (!config.databaseUrl) {
    return { count: 0 };
  }

  const cutoff = new Date(Date.now() - LIVE_THRESHOLD_MS);
  const visitors = await getLiveProjectVisitors(config.databaseUrl, cutoff);
  return { count: visitors.length };
}

import type { StatisticsSettings } from "@/features/_core/registry";

export function parseStatisticsSettings(
  rawSettings: unknown,
): StatisticsSettings | undefined {
  if (!rawSettings || typeof rawSettings !== "object") {
    return undefined;
  }

  const obj = rawSettings as Record<string, unknown>;
  const sessionTimeoutSeconds = obj.sessionTimeoutSeconds;
  const liveThresholdSeconds = obj.liveThresholdSeconds;

  if (
    typeof sessionTimeoutSeconds === "number" &&
    typeof liveThresholdSeconds === "number"
  ) {
    return { sessionTimeoutSeconds, liveThresholdSeconds };
  }

  return undefined;
}

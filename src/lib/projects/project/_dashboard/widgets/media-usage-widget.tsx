"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

type MediaUsageCopy = {
  eyebrow: string;
  used: string;
  free: string;
  total: string;
  megabytes: string;
  gigabytes: string;
};

type MediaUsageWidgetProps = {
  usedBytes?: number;
  maxBytes?: number;
  copy?: MediaUsageCopy;
};

function CustomTooltip({
  active,
  payload,
  formatFn,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  formatFn: (bytes: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]!;
  return (
    <div className="bg-background rounded-lg border px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{item.name}</p>
      <p className="text-muted-foreground">{formatFn(item.value)}</p>
    </div>
  );
}

function formatBytes(bytes: number, copy: MediaUsageCopy) {
  if (bytes <= 0) return `0 ${copy.megabytes}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} ${copy.megabytes}`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ${copy.gigabytes}`;
}

export function MediaUsageRateWidget(props: Record<string, unknown>) {
  const { usedBytes = 0, maxBytes = 0, copy } = props as MediaUsageWidgetProps;

  const safeCopy = copy ?? {
    eyebrow: "",
    used: "Used",
    free: "Free",
    total: "Total",
    megabytes: "MB",
    gigabytes: "GB",
  };

  const freeBytes = Math.max(maxBytes - usedBytes, 0);
  const usedPercent =
    maxBytes > 0 ? Math.min((usedBytes / maxBytes) * 100, 100) : 0;

  const data = useMemo(
    () => [
      { name: safeCopy.used, value: usedBytes },
      { name: safeCopy.free, value: freeBytes },
    ],
    [freeBytes, safeCopy.free, safeCopy.used, usedBytes],
  );

  const usedColor = "var(--primary)";
  const freeColor = "hsl(142 71% 45%)";

  return (
    <div className="flex h-full flex-col items-center gap-4 p-4">
      <div className="relative h-44 w-full">
        <PieChart width={200} height={176} className="mx-auto">
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="80%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={usedColor} />
            <Cell fill={freeColor} />
          </Pie>
          <Tooltip
            content={
              <CustomTooltip
                formatFn={(bytes) => formatBytes(bytes, safeCopy)}
              />
            }
          />
        </PieChart>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{usedPercent.toFixed(1)}%</span>
          <span className="text-muted-foreground text-xs">{safeCopy.used}</span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: usedColor }}
            />
            {safeCopy.used}
          </span>
          <span className="font-medium">
            {formatBytes(usedBytes, safeCopy)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: freeColor }}
            />
            {safeCopy.free}
          </span>
          <span className="font-medium">
            {formatBytes(freeBytes, safeCopy)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t pt-1 font-medium">
          <span>{safeCopy.total}</span>
          <span>
            {formatBytes(maxBytes, safeCopy)}{" "}
            <span className="text-muted-foreground font-normal">
              ({usedPercent.toFixed(1)}%)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default MediaUsageRateWidget;

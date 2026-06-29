"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SiteSpinnerSection } from "@/components/loading/site-spinner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getStatisticsWidgetData,
  getStatisticsWidgetLiveCount,
} from "@/features/statistics/_actions/widget";

type WidgetData = Awaited<ReturnType<typeof getStatisticsWidgetData>>;

type StatisticsAnalyticsCopy = {
  name: string;
  uniqueSessions: string;
  uniqueVisitors: string;
  avgSessionDuration: string;
  minUnit: string;
  liveUsers: string;
  noData: string;
  refresh: string;
};

function defaultRange(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  return { from, to };
}

function toInputDate(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

function parseInputDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function formatRangeLabel(from: Date, to: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const fmt = (d: Date) => d.toLocaleDateString(undefined, opts);
  return from.toDateString() === to.toDateString()
    ? fmt(from)
    : `${fmt(from)} – ${fmt(to)}`;
}

function formatMinutes(seconds: number, minUnit: string): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins} ${minUnit} ${secs}s`;
}

function readStoredRange(storageKey: string): { from: Date; to: Date } {
  const fallback = defaultRange();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as { from?: string; to?: string };
    const from = parsed.from ? new Date(parsed.from) : fallback.from;
    const to = parsed.to ? new Date(parsed.to) : fallback.to;
    return { from, to };
  } catch {
    return fallback;
  }
}

function writeStoredRange(storageKey: string, from: Date, to: Date) {
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ from: from.toISOString(), to: to.toISOString() }),
    );
  } catch {}
}

export function StatisticsAnalyticsWidget(props: Record<string, unknown>) {
  const { projectId, copy: rawCopy } = props;
  const copy = (rawCopy ?? {}) as StatisticsAnalyticsCopy;
  const storageKey = `project-statistics-widget:date-range:${projectId as string}`;
  const today = new Date();
  const observerRef = useRef<ResizeObserver | null>(null);
  const [{ from: initialFrom, to: initialTo }] = useState(defaultRange);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [data, setData] = useState<WidgetData | null>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    (f: Date, t: Date) => {
      startTransition(async () => {
        try {
          setData(await getStatisticsWidgetData(projectId as string, f, t));
        } catch {
          setData(null);
        }
      });
    },
    [projectId, startTransition],
  );

  const fetchLive = useCallback(async () => {
    try {
      const result = await getStatisticsWidgetLiveCount(projectId as string);
      setLiveCount(result.count);
    } catch {
      setLiveCount(0);
    }
  }, [projectId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = readStoredRange(storageKey);
      setFrom(stored.from);
      setTo(stored.to);
      fetchData(stored.from, stored.to);
      void fetchLive();
    }, 0);
    const intervalId = window.setInterval(() => void fetchLive(), 15000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [fetchData, fetchLive, storageKey]);

  const measureChart = useCallback((element: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!element) return;

    const updateSize = () => {
      const { width, height } = element.getBoundingClientRect();
      setChartSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    observerRef.current = observer;
  }, []);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const newFrom = parseInputDate(e.target.value);
    const newTo = newFrom > to ? newFrom : to;
    setFrom(newFrom);
    setTo(newTo);
    writeStoredRange(storageKey, newFrom, newTo);
    fetchData(newFrom, newTo);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const newTo = parseInputDate(e.target.value);
    const newFrom = newTo < from ? newTo : from;
    setFrom(newFrom);
    setTo(newTo);
    writeStoredRange(storageKey, newFrom, newTo);
    fetchData(newFrom, newTo);
  };

  const chartData = (data?.dailyEvents ?? []).map((d) => ({
    label: d.date,
    activity: d.count,
  }));

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label={copy.uniqueSessions}
          value={isPending ? "—" : (data?.uniqueSessions ?? 0)}
        />
        <Metric
          label={copy.uniqueVisitors}
          value={isPending ? "—" : (data?.uniqueVisitors ?? 0)}
        />
        <Metric
          label={copy.avgSessionDuration}
          value={
            isPending
              ? "—"
              : formatMinutes(data?.avgSessionDuration ?? 0, copy.minUnit)
          }
        />
        <Metric label={copy.liveUsers} value={liveCount ?? "—"} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Popover>
          <PopoverTrigger
            className="border-input bg-background hover:bg-accent flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors"
            dir="ltr"
          >
            <CalendarDays className="text-muted-foreground size-4 shrink-0" />
            <span>{formatRangeLabel(from, to)}</span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-3">
            <div className="flex flex-col gap-2 text-sm" dir="ltr">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-8 shrink-0">From</span>
                <input
                  type="date"
                  value={toInputDate(from)}
                  max={toInputDate(today)}
                  onChange={handleFromChange}
                  className="border-input bg-background rounded-md border px-2 py-1 text-sm focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-8 shrink-0">To</span>
                <input
                  type="date"
                  value={toInputDate(to)}
                  max={toInputDate(today)}
                  min={toInputDate(from)}
                  onChange={handleToChange}
                  className="border-input bg-background rounded-md border px-2 py-1 text-sm focus:outline-none"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            fetchData(from, to);
            void fetchLive();
          }}
        >
          <RefreshCw className="size-4" />
          {copy.refresh}
        </Button>
      </div>

      {isPending ? (
        <SiteSpinnerSection className="py-12" size={24} />
      ) : chartData.length > 0 ? (
        <div ref={measureChart} className="h-56 w-full min-w-0">
          {chartSize.width > 0 && chartSize.height > 0 ? (
            <ResponsiveContainer
              width={chartSize.width}
              height={chartSize.height}
              minWidth={0}
              minHeight={0}
            >
              <AreaChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="activity"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <SiteSpinnerSection className="h-full" size={24} />
          )}
        </div>
      ) : (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {copy.noData}
        </p>
      )}
    </div>
  );
}

export default StatisticsAnalyticsWidget;

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { SiteSpinnerSection } from "@/components/loading/site-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toastManager } from "@/lib/toast-manager";
import { getPageCount } from "@/lib/pagination";
import {
  getProjectAnalyticsData,
  getProjectDetailedAnalytics,
  getProjectLiveCount,
  getProjectVisitors,
} from "@/features/statistics/_actions/analytics";

const PAGE_SIZE = 20;

type SummaryData = Awaited<ReturnType<typeof getProjectAnalyticsData>>;
type DetailedData = Awaited<ReturnType<typeof getProjectDetailedAnalytics>>;
type LiveData = Awaited<ReturnType<typeof getProjectLiveCount>>;
type VisitorData = Awaited<ReturnType<typeof getProjectVisitors>>;

type Props = {
  domainId: string;
  copy: {
    title: string;
    description: string;
    analytics: string;
    visitors: string;
    live: string;
    search: string;
    uniqueVisitors: string;
    sessions: string;
    totalActiveMin: string;
    avgActiveMin: string;
    topPages: string;
    os: string;
    browsers: string;
    referrals: string;
    liveUsers: string;
    visitorId: string;
    userId: string;
    ip: string;
    entry: string;
    activeMin: string;
    path: string;
    lastSeen: string;
    noData: string;
    refresh: string;
    previous: string;
    next: string;
    error: string;
  };
};

export function ProjectStatisticsView({ domainId, copy }: Props) {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [detailed, setDetailed] = useState<DetailedData | null>(null);
  const [live, setLive] = useState<LiveData | null>(null);
  const [visitors, setVisitors] = useState<VisitorData>({
    data: [],
    total: 0,
  });
  const [visitorPage, setVisitorPage] = useState(1);
  const [visitorSearch, setVisitorSearch] = useState("");

  const loadData = useCallback(() => {
    startTransition(async () => {
      try {
        const [summaryData, detailedData, liveData] = await Promise.all([
          getProjectAnalyticsData(
            domainId,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            new Date(),
          ),
          getProjectDetailedAnalytics(domainId),
          getProjectLiveCount(domainId),
        ]);
        setSummary(summaryData);
        setDetailed(detailedData);
        setLive(liveData);
      } catch {
        toastManager.add({ title: copy.error, type: "error", timeout: 5000 });
      } finally {
        setLoading(false);
      }
    });
  }, [copy.error, domainId, startTransition]);

  const loadVisitors = useCallback(
    (page: number, search: string) => {
      startTransition(async () => {
        try {
          const result = await getProjectVisitors(
            domainId,
            page,
            PAGE_SIZE,
            search || undefined,
          );
          setVisitors(result);
        } catch {
          toastManager.add({ title: copy.error, type: "error", timeout: 5000 });
          setVisitors({ data: [], total: 0 });
        }
      });
    },
    [copy.error, domainId, startTransition],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadVisitors(visitorPage, visitorSearch);
  }, [loadVisitors, visitorPage, visitorSearch]);

  if (loading) {
    return <SiteSpinnerSection className="py-20" />;
  }

  const totalVisitorPages = getPageCount(visitors.total, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="me-1.5 size-4 animate-spin" />
            ) : (
              <RefreshCw className="me-1.5 size-4" />
            )}
            {copy.refresh}
          </Button>
        }
      />

      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics">{copy.analytics}</TabsTrigger>
          <TabsTrigger value="visitors">{copy.visitors}</TabsTrigger>
          <TabsTrigger value="live">
            {copy.live}
            {live && live.count > 0 ? (
              <span className="bg-primary text-primary-foreground ms-1.5 inline-flex size-5 items-center justify-center rounded-full text-xs font-semibold">
                {live.count}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label={copy.uniqueVisitors}
              value={summary?.totalVisitors ?? 0}
            />
            <SummaryCard
              label={copy.sessions}
              value={summary?.totalSessions ?? 0}
            />
            <SummaryCard
              label={copy.totalActiveMin}
              value={Math.round((summary?.totalActiveTime ?? 0) / 60)}
            />
            <SummaryCard
              label={copy.avgActiveMin}
              value={Math.round((summary?.avgActiveTime ?? 0) / 60)}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <RankList
              title={copy.topPages}
              items={detailed?.urls ?? []}
              noData={copy.noData}
            />
            <RankList
              title={copy.referrals}
              items={detailed?.referrals ?? []}
              noData={copy.noData}
            />
            <RankList
              title={copy.os}
              items={detailed?.os ?? []}
              noData={copy.noData}
            />
            <RankList
              title={copy.browsers}
              items={detailed?.browsers ?? []}
              noData={copy.noData}
            />
          </div>
        </TabsContent>

        <TabsContent value="visitors" className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <Input
              value={visitorSearch}
              onChange={(event) => {
                setVisitorSearch(event.target.value);
                setVisitorPage(1);
              }}
              placeholder={copy.search}
              className="max-w-sm"
            />
            <div className="text-muted-foreground shrink-0 text-xs">
              {visitors.total.toLocaleString()}
            </div>
          </div>
          <DashboardSectionCard title={copy.visitors}>
            {visitors.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="text-muted-foreground border-b text-xs">
                    <tr>
                      <th className="py-2 text-start font-medium">
                        {copy.path}
                      </th>
                      <th className="py-2 text-start font-medium">
                        {copy.visitorId}
                      </th>
                      <th className="py-2 text-start font-medium">
                        {copy.userId}
                      </th>
                      <th className="py-2 text-start font-medium">{copy.ip}</th>
                      <th className="py-2 text-start font-medium">{copy.os}</th>
                      <th className="py-2 text-start font-medium">
                        {copy.browsers}
                      </th>
                      <th className="py-2 text-start font-medium">
                        {copy.entry}
                      </th>
                      <th className="py-2 text-start font-medium">
                        {copy.activeMin}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {visitors.data.map((visitor) => (
                      <tr key={visitor.id}>
                        <td className="max-w-52 truncate py-2" dir="ltr">
                          {visitor.path}
                        </td>
                        <td className="max-w-40 truncate py-2" dir="ltr">
                          {visitor.visitorId}
                        </td>
                        <td className="max-w-40 truncate py-2" dir="ltr">
                          {visitor.userId ?? "-"}
                        </td>
                        <td className="py-2" dir="ltr">
                          {visitor.ipAddress ?? "-"}
                        </td>
                        <td className="py-2">{visitor.os ?? "-"}</td>
                        <td className="py-2">{visitor.browser ?? "-"}</td>
                        <td className="py-2" dir="ltr">
                          {visitor.entryTime.toLocaleString()}
                        </td>
                        <td className="py-2">
                          {visitor.totalActiveTime == null
                            ? "-"
                            : Math.round(visitor.totalActiveTime / 60)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{copy.noData}</p>
            )}
          </DashboardSectionCard>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisitorPage((page) => Math.max(page - 1, 1))}
              disabled={isPending || visitorPage <= 1}
            >
              {copy.previous}
            </Button>
            <span className="text-muted-foreground text-xs" dir="ltr">
              {visitorPage} / {totalVisitorPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setVisitorPage((page) => Math.min(page + 1, totalVisitorPages))
              }
              disabled={isPending || visitorPage >= totalVisitorPages}
            >
              {copy.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="live" className="pt-4">
          <DashboardSectionCard
            title={`${copy.liveUsers} (${live?.count ?? 0})`}
          >
            {live && live.users.length > 0 ? (
              <ul className="divide-y text-sm">
                {live.users.map((user, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <span
                      className="text-muted-foreground max-w-52 truncate font-mono text-xs"
                      dir="ltr"
                    >
                      {user.path}
                    </span>
                    <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs">
                      {user.userId && <span dir="ltr">{user.userId}</span>}
                      {user.browser && <span>{user.browser}</span>}
                      {user.os && <span>{user.os}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">{copy.noData}</p>
            )}
          </DashboardSectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RankList({
  title,
  items,
  noData,
}: {
  title: string;
  items: Array<{ name: string; uv: number }>;
  noData: string;
}) {
  return (
    <DashboardSectionCard title={title}>
      <ul className="space-y-2 text-sm">
        {items.slice(0, 8).map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between gap-3"
          >
            <span className="truncate">{item.name}</span>
            <span className="text-muted-foreground shrink-0">{item.uv}</span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-muted-foreground">{noData}</li>
        )}
      </ul>
    </DashboardSectionCard>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}

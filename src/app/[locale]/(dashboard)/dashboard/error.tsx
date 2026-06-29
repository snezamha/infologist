"use client";

import { DashboardErrorState } from "@/components/dashboard/dashboard-state";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: Props) {
  return <DashboardErrorState error={error} reset={reset} />;
}

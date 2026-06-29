import type { NextRequest } from "next/server";

import { handleStatisticsTrack } from "@/features/statistics/_actions/track";

export function POST(request: NextRequest) {
  return handleStatisticsTrack(request);
}

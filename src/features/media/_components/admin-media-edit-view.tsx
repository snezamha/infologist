"use client";

import type { MediaAsset } from "@/features/media/lib";
import { MediaEditView } from "@/features/media/_components/media-edit-view";

export function SiteProjectMediaEditView({
  domainId,
  file,
}: {
  domainId: string;
  file: MediaAsset | null;
  mode?: string;
}) {
  return <MediaEditView domainId={domainId} file={file} />;
}

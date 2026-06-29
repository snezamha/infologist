"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { FileDropzone } from "@/features/media/_components/file-dropzone";

interface MediaUploadViewProps {
  projectId?: string;
  domainId?: string;
  maxFileSizeMB: number;
}

function MediaUploadView({
  projectId,
  domainId,
  maxFileSizeMB,
}: MediaUploadViewProps) {
  const t = useTranslations("media");
  const router = useRouter();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("uploadTitle")}
        description={t("description")}
      />
      <DashboardSectionCard title={t("uploadTitle")}>
        <FileDropzone
          projectId={projectId}
          domainId={domainId}
          accept="image/*,application/pdf,video/mp4,video/webm"
          maxSizeMB={maxFileSizeMB}
          dropLabel={t("dropZone")}
          orLabel={t("or")}
          selectLabel={t("selectFiles")}
          maxSizeLabel={t("maxFileSizeCurrent", {
            size: `${maxFileSizeMB} MB`,
          })}
          fileTooLargeMsg={t("uploadFailed")}
          uploadSuccessMsg={t("uploadSuccess")}
          uploadFailedMsg={t("uploadFailed")}
          removeLabel={t("removeUpload")}
          onUploadComplete={() => router.refresh()}
        />
      </DashboardSectionCard>
    </div>
  );
}

export function SiteProjectMediaUploadView({
  domainId,
  maxFileSizeMB,
}: {
  domainId: string;
  maxFileSizeMB: number;
}) {
  return <MediaUploadView domainId={domainId} maxFileSizeMB={maxFileSizeMB} />;
}

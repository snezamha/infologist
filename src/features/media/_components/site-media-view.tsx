"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Edit, Grid2X2, ImageIcon, List, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalClose } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { toastManager } from "@/lib/toast-manager";
import {
  deleteProjectMediaFile,
  formatFileSize,
  isImageMimeType,
  type MediaAsset,
} from "@/features/media/lib";
import { Loader2 } from "lucide-react";

interface SiteProjectMediaViewProps {
  domainId: string;
  initialFiles: MediaAsset[];
  total: number;
}

export function SiteProjectMediaView({
  domainId,
  initialFiles = [],
}: SiteProjectMediaViewProps) {
  const t = useTranslations("media");
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);

  const filteredFiles = (initialFiles as MediaAsset[]).filter((file) => {
    const matchesSearch = file.filename
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = filterType === "all" || file.mimeType === filterType;
    return matchesSearch && matchesType;
  });

  const uniqueMimeTypes = Array.from(
    new Set((initialFiles as MediaAsset[]).map((file) => file.mimeType)),
  ).sort();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("libraryTitle")}
        description={t("description")}
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/media/upload" />}
          >
            {t("addButton")}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="text-muted-foreground absolute start-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            className="ps-9"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value ?? "all")}
        >
          <SelectTrigger className="w-[12rem]">
            <SelectValue placeholder={t("allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTypes")}</SelectItem>
            {uniqueMimeTypes.map((mime) => (
              <SelectItem key={mime} value={mime}>
                {mime}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ms-auto flex gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            aria-label={t("listView")}
          >
            <List className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
            aria-label={t("gridView")}
          >
            <Grid2X2 className="size-4" />
          </Button>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="rounded-lg border px-4 py-8 text-center">
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFiles.map((file) => (
            <div key={file.id} className="overflow-hidden rounded-lg border">
              <div className="bg-muted relative grid aspect-video place-items-center overflow-hidden">
                {isImageMimeType(file.mimeType) && file.publicUrl ? (
                  <div
                    className="size-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${file.publicUrl})` }}
                    aria-label={file.alt || file.filename}
                  />
                ) : (
                  <ImageIcon className="text-muted-foreground size-8" />
                )}
              </div>
              <div className="space-y-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {file.filename}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <div className="flex items-center justify-start gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    nativeButton={false}
                    render={<Link href={`/dashboard/media/${file.id}/edit`} />}
                  >
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(file)}
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-3 py-2 text-start">{t("libraryTitle")}</th>
                  <th className="px-3 py-2 text-start">{t("type")}</th>
                  <th className="px-3 py-2 text-start">{t("size")}</th>
                  <th className="px-3 py-2 text-start">{t("allDates")}</th>
                  <th className="px-3 py-2 text-end" />
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b last:border-b-0">
                    <td className="px-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {isImageMimeType(file.mimeType) && file.publicUrl ? (
                          <div
                            className="size-10 shrink-0 rounded bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${file.publicUrl})`,
                            }}
                          />
                        ) : (
                          <div className="bg-muted grid size-10 shrink-0 place-items-center rounded">
                            <ImageIcon className="size-4" />
                          </div>
                        )}
                        <span className="truncate font-medium">
                          {file.filename}
                        </span>
                      </div>
                    </td>
                    <td className="text-muted-foreground px-3 py-3">
                      {file.mimeType}
                    </td>
                    <td className="text-muted-foreground px-3 py-3">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="text-muted-foreground px-3 py-3">
                      {file.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-start gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          nativeButton={false}
                          render={
                            <Link href={`/dashboard/media/${file.id}/edit`} />
                          }
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(file)}
                        >
                          <Trash2 className="text-destructive size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("confirmDelete")}
        description={deleteTarget?.filename}
        footer={
          <>
            <ModalClose
              render={<Button variant="outline">{t("cancel")}</Button>}
            />
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                if (!deleteTarget) return;
                startDeleteTransition(async () => {
                  try {
                    await deleteProjectMediaFile({ domainId }, deleteTarget.id);
                    setDeleteTarget(null);
                    router.refresh();
                    toastManager.add({
                      title: t("deleteSuccess"),
                      type: "success",
                      timeout: 3000,
                    });
                  } catch (error) {
                    setDeleteTarget(null);
                    toastManager.add({
                      title:
                        error instanceof Error
                          ? error.message
                          : t("deleteFailed"),
                      type: "error",
                      timeout: 5000,
                    });
                  }
                });
              }}
            >
              {isDeleting && <Loader2 className="me-1 size-4 animate-spin" />}
              {t("delete")}
            </Button>
          </>
        }
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FolderKanban,
  Globe2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { DeleteConfirmationModal } from "@/components/shared/delete-confirmation-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ClientDataTable,
  DataTableColumnHeader,
} from "@/components/data-table/data-table";
import { toastManager } from "@/lib/toast-manager";
import { Link } from "@/i18n/navigation";
import {
  deleteProject,
  retryProjectProvisioning,
  type ProjectRecord,
} from "@/app/[locale]/(dashboard)/dashboard/projects/_actions/project-actions";
import { CreateProjectWizard } from "./create-project-wizard";
import { getProjectUrl } from "@/lib/projects/project/domain";
import { ProjectStatusBadge } from "./project-status-badge";

type Props = {
  projects: ProjectRecord[];
  canManage: boolean;
};

export function ProjectsView({ projects, canManage }: Props) {
  const t = useTranslations("projects");
  const locale = useLocale();
  const router = useRouter();
  const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(
    null,
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  async function handleDelete() {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      toastManager.add({
        title: t("deleteSuccess"),
        type: "success",
        timeout: 3000,
      });
      setProjectToDelete(null);
      setDeleteConfirmation("");
    } catch {
      toastManager.add({
        title: t("deleteError"),
        type: "error",
        timeout: 4000,
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleRetry(project: ProjectRecord) {
    setRetryingId(project.id);
    try {
      await retryProjectProvisioning(project.id);
      toastManager.add({
        title: t("retrySuccess"),
        type: "success",
        timeout: 3000,
      });
    } catch {
      toastManager.add({
        title: t("retryError"),
        type: "error",
        timeout: 4000,
      });
    } finally {
      setRetryingId(null);
    }
  }

  function handleCreateSuccess(project: ProjectRecord) {
    setCreateOpen(false);
    router.push(`/dashboard/projects/${project.publicId}`);
  }

  const activeProjects = projects.filter(
    (project) => project.status === "active",
  ).length;
  const needsAttention = projects.filter(
    (project) => project.status !== "active",
  ).length;
  const customDomains = projects.filter(
    (project) => project.customDomain,
  ).length;
  const summaryItems = [
    {
      key: "total",
      label: t("summary.total"),
      value: projects.length,
      icon: FolderKanban,
    },
    {
      key: "active",
      label: t("summary.active"),
      value: activeProjects,
      icon: CheckCircle2,
    },
    {
      key: "needsAttention",
      label: t("summary.needsAttention"),
      value: needsAttention,
      icon: AlertTriangle,
    },
    {
      key: "customDomains",
      label: t("summary.customDomains"),
      value: customDomains,
      icon: Globe2,
    },
  ];

  const baseColumns: ColumnDef<ProjectRecord>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.name")} />
      ),
      cell: ({ row }) =>
        canManage ? (
          <Link
            href={`/dashboard/projects/${row.original.publicId}`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ) : (
          <span className="font-medium">{row.original.name}</span>
        ),
    },
    {
      accessorKey: "publicId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.publicId")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs" dir="ltr">
          {row.original.publicId}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.status")} />
      ),
      cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("columns.updatedAt")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap" dir="ltr">
          {new Intl.DateTimeFormat(locale, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(row.original.updatedAt))}
        </span>
      ),
    },
  ];

  const actionsColumn: ColumnDef<ProjectRecord> = {
    id: "actions",
    header: () => <div className="text-start">{t("columns.actions")}</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-start gap-2">
        {row.original.status === "suspended" && (
          <Button
            size="icon-sm"
            variant="outline"
            title={t("retry")}
            aria-label={t("retry")}
            onClick={() => handleRetry(row.original)}
            disabled={retryingId === row.original.id}
          >
            {retryingId === row.original.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="ghost"
          title={t("openSite")}
          aria-label={t("openSite")}
          disabled={row.original.status !== "active"}
          nativeButton={false}
          render={
            <a
              href={getProjectUrl(row.original.publicId)}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          title={t("edit")}
          aria-label={t("edit")}
          onClick={() =>
            router.push(`/dashboard/projects/${row.original.publicId}`)
          }
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          title={t("delete")}
          aria-label={t("delete")}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            setProjectToDelete(row.original);
            setDeleteConfirmation("");
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  };

  const columns: ColumnDef<ProjectRecord>[] = canManage
    ? [...baseColumns, actionsColumn]
    : baseColumns;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canManage ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="me-2 h-4 w-4" />
              {t("new")}
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="rounded-lg border bg-card px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">{item.label}</p>
                <Icon className="text-muted-foreground size-4" />
              </div>
              <p className="mt-2 text-2xl font-semibold" dir="ltr">
                {new Intl.NumberFormat(locale).format(item.value)}
              </p>
            </div>
          );
        })}
      </div>

      <ClientDataTable
        data={projects}
        columns={columns}
        searchKeys={["name", "publicId"]}
        searchPlaceholder={t("searchPlaceholder")}
        noDataMessage={t("empty")}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent closeLabel={t("cancel")}>
          <CreateProjectWizard onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        open={!!projectToDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setProjectToDelete(null);
            setDeleteConfirmation("");
          }
        }}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", {
          name: projectToDelete?.name ?? "",
        })}
        inputLabel={t("deleteConfirmInput")}
        inputPlaceholder={projectToDelete?.name ?? ""}
        inputHint={t("deleteConfirmHint")}
        expectedValue={projectToDelete?.name ?? ""}
        confirmationValue={deleteConfirmation}
        onConfirmationValueChange={setDeleteConfirmation}
        cancelLabel={t("cancel")}
        confirmLabel={t("deleteAction")}
        isPending={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

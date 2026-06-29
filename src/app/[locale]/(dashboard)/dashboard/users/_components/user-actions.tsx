"use client";

import { Edit, Loader2, Trash2, UserCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal, ModalClose } from "@/components/ui/modal";
import { Link } from "@/i18n/navigation";
import { hasPermission } from "@/lib/auth/permissions";
import { toastManager } from "@/lib/toast-manager";
import { roles, type Role } from "@/lib/users/role-values";

import {
  deleteUser,
  updateUserRole,
} from "@/app/[locale]/(dashboard)/dashboard/users/_actions/user-actions";
import type { DashboardUser } from "@/app/[locale]/(dashboard)/dashboard/users/_types/user";

type Props = {
  user: DashboardUser;
  currentUserId: string;
  currentUserRole: string;
};

export function UserActions(props: Props) {
  const t = useTranslations("users");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isRolePending, startRoleTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const canManage =
    hasPermission(props.currentUserRole as Role, "users.manage") &&
    props.user.id !== props.currentUserId;

  return (
    <div className="flex items-center gap-1">
      {canManage ? (
        <Button
          nativeButton={false}
          variant="ghost"
          size="icon-sm"
          aria-label={t("actions.edit")}
          title={t("actions.edit")}
          render={<Link href={`/dashboard/users/${props.user.id}/edit`} />}
        >
          <Edit className="size-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled
          aria-label={t("actions.edit")}
          title={t("actions.none")}
        >
          <Edit className="size-4" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canManage || isRolePending}
              aria-label={t("actions.changeRole")}
              title={!canManage ? t("actions.none") : t("actions.changeRole")}
            >
              {isRolePending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserCog className="size-4" />
              )}
            </Button>
          }
        />
        <DropdownMenuContent side="bottom" align="end" className="min-w-44">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("actions.changeRole")}</DropdownMenuLabel>
            {roles.map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={() =>
                  startRoleTransition(async () => {
                    try {
                      await updateUserRole(props.user.id, role);
                      toastManager.add({
                        title: t("roleSuccess"),
                        type: "success",
                        timeout: 3000,
                      });
                    } catch (error) {
                      toastManager.add({
                        title:
                          error instanceof Error ? error.message : t("error"),
                        type: "error",
                        timeout: 5000,
                      });
                    }
                  })
                }
                className={props.user.role === role ? "font-medium" : undefined}
              >
                <UserCog className="size-4" />
                {t(`roles.${role}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={!canManage || isDeletePending}
        aria-label={t("actions.delete")}
        title={!canManage ? t("actions.none") : t("actions.delete")}
        onClick={() => setDeleteOpen(true)}
      >
        {isDeletePending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="text-destructive size-4" />
        )}
      </Button>

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("actions.deleteConfirm")}
        description={t("actions.deleteConfirmDescription")}
        footer={
          <>
            <ModalClose
              render={<Button variant="outline">{t("actions.cancel")}</Button>}
            />
            <Button
              variant="destructive"
              disabled={isDeletePending}
              onClick={() =>
                startDeleteTransition(async () => {
                  try {
                    await deleteUser(props.user.id);
                    setDeleteOpen(false);
                    toastManager.add({
                      title: t("deleteSuccess"),
                      type: "success",
                      timeout: 3000,
                    });
                  } catch (error) {
                    toastManager.add({
                      title:
                        error instanceof Error ? error.message : t("error"),
                      type: "error",
                      timeout: 5000,
                    });
                  }
                })
              }
            >
              {isDeletePending && <Loader2 className="size-4 animate-spin" />}
              {t("actions.confirm")}
            </Button>
          </>
        }
      />
    </div>
  );
}

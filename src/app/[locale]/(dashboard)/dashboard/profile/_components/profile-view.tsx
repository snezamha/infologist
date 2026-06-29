"use client";

import {
  BadgeInfo,
  MonitorSmartphone,
  ShieldAlert,
  UserRound,
  Loader2,
  LogOut,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ElementType, FormEvent, ReactNode } from "react";
import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";

import { DashboardFormField } from "@/components/dashboard/form-field";
import {
  getIdentityInitials,
  IdentityPreviewCard,
  IdentityStatusRow,
} from "@/components/dashboard/identity-preview-card";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { useSiteDateTimeFormat } from "@/components/providers/datetime-format-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalClose } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { type Locale } from "@/i18n/config";
import { isActionError } from "@/lib/errors/action-error";
import { toastManager } from "@/lib/toast-manager";
import { localizedPath } from "@/lib/auth/callback-url";
import type { Role } from "@/lib/users/role";

import {
  deleteCurrentAccount,
  getProfileSecurity,
  type ProfileErrorKey,
  revokeOtherSessions,
  revokeSession,
  updateProfile,
} from "@/app/[locale]/(dashboard)/dashboard/profile/_actions/profile-actions";

type Profile = Awaited<ReturnType<typeof updateProfile>>;
type ProfileSecurity = Awaited<ReturnType<typeof getProfileSecurity>>;
type ProfileSession = ProfileSecurity["sessions"][number];

type ProfileForm = {
  name: string;
  email: string;
};

type Props = {
  profile: Profile;
  security: ProfileSecurity;
};

const PROFILE_ERROR_KEYS = new Set<ProfileErrorKey>([
  "unauthorized",
  "notFound",
  "invalidEmail",
  "emailConflict",
  "emailConfirmMismatch",
]);

function getForm(profile: Profile): ProfileForm {
  return {
    name: profile.name ?? "",
    email: profile.email ?? "",
  };
}

function resolveProfileError(
  error: unknown,
  t: ReturnType<typeof useTranslations<"profile">>,
) {
  if (
    isActionError(error) &&
    PROFILE_ERROR_KEYS.has(error.message as ProfileErrorKey)
  ) {
    return t(`errors.${error.message as ProfileErrorKey}`);
  }

  return t("error");
}

function CardTitleWithIcon({
  icon: Icon,
  children,
}: {
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="text-muted-foreground size-4" />
      <span>{children}</span>
    </span>
  );
}

export function ProfileView({ profile, security }: Props) {
  const t = useTranslations("profile");
  const tDashboard = useTranslations("dashboard");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { formatDateTime } = useSiteDateTimeFormat();
  const [isPending, startTransition] = useTransition();
  const [isSessionPending, startSessionTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [savedProfile, setSavedProfile] = useState(profile);
  const [form, setForm] = useState<ProfileForm>(() => getForm(profile));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const displayName = form.name || form.email;
  const isGoogleProfile = savedProfile.hasGoogleAccount;
  const hasChanges =
    form.name !== (savedProfile.name ?? "") ||
    form.email !== (savedProfile.email ?? "");
  const activeSessions = security.sessions;
  const deleteEmail = (savedProfile.email ?? "").trim().toLowerCase();
  const canConfirmDelete =
    deleteEmail.length > 0 &&
    deleteConfirmation.trim().toLowerCase() === deleteEmail;

  function setField<K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(getForm(savedProfile));
  }

  function handleDeleteOpenChange(open: boolean) {
    setDeleteOpen(open);
    if (!open) {
      setDeleteConfirmation("");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const nextProfile = await updateProfile(form);
        setSavedProfile(nextProfile);
        setForm(getForm(nextProfile));
        toastManager.add({
          title: t("saved"),
          type: "success",
          timeout: 3000,
        });
      } catch (error) {
        toastManager.add({
          title: resolveProfileError(error, t),
          type: "error",
          timeout: 5000,
        });
      }
    });
  }

  function handleRevokeSession(session: ProfileSession) {
    setPendingSessionId(session.id);

    startSessionTransition(async () => {
      try {
        await revokeSession(session.id);

        if (session.isCurrent) {
          await signOut({ redirect: false });
          router.replace(localizedPath(locale, "/auth"));
          return;
        }

        toastManager.add({
          title: t("sessionRevoked"),
          type: "success",
          timeout: 3000,
        });
      } catch (error) {
        toastManager.add({
          title: resolveProfileError(error, t),
          type: "error",
          timeout: 5000,
        });
      } finally {
        setPendingSessionId(null);
      }
    });
  }

  function handleRevokeOtherSessions() {
    startSessionTransition(async () => {
      try {
        await revokeOtherSessions();
        toastManager.add({
          title: t("otherSessionsRevoked"),
          type: "success",
          timeout: 3000,
        });
      } catch (error) {
        toastManager.add({
          title: resolveProfileError(error, t),
          type: "error",
          timeout: 5000,
        });
      }
    });
  }

  function handleDeleteAccount() {
    startDeleteTransition(async () => {
      try {
        await deleteCurrentAccount(deleteConfirmation);
        router.replace(localizedPath(locale, "/auth"));
      } catch (error) {
        toastManager.add({
          title: resolveProfileError(error, t),
          type: "error",
          timeout: 5000,
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DashboardPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isPending || !hasChanges}
              onClick={resetForm}
            >
              <RefreshCcw className="size-4" />
              {t("reset")}
            </Button>
            <Button type="submit" disabled={isPending || !hasChanges}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {t("save")}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <DashboardSectionCard
          title={
            <CardTitleWithIcon icon={UserRound}>
              {t("formTitle")}
            </CardTitleWithIcon>
          }
          description={t("formDescription")}
          contentClassName="grid gap-4"
        >
          <DashboardFormField id="profileName" label={t("name")}>
            <Input
              id="profileName"
              value={form.name}
              maxLength={120}
              autoComplete="name"
              placeholder={t("namePlaceholder")}
              onChange={(event) => setField("name", event.target.value)}
            />
          </DashboardFormField>

          <DashboardFormField id="profileEmail" label={t("email")}>
            <Input
              id="profileEmail"
              type="email"
              value={form.email}
              required={!isGoogleProfile}
              disabled={isGoogleProfile}
              autoComplete="email"
              dir="ltr"
              placeholder={t("emailPlaceholder")}
              onChange={(event) => setField("email", event.target.value)}
            />
            {isGoogleProfile ? (
              <p className="text-muted-foreground text-xs">
                {t("googleManagedField")}
              </p>
            ) : null}
          </DashboardFormField>
        </DashboardSectionCard>

        <IdentityPreviewCard
          title={
            <CardTitleWithIcon icon={BadgeInfo}>
              {t("previewTitle")}
            </CardTitleWithIcon>
          }
          description={t("previewDescription")}
          name={displayName}
          email={form.email}
          image={savedProfile.image ?? undefined}
          fallback={getIdentityInitials(form.name || null, form.email || null)}
        >
          <IdentityStatusRow label={t("role")}>
            <StatusBadge variant="outline">
              {tDashboard(`roles.${savedProfile.role as Role}`)}
            </StatusBadge>
          </IdentityStatusRow>
          <IdentityStatusRow label={t("emailStatus")}>
            <StatusBadge
              variant={savedProfile.emailVerified ? "success" : "warning"}
            >
              {savedProfile.emailVerified ? t("verified") : t("unverified")}
            </StatusBadge>
          </IdentityStatusRow>
          <IdentityStatusRow label={t("lastLogin")}>
            <span className="min-w-0 truncate text-sm font-medium">
              {savedProfile.lastLoginAt
                ? formatDateTime(savedProfile.lastLoginAt)
                : t("lastLoginEmpty")}
            </span>
          </IdentityStatusRow>
        </IdentityPreviewCard>
      </div>

      <DashboardSectionCard
        title={
          <CardTitleWithIcon icon={MonitorSmartphone}>
            {t("sessionsTitle")}
          </CardTitleWithIcon>
        }
        description={t("sessionsDescription")}
        contentClassName="grid gap-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <StatusBadge variant="secondary">
            {t("activeSessions")}: {activeSessions.length}
          </StatusBadge>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isSessionPending || activeSessions.length <= 1}
            onClick={handleRevokeOtherSessions}
          >
            {isSessionPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            {t("revokeOtherSessions")}
          </Button>
        </div>

        <div className="space-y-3">
          {activeSessions.length > 0 ? (
            activeSessions.map((session) => (
              <div
                key={session.id}
                className="border-border grid gap-3 rounded-lg border p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {session.deviceLabel}
                      </p>
                      {session.isCurrent ? (
                        <StatusBadge variant="success">
                          {t("current")}
                        </StatusBadge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground text-xs" dir="ltr">
                      {session.browserLabel ??
                        session.osLabel ??
                        t("unknownDevice")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={session.isCurrent ? "destructive" : "outline"}
                    size="sm"
                    className="w-full shrink-0 sm:w-auto"
                    disabled={
                      isSessionPending && pendingSessionId === session.id
                    }
                    onClick={() => handleRevokeSession(session)}
                  >
                    {isSessionPending && pendingSessionId === session.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : session.isCurrent ? (
                      <LogOut className="size-3.5" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    {session.isCurrent
                      ? t("revokeCurrentSession")
                      : t("revokeSession")}
                  </Button>
                </div>
                <div className="text-muted-foreground grid gap-1 text-xs">
                  <p>
                    {t("ipAddress")}: {session.ipAddress ?? "—"}
                  </p>
                  <p>
                    {t("lastSeen")}: {formatDateTime(session.lastSeenAt)}
                  </p>
                  <p>
                    {t("expires")}: {formatDateTime(session.expires)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              {t("noActiveSessions")}
            </p>
          )}
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard
        title={
          <CardTitleWithIcon icon={ShieldAlert}>
            {t("dataTitle")}
          </CardTitleWithIcon>
        }
        description={t("dataDescription")}
        contentClassName="grid gap-3"
      >
        <Button
          type="button"
          variant="destructive"
          className="w-full sm:w-auto"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" />
          {t("deleteAccount")}
        </Button>
      </DashboardSectionCard>

      <Modal
        open={deleteOpen}
        onOpenChange={handleDeleteOpenChange}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription")}
        bodyClassName="grid gap-4"
        footer={
          <>
            <ModalClose
              render={<Button variant="outline">{t("cancel")}</Button>}
            />
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletePending || !canConfirmDelete}
              onClick={handleDeleteAccount}
            >
              {isDeletePending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {t("deleteAction")}
            </Button>
          </>
        }
      >
        <DashboardFormField
          id="deleteConfirmation"
          label={t("deleteConfirmInput")}
        >
          <Input
            id="deleteConfirmation"
            value={deleteConfirmation}
            dir="ltr"
            autoComplete="off"
            placeholder={savedProfile.email ?? t("deleteConfirmPlaceholder")}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            {t("deleteConfirmHint")}
          </p>
        </DashboardFormField>
      </Modal>
    </form>
  );
}

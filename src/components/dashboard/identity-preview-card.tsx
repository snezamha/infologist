import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { DashboardSectionCard } from "./section-card";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  name: string;
  email: string;
  image?: string;
  fallback: string;
  children?: ReactNode;
};

type RowProps = {
  label: ReactNode;
  children: ReactNode;
};

export function getIdentityInitials(name: string | null, email: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return email?.[0]?.toUpperCase() ?? "?";
}

export function IdentityStatusRow({ label, children }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-sm">{label}</span>
      {children}
    </div>
  );
}

export function IdentityPreviewCard({
  title,
  description,
  name,
  email,
  image,
  fallback,
  children,
}: Props) {
  const hasDisplayName = name.trim().length > 0;
  const imageSrc = image?.trim() || undefined;

  return (
    <DashboardSectionCard
      title={title}
      description={description}
      contentClassName="space-y-5"
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-20">
          <AvatarImage
            src={imageSrc}
            alt={name || email}
            referrerPolicy="no-referrer"
            loading="eager"
          />
          <AvatarFallback className="text-xl">{fallback}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <p className="truncate text-base font-medium">
            {hasDisplayName ? name : email}
          </p>
          <p className="text-muted-foreground truncate text-sm" dir="ltr">
            {hasDisplayName ? email : fallback}
          </p>
        </div>
      </div>
      {children ? <div className="grid gap-3">{children}</div> : null}
    </DashboardSectionCard>
  );
}

"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import type { CustomFieldRender } from "@puckeditor/core";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { sanitizeLinkUrl } from "@/features/page-builder/puck/safety";

const LinkPickerField: CustomFieldRender<string> = ({
  value,
  onChange,
  readOnly,
}) => {
  const t = useTranslations("pageBuilder.builder");
  const source = value ?? "";
  const [editing, setEditing] = useState({ source, draft: source });
  const draft = editing.source === source ? editing.draft : source;
  const isInvalid = Boolean(draft && !sanitizeLinkUrl(draft));

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Link2 className="text-muted-foreground absolute start-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          dir="ltr"
          className="ps-9"
          value={draft}
          disabled={readOnly}
          placeholder={t("linkPlaceholder")}
          aria-invalid={isInvalid}
          onChange={(event) => {
            const next = event.target.value;
            setEditing({ source, draft: next });
            const safe = sanitizeLinkUrl(next);
            if (safe || !next) onChange(safe);
          }}
          onBlur={() => {
            const safe = sanitizeLinkUrl(draft);
            setEditing({ source: safe, draft: safe });
            onChange(safe);
          }}
        />
      </div>
      {isInvalid ? (
        <p className="text-destructive text-xs">{t("invalidLink")}</p>
      ) : null}
    </div>
  );
};

export const linkPickerField = {
  type: "custom" as const,
  render: LinkPickerField,
};

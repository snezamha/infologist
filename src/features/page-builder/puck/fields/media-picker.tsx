"use client";

import { ImageIcon, X } from "lucide-react";
import type { CustomFieldRender } from "@puckeditor/core";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MediaPickerField: CustomFieldRender<string> = ({
  value,
  onChange,
  readOnly,
}) => {
  const t = useTranslations("pageBuilder.builder");

  return (
    <div className="space-y-2">
      {value ? (
        <div className="bg-muted relative aspect-video overflow-hidden rounded-md border">
          <div
            className="size-full bg-cover bg-center"
            style={{ backgroundImage: `url(${value})` }}
          />
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            className="absolute end-2 top-2"
            disabled={readOnly}
            onClick={() => onChange("")}
          >
            <X className="size-4" />
            <span className="sr-only">{t("removeMedia")}</span>
          </Button>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <ImageIcon className="text-muted-foreground size-4 shrink-0" />
        <Input
          type="url"
          value={value ?? ""}
          placeholder={t("chooseMedia")}
          disabled={readOnly}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
};

export const mediaPickerField = {
  type: "custom" as const,
  render: MediaPickerField,
};

"use client";

import { Check, Edit2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n/config";
import { sanitizeSlug } from "@/features/page-builder/slug";

type Props = {
  id: string;
  value: string;
  locale: Locale;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  dir?: string;
};

export function SlugField({
  id,
  value,
  locale,
  onChange,
  disabled = false,
  required = false,
  dir = "ltr",
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  function handleEdit() {
    setEditValue(value);
    setIsEditing(true);
  }

  function handleSave() {
    const sanitized = sanitizeSlug(editValue, locale);
    onChange(sanitized);
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex gap-2">
        <Input
          id={id}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          disabled={disabled}
          dir={dir}
          className="flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={handleSave}
        >
          <Check className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={handleCancel}
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        value={value}
        disabled
        dir={dir}
        required={required}
        className="bg-muted"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={handleEdit}
      >
        <Edit2 className="size-4" />
      </Button>
    </div>
  );
}

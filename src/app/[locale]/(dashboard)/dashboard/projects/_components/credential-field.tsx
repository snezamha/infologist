"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/lib/toast-manager";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  secret?: boolean;
  showCopy?: boolean;
  autoFocus?: boolean;
  copyLabel: string;
  copiedLabel: string;
  showLabel?: string;
  hideLabel?: string;
  error?: string;
};

export function CredentialField({
  id,
  value,
  onChange,
  placeholder,
  required = false,
  secret = true,
  showCopy = true,
  autoFocus = false,
  copyLabel,
  copiedLabel,
  showLabel,
  hideLabel,
  error,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value.trim()) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toastManager.add({
        title: copiedLabel,
        type: "success",
        timeout: 2000,
      });
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="space-y-2">
      <div className="flex items-stretch gap-2">
        <Input
          id={id}
          type={secret && !visible ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-mono text-sm"
          dir="ltr"
          required={required}
          autoFocus={autoFocus}
          aria-invalid={!!error}
        />
        {showCopy ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            disabled={!value.trim()}
            aria-label={copyLabel}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        ) : null}
        {secret ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? hideLabel : showLabel}
          >
            {visible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

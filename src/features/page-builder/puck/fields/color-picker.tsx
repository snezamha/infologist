"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CustomFieldRender } from "@puckeditor/core";
import { useTranslations } from "next-intl";

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function normalizeHex(input: string): string {
  let hex = input.trim();
  if (!hex.startsWith("#")) hex = "#" + hex;
  if (hex.length === 4) {
    hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex.slice(0, 7).toLowerCase();
}

export const ColorPickerField: CustomFieldRender<string> = ({
  value,
  onChange,
  readOnly,
}) => {
  const t = useTranslations("pageBuilder.builder");
  const source = value || "#000000";
  const [editing, setEditing] = useState({ source, text: source });
  const text = editing.source === source ? editing.text : source;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  const currentColor = isValidHex(text) ? text : value || "#000000";

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          type="button"
          aria-label={t("chooseColor")}
          aria-expanded={open}
          disabled={readOnly}
          onClick={() => !readOnly && setOpen((o) => !o)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "1px solid var(--puck-color-grey-09, #e5e7eb)",
            backgroundColor: currentColor,
            cursor: readOnly ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          dir="ltr"
          aria-label={t("colorValue")}
          value={text}
          disabled={readOnly}
          onChange={(e) => {
            setEditing({ source, text: e.target.value });
            const norm = normalizeHex(e.target.value);
            if (isValidHex(norm)) onChange(norm);
          }}
          onBlur={() => {
            const norm = normalizeHex(text);
            const next = isValidHex(norm) ? norm : currentColor;
            setEditing({ source: next, text: next });
          }}
          style={{
            flex: 1,
            fontSize: 12,
            fontFamily: "monospace",
            border: "1px solid var(--puck-color-grey-09, #e5e7eb)",
            borderRadius: 6,
            padding: "4px 8px",
            background: "var(--puck-color-white, #fff)",
            color: "var(--puck-color-black, #000)",
            outline: "none",
          }}
          placeholder="#000000"
          maxLength={7}
        />
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            insetInlineStart: 0,
            zIndex: 9999,
            background: "var(--puck-color-white, #fff)",
            border: "1px solid var(--puck-color-grey-09, #e5e7eb)",
            borderRadius: 8,
            padding: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <input
            type="color"
            aria-label={t("chooseColor")}
            value={currentColor}
            onChange={(e) => {
              setEditing({ source: e.target.value, text: e.target.value });
              onChange(e.target.value);
            }}
            style={{
              width: 180,
              height: 120,
              border: "none",
              cursor: "pointer",
              borderRadius: 4,
            }}
          />
        </div>
      )}
    </div>
  );
};

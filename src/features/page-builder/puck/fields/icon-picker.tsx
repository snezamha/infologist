"use client";

import {
  createElement,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import type { CustomFieldRender } from "@puckeditor/core";
import { useTranslations } from "next-intl";

import {
  getBuilderIcon,
  iconNames,
} from "@/features/page-builder/puck/icon-registry";

export const IconPickerField: CustomFieldRender<string> = ({
  value,
  onChange,
  readOnly,
}) => {
  const t = useTranslations("pageBuilder.builder");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      iconNames.filter((name) =>
        name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
      setOpen(false);
      setQuery("");
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  const CurrentIcon = value ? getBuilderIcon(value) : null;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={readOnly}
        onClick={() => !readOnly && setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "6px 10px",
          border: "1px solid var(--puck-color-grey-09, #e5e7eb)",
          borderRadius: 6,
          background: "var(--puck-color-white, #fff)",
          color: "var(--puck-color-black, #000)",
          cursor: readOnly ? "not-allowed" : "pointer",
          fontSize: 13,
          textAlign: "start",
        }}
      >
        {CurrentIcon ? (
          createElement(CurrentIcon, { size: 16, strokeWidth: 1.5 })
        ) : (
          <span style={{ width: 16, height: 16, display: "inline-block" }} />
        )}
        <span style={{ flex: 1 }}>{value || t("selectIcon")}</span>
        <span
          style={{ fontSize: 10, color: "var(--puck-color-grey-06, #6b7280)" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("selectIcon")}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            insetInline: 0,
            zIndex: 9999,
            background: "var(--puck-color-white, #fff)",
            border: "1px solid var(--puck-color-grey-09, #e5e7eb)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "8px 8px 4px" }}>
            <input
              ref={searchRef}
              type="text"
              aria-label={t("searchIcons")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchIcons")}
              style={{
                width: "100%",
                padding: "5px 8px",
                fontSize: 12,
                border: "1px solid var(--puck-color-grey-09, #e5e7eb)",
                borderRadius: 5,
                background: "var(--puck-color-white, #fff)",
                color: "var(--puck-color-black, #000)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 2,
              padding: "4px 8px 8px",
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {filtered.map((name) => {
              const Icon = getBuilderIcon(name);
              if (!Icon) return null;
              const isSelected = value === name;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                    setQuery("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 6,
                    borderRadius: 5,
                    border: "none",
                    cursor: "pointer",
                    background: isSelected
                      ? "var(--puck-color-azure-05, #4d8fc9)"
                      : "transparent",
                    color: isSelected
                      ? "#fff"
                      : "var(--puck-color-black, #000)",
                  }}
                >
                  <Icon size={16} strokeWidth={1.5} />
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: 16,
                  fontSize: 12,
                  color: "var(--puck-color-grey-06, #6b7280)",
                }}
              >
                {t("noIcons")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

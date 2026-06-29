"use client";

import type { CustomFieldRender } from "@puckeditor/core";

interface GapSliderField {
  type: "custom";
  min?: number;
  max?: number;
  label?: string;
  render: CustomFieldRender<number>;
}

export const GapSliderField: CustomFieldRender<number> = ({
  field,
  id,
  value,
  onChange,
  readOnly,
}) => {
  const f = field as GapSliderField;
  const min = f.min ?? 0;
  const max = f.max ?? 96;
  const num = typeof value === "number" ? value : 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        id={id}
        aria-label={f.label}
        type="range"
        min={min}
        max={max}
        step={1}
        value={num}
        disabled={readOnly}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ flex: 1, accentColor: "var(--puck-color-azure-05, #4d8fc9)" }}
      />
      <span
        style={{
          fontSize: 11,
          fontFamily: "monospace",
          color: "var(--puck-color-grey-06, #6b7280)",
          minWidth: 40,
          textAlign: "right",
        }}
      >
        {num}px
      </span>
    </div>
  );
};

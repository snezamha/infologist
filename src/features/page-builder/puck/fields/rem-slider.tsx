"use client";

import type { CustomFieldRender } from "@puckeditor/core";

interface RemSliderField {
  type: "custom";
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  render: CustomFieldRender<number>;
}

export const RemSliderField: CustomFieldRender<number> = ({
  field,
  id,
  value,
  onChange,
  readOnly,
}) => {
  const f = field as RemSliderField;
  const min = f.min ?? 0.5;
  const max = f.max ?? 4;
  const step = f.step ?? 0.125;
  const num = typeof value === "number" ? value : min;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        id={id}
        aria-label={f.label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={num}
        disabled={readOnly}
        onChange={(e) => onChange(parseFloat(e.target.value))}
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
        {num}rem
      </span>
    </div>
  );
};

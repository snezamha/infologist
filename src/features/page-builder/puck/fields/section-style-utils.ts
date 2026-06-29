import type { CSSProperties } from "react";

import type { SectionStyleValue } from "./section-style";

export function applySectionStyle(
  sectionStyle: SectionStyleValue | undefined,
): CSSProperties {
  if (!sectionStyle) return {};
  const {
    backgroundColor,
    paddingVertical,
    paddingHorizontal,
    maxWidth,
    alignItems,
    justifyContent,
    minHeight,
  } = sectionStyle;
  return {
    ...(backgroundColor ? { backgroundColor } : {}),
    ...(paddingVertical
      ? { paddingTop: paddingVertical, paddingBottom: paddingVertical }
      : {}),
    ...(paddingHorizontal ? { paddingInline: paddingHorizontal } : {}),
    ...(maxWidth && maxWidth !== "none"
      ? { maxWidth, marginInline: "auto" }
      : {}),
    ...(alignItems && alignItems !== "stretch"
      ? { display: "flex", flexDirection: "column", alignItems }
      : {}),
    ...(justifyContent && justifyContent !== "normal"
      ? { display: "flex", flexDirection: "column", justifyContent }
      : {}),
    ...(minHeight ? { minHeight } : {}),
  };
}

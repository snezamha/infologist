export type ResponsiveColumns = {
  mobile: "1" | "2";
  tablet: "1" | "2" | "3" | "4";
  desktop: "1" | "2" | "3" | "4";
};

export type ResponsiveScale = {
  mobile: "none" | "sm" | "md" | "lg" | "xl";
  tablet: "none" | "sm" | "md" | "lg" | "xl";
  desktop: "none" | "sm" | "md" | "lg" | "xl";
};

const defaultResponsiveColumns: ResponsiveColumns = {
  mobile: "1",
  tablet: "2",
  desktop: "3",
};

const mobileColumns: Record<ResponsiveColumns["mobile"], string> = {
  "1": "grid-cols-1",
  "2": "grid-cols-2",
};

const tabletColumns: Record<ResponsiveColumns["tablet"], string> = {
  "1": "md:grid-cols-1",
  "2": "md:grid-cols-2",
  "3": "md:grid-cols-3",
  "4": "md:grid-cols-4",
};

const desktopColumns: Record<ResponsiveColumns["desktop"], string> = {
  "1": "lg:grid-cols-1",
  "2": "lg:grid-cols-2",
  "3": "lg:grid-cols-3",
  "4": "lg:grid-cols-4",
};

export function getResponsiveColumnsClass(value?: Partial<ResponsiveColumns>) {
  const columns = { ...defaultResponsiveColumns, ...value };
  return [
    mobileColumns[columns.mobile],
    tabletColumns[columns.tablet],
    desktopColumns[columns.desktop],
  ].join(" ");
}

export const responsiveColumnsField = {
  type: "object" as const,
  objectFields: {
    mobile: {
      type: "radio" as const,
      options: [
        { label: "1", value: "1" },
        { label: "2", value: "2" },
      ],
    },
    tablet: {
      type: "radio" as const,
      options: [
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" },
      ],
    },
    desktop: {
      type: "radio" as const,
      options: [
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" },
      ],
    },
  },
};

const scaleOptions = [
  { label: "None", value: "none" },
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
  { label: "X-Large", value: "xl" },
] as const;

export const responsiveScaleField = {
  type: "object" as const,
  objectFields: {
    mobile: { type: "select" as const, options: scaleOptions },
    tablet: { type: "select" as const, options: scaleOptions },
    desktop: { type: "select" as const, options: scaleOptions },
  },
};

const mobilePadding: Record<ResponsiveScale["mobile"], string> = {
  none: "py-0",
  sm: "py-6",
  md: "py-12",
  lg: "py-20",
  xl: "py-32",
};
const tabletPadding: Record<ResponsiveScale["tablet"], string> = {
  none: "md:py-0",
  sm: "md:py-6",
  md: "md:py-12",
  lg: "md:py-20",
  xl: "md:py-32",
};
const desktopPadding: Record<ResponsiveScale["desktop"], string> = {
  none: "lg:py-0",
  sm: "lg:py-6",
  md: "lg:py-12",
  lg: "lg:py-20",
  xl: "lg:py-32",
};

export function getResponsivePaddingClass(value: ResponsiveScale) {
  return [
    mobilePadding[value.mobile],
    tabletPadding[value.tablet],
    desktopPadding[value.desktop],
  ].join(" ");
}

const mobileText: Record<ResponsiveScale["mobile"], string> = {
  none: "text-base",
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};
const tabletText: Record<ResponsiveScale["tablet"], string> = {
  none: "md:text-base",
  sm: "md:text-xl",
  md: "md:text-2xl",
  lg: "md:text-3xl",
  xl: "md:text-4xl",
};
const desktopText: Record<ResponsiveScale["desktop"], string> = {
  none: "lg:text-base",
  sm: "lg:text-xl",
  md: "lg:text-2xl",
  lg: "lg:text-3xl",
  xl: "lg:text-5xl",
};

export function getResponsiveTextClass(value: ResponsiveScale) {
  return [
    mobileText[value.mobile],
    tabletText[value.tablet],
    desktopText[value.desktop],
  ].join(" ");
}

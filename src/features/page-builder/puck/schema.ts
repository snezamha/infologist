import { z } from "zod";

import {
  sanitizeCssColor,
  sanitizeHtmlId,
  sanitizeLinkUrl,
  sanitizeMediaUrl,
  sanitizeRichText,
} from "@/features/page-builder/puck/safety";

const MAX_COMPONENTS = 2_000;
const MAX_DEPTH = 12;
const MAX_SLOT_COMPONENTS = 500;
const text = z.string().max(20_000);
const shortText = z.string().max(500);
const link = z.string().max(2_000).transform(sanitizeLinkUrl);
const media = z.string().max(2_000).transform(sanitizeMediaUrl);
const richText = z.string().max(100_000).transform(sanitizeRichText);
const color = z.string().max(64).transform(sanitizeCssColor);
const htmlId = z.string().max(100).transform(sanitizeHtmlId);
const componentId = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9_:.-]+$/);
const booleanValue = z.preprocess(
  (value) => (value === "true" ? true : value === "false" ? false : value),
  z.boolean(),
);
const slot = z.array(z.unknown()).max(MAX_SLOT_COMPONENTS).optional();
const responsiveColumns = z
  .object({
    mobile: z.enum(["1", "2"]),
    tablet: z.enum(["1", "2", "3", "4"]),
    desktop: z.enum(["1", "2", "3", "4"]),
  })
  .partial()
  .optional();
const responsiveScale = z
  .object({
    mobile: z.enum(["none", "sm", "md", "lg", "xl"]),
    tablet: z.enum(["none", "sm", "md", "lg", "xl"]),
    desktop: z.enum(["none", "sm", "md", "lg", "xl"]),
  })
  .optional();

const sectionStyle = z
  .object({
    backgroundColor: color,
    paddingVertical: z.number().min(0).max(120),
    paddingHorizontal: z.number().min(0).max(120),
    maxWidth: z.enum([
      "none",
      "80rem",
      "72rem",
      "64rem",
      "56rem",
      "42rem",
      "36rem",
    ]),
    alignItems: z.enum(["stretch", "flex-start", "center", "flex-end"]),
    justifyContent: z.enum([
      "normal",
      "flex-start",
      "center",
      "flex-end",
      "space-between",
    ]),
    minHeight: z.string().max(32),
  })
  .partial()
  .optional();

const componentPropsSchemas = {
  Columns: z
    .object({
      count: z.union([z.literal(2), z.literal(3), z.literal(4)]),
      distribution: z.enum(["equal", "wide-left", "wide-right"]),
      gap: z.enum(["0", "sm", "md", "lg"]),
      responsiveColumns,
      col1: slot,
      col2: slot,
      col3: slot,
      col4: slot,
    })
    .partial(),
  Section: z
    .object({
      background: z.enum(["none", "subtle", "card", "primary"]),
      paddingY: z.enum(["none", "sm", "md", "lg", "xl"]),
      responsivePaddingY: responsiveScale,
      maxWidth: z.enum(["full", "content", "narrow"]),
      anchorId: htmlId,
      ariaLabel: shortText,
      sectionStyle,
      content: slot,
    })
    .partial(),
  VerticalSpace: z
    .object({ size: z.enum(["xs", "sm", "md", "lg", "xl", "2xl"]) })
    .partial(),
  FlexContainer: z
    .object({
      direction: z.enum(["row", "column"]),
      mobileDirection: z.enum(["row", "column"]),
      wrap: z.enum(["wrap", "nowrap"]),
      align: z.enum([
        "flex-start",
        "center",
        "flex-end",
        "stretch",
        "baseline",
      ]),
      justify: z.enum([
        "flex-start",
        "center",
        "flex-end",
        "space-between",
        "space-around",
        "space-evenly",
      ]),
      gap: z.enum(["0", "sm", "md", "lg"]),
      content: slot,
    })
    .partial(),
  Heading: z
    .object({
      text: shortText,
      level: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]),
      size: z.enum(["sm", "md", "lg", "xl", "2xl"]),
      responsiveSize: responsiveScale,
      align: z.enum(["start", "center", "end"]),
      color: z.enum(["default", "muted", "primary"]),
      anchorId: htmlId,
    })
    .partial(),
  RichText: z.object({ content: richText }).partial(),
  Blockquote: z
    .object({ text, author: shortText, source: shortText })
    .partial(),
  List: z
    .object({
      type: z.enum(["unordered", "ordered"]),
      items: z.array(z.object({ text: shortText })).max(100),
    })
    .partial(),
  CodeBlock: z.object({ code: text, language: shortText }).partial(),
  Image: z
    .object({
      src: media,
      alt: shortText,
      caption: shortText,
      href: link,
      target: z.enum(["_self", "_blank"]),
      aspectRatio: z.enum(["auto", "16/9", "4/3", "1/1", "3/2", "2/3"]),
      objectPosition: z.enum(["center", "top", "bottom", "start", "end"]),
      rounded: z.enum(["none", "sm", "md", "lg", "full"]),
      shadow: z.enum(["none", "sm", "md", "lg"]),
      priority: booleanValue,
    })
    .partial(),
  Video: z
    .object({
      url: media,
      title: shortText,
      aspectRatio: z.enum(["16/9", "4/3", "1/1"]),
    })
    .partial(),
  Icon: z
    .object({
      icon: shortText,
      size: z.number().min(0.75).max(6),
      color,
      align: z.enum(["flex-start", "center", "flex-end"]),
    })
    .partial(),
  Card: z
    .object({
      title: shortText,
      description: text,
      imageSrc: media,
      imageAlt: shortText,
      buttonLabel: shortText,
      buttonHref: link,
      buttonTarget: z.enum(["_self", "_blank"]),
      variant: z.enum(["default", "outline", "ghost", "elevated"]),
    })
    .partial(),
  Stats: z
    .object({
      items: z
        .array(
          z.object({
            value: shortText,
            label: shortText,
            description: shortText,
          }),
        )
        .max(50),
      columns: z.enum(["2", "3", "4"]),
      responsiveColumns,
      align: z.enum(["start", "center"]),
    })
    .partial(),
  Accordion: z
    .object({
      items: z.array(z.object({ question: shortText, answer: text })).max(100),
      separated: z.enum(["bordered", "separated"]),
      singleOpen: booleanValue,
    })
    .partial(),
  Table: z
    .object({
      caption: shortText,
      headers: z.array(z.object({ label: shortText })).max(30),
      rows: z.array(z.object({ cells: text })).max(500),
      striped: booleanValue,
    })
    .partial(),
  ButtonLink: z
    .object({
      label: shortText,
      href: link,
      icon: shortText,
      variant: z.enum([
        "primary",
        "secondary",
        "outline",
        "ghost",
        "destructive",
      ]),
      size: z.enum(["sm", "md", "lg", "xl"]),
      target: z.enum(["_self", "_blank"]),
      stackSpacing: booleanValue,
      fullWidth: booleanValue,
    })
    .partial(),
  ButtonGroup: z
    .object({
      buttons: z
        .array(
          z.object({
            label: shortText,
            href: link,
            icon: shortText,
            variant: z.enum(["primary", "secondary", "outline", "ghost"]),
            target: z.enum(["_self", "_blank"]),
          }),
        )
        .max(20),
      align: z.enum(["start", "center", "end"]),
      gap: z.enum(["gap-2", "gap-3", "gap-4"]),
    })
    .partial(),
  Badge: z
    .object({
      text: shortText,
      variant: z.enum([
        "default",
        "secondary",
        "muted",
        "success",
        "warning",
        "destructive",
      ]),
    })
    .partial(),
  Separator: z
    .object({
      label: shortText,
      style: z.enum(["solid", "dashed", "dotted"]),
      spacing: z.enum(["sm", "md", "lg"]),
    })
    .partial(),
  Hero: z
    .object({
      eyebrow: shortText,
      title: shortText,
      description: text,
      primaryLabel: shortText,
      primaryHref: link,
      secondaryLabel: shortText,
      secondaryHref: link,
      imageSrc: media,
      imageAlt: shortText,
      align: z.enum(["start", "center"]),
    })
    .partial(),
  Gallery: z
    .object({
      images: z
        .array(z.object({ src: media, alt: shortText, caption: shortText }))
        .max(100),
      responsiveColumns,
    })
    .partial(),
  Testimonials: z
    .object({
      items: z
        .array(z.object({ quote: text, name: shortText, role: shortText }))
        .max(50),
      responsiveColumns,
    })
    .partial(),
  LogoCloud: z
    .object({
      title: shortText,
      logos: z.array(z.object({ src: media, alt: shortText })).max(100),
    })
    .partial(),
  ContactCta: z
    .object({
      title: shortText,
      description: text,
      email: z.string().trim().max(320),
      buttonLabel: shortText,
    })
    .partial(),
  ContactForm: z
    .object({
      title: shortText,
      description: text,
      nameLabel: shortText,
      emailLabel: shortText,
      messageLabel: shortText,
      buttonLabel: shortText,
      actionUrl: link,
    })
    .partial(),
} as const;

const componentTypes = Object.keys(componentPropsSchemas) as [
  keyof typeof componentPropsSchemas,
  ...(keyof typeof componentPropsSchemas)[],
];

const builderComponentSchema = z
  .object({
    type: z.enum(componentTypes),
    props: z.record(z.string(), z.unknown()),
  })
  .transform((component, context) => {
    const idResult = componentId.safeParse(component.props.id);
    const result = componentPropsSchemas[component.type].safeParse(
      component.props,
    );
    if (!idResult.success) {
      context.addIssue({
        code: "custom",
        message: `${component.type}: invalid component id`,
        path: ["props", "id"],
      });
    }
    if (!result.success) {
      for (const issue of result.error.issues) {
        context.addIssue({
          code: "custom",
          message: `${component.type}: ${issue.message}`,
          path: ["props", ...issue.path],
        });
      }
      return z.NEVER;
    }
    if (!idResult.success) return z.NEVER;
    return {
      type: component.type,
      props: { id: idResult.data, ...result.data },
    };
  });

export const builderDataSchema = z
  .object({
    root: z
      .object({
        props: z.object({ title: shortText.optional() }).optional(),
      })
      .optional(),
    content: z.array(builderComponentSchema).max(1_000),
  })
  .transform((data) => {
    const state = { count: data.content.length };
    return {
      ...data,
      content: data.content.map((component) => ({
        ...component,
        props: sanitizeNestedValue(component.props, 0, state) as Record<
          string,
          unknown
        >,
      })),
    };
  });

function sanitizeNestedValue(
  value: unknown,
  depth = 0,
  state = { count: 0 },
): unknown {
  if (depth >= MAX_DEPTH || state.count >= MAX_COMPONENTS) return null;
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeNestedValue(item, depth + 1, state))
      .filter((item) => item !== null);
  }
  if (!value || typeof value !== "object") return value;

  const record = value as Record<string, unknown>;
  if (typeof record.type === "string" && record.props) {
    if (!(record.type in componentPropsSchemas)) return null;
    const parsed = builderComponentSchema.safeParse(record);
    if (!parsed.success) return null;
    state.count += 1;
    return {
      type: parsed.data.type,
      props: sanitizeNestedValue(parsed.data.props, depth + 1, state),
    };
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, nested]) => [
      key,
      sanitizeNestedValue(nested, depth + 1, state),
    ]),
  );
}

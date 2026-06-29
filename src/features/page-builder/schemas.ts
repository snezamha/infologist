import { z } from "zod";

import {
  latinSlugPattern,
  persianSlugPattern,
} from "@/features/page-builder/slug";
import { builderDataSchema } from "@/features/page-builder/puck/schema";
import { pageThemeSchema } from "@/features/page-builder/theme";

const optionalAbsoluteUrl = z
  .string()
  .trim()
  .max(2_000)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  });

const pageStatusSchema = z.enum(["draft", "published"]);

export const pageStatuses = pageStatusSchema.options;

export type PageStatus = z.infer<typeof pageStatusSchema>;

export type PageLocale = "en" | "fa" | "de";

const translationSchema = z.object({
  title: z.string().trim().max(200),
  excerpt: z.string().trim().max(500),
  builderData: builderDataSchema.nullable(),
  seoTitle: z.string().trim().max(200),
  seoDescription: z.string().trim().max(500),
  navigationTitle: z.string().trim().max(100),
  ogImage: optionalAbsoluteUrl,
  canonicalUrl: optionalAbsoluteUrl,
  enabled: z.boolean(),
});

const slugSchema = z.string().trim().min(1).max(120).regex(latinSlugPattern);

const optionalPersianSlugSchema = z
  .string()
  .trim()
  .max(120)
  .regex(persianSlugPattern)
  .or(z.literal(""));

const optionalLatinSlugSchema = z
  .string()
  .trim()
  .max(120)
  .regex(latinSlugPattern)
  .or(z.literal(""));

const createTitleSchema = z.string().trim().min(1).max(200);
const persianSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(persianSlugPattern);

export const pageCreateSchema = z.object({
  status: pageStatusSchema.default("draft"),
  translations: z.object({
    en: z.object({ title: createTitleSchema, slug: slugSchema }),
    fa: z
      .object({ title: createTitleSchema, slug: persianSlugSchema })
      .optional(),
    de: z.object({ title: createTitleSchema, slug: slugSchema }).optional(),
  }),
});

export const pageFormSchema = z.object({
  slugEn: slugSchema,
  slugFa: optionalPersianSlugSchema,
  slugDe: optionalLatinSlugSchema,
  status: pageStatusSchema,
  translations: z.object({
    en: translationSchema.extend({
      title: z.string().trim().min(1).max(200),
    }),
    fa: translationSchema,
    de: translationSchema,
  }),
  noIndex: z.boolean(),
  scheduledAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    .nullable(),
  isHomepage: z.boolean().default(false),
});

export const pageBuilderDataUpdateSchema = z.object({
  en: builderDataSchema.nullable(),
  fa: builderDataSchema.nullable(),
  de: builderDataSchema.nullable(),
});

export const pageThemeUpdateSchema = pageThemeSchema.nullable();

export const pageListQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  query: z.string().trim().max(200).default(""),
  status: z.union([pageStatusSchema, z.literal("all")]).default("all"),
});

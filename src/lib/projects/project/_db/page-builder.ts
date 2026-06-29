import { randomUUID } from "node:crypto";

import type { Locale } from "@/i18n/config";
import { getProjectSql, type ProjectDbRow } from "./core";
import { ensureProjectPageBuilderTables } from "./feature-schemas";

export type PageLocale = Locale;

type ProjectDbPageTranslation = {
  locale: PageLocale;
  slug: string;
  title: string;
  excerpt: string;
  builderData: unknown;
  seoTitle: string;
  seoDescription: string;
  navigationTitle: string;
  ogImage: string;
  canonicalUrl: string;
  enabled: boolean;
};

export type ProjectDbPage = {
  id: string;
  status: string;
  isHomepage: boolean;
  noIndex: boolean;
  authorId: string;
  themeData: Record<string, unknown> | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  translations: ProjectDbPageTranslation[];
};

export type ProjectPageWriteInput = {
  slugEn: string;
  slugFa: string | null;
  slugDe: string | null;
  status: string;
  isHomepage: boolean;
  noIndex: boolean;
  themeData: Record<string, unknown> | null;
  authorId: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  translations: Record<
    PageLocale,
    Omit<ProjectDbPageTranslation, "locale" | "slug">
  >;
};

type PageListOptions = {
  page: number;
  pageSize: number;
  query: string;
  status: string;
};

function asDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(value as string);
}

function asNullableDate(value: unknown): Date | null {
  return value ? asDate(value) : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function rowToTranslation(row: ProjectDbRow): ProjectDbPageTranslation {
  return {
    locale: row.locale as PageLocale,
    slug: row.slug as string,
    title: (row.title as string | null) ?? "",
    excerpt: (row.excerpt as string | null) ?? "",
    builderData: row.builder_data ?? null,
    seoTitle: (row.seo_title as string | null) ?? "",
    seoDescription: (row.seo_description as string | null) ?? "",
    navigationTitle: (row.navigation_title as string | null) ?? "",
    ogImage: (row.og_image as string | null) ?? "",
    canonicalUrl: (row.canonical_url as string | null) ?? "",
    enabled: row.enabled !== false,
  };
}

function rowToPage(
  row: ProjectDbRow,
  translations: ProjectDbPageTranslation[],
): ProjectDbPage {
  return {
    id: row.id as string,
    status: row.status as string,
    isHomepage: row.is_homepage === true,
    noIndex: row.no_index === true,
    authorId: (row.author_id as string | null) ?? "",
    themeData: asRecord(row.theme_data),
    scheduledAt: asNullableDate(row.scheduled_at),
    publishedAt: asNullableDate(row.published_at),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
    translations,
  };
}

async function getPageRows(databaseUrl: string): Promise<ProjectDbPage[]> {
  await ensureProjectPageBuilderTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  const pageRows = (await sql`
    SELECT *
    FROM pages
    ORDER BY updated_at DESC
  `) as ProjectDbRow[];

  if (pageRows.length === 0) return [];

  const contentRows = (await sql`
    SELECT *
    FROM page_content
    ORDER BY locale ASC
  `) as ProjectDbRow[];
  const translationsByPage = new Map<string, ProjectDbPageTranslation[]>();

  for (const row of contentRows) {
    const pageId = row.page_id as string;
    const translations = translationsByPage.get(pageId) ?? [];
    translations.push(rowToTranslation(row));
    translationsByPage.set(pageId, translations);
  }

  return pageRows.map((row) =>
    rowToPage(row, translationsByPage.get(row.id as string) ?? []),
  );
}

function pageMatchesQuery(page: ProjectDbPage, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;

  return page.translations.some((translation) =>
    [translation.title, translation.slug, translation.excerpt].some((value) =>
      value.toLocaleLowerCase().includes(normalized),
    ),
  );
}

function slugByLocale(input: ProjectPageWriteInput, locale: PageLocale) {
  if (locale === "en") return input.slugEn;
  if (locale === "fa") return input.slugFa;
  return input.slugDe;
}

export async function listProjectPages(
  databaseUrl: string,
  options: PageListOptions,
): Promise<{ items: ProjectDbPage[]; total: number }> {
  const pages = (await getPageRows(databaseUrl)).filter((page) => {
    const matchesStatus =
      options.status === "all" || page.status === options.status;
    return matchesStatus && pageMatchesQuery(page, options.query);
  });
  const start = Math.max(0, (options.page - 1) * options.pageSize);

  return {
    items: pages.slice(start, start + options.pageSize),
    total: pages.length,
  };
}

export async function getProjectPageById(
  databaseUrl: string,
  pageId: string,
): Promise<ProjectDbPage | null> {
  return (
    (await getPageRows(databaseUrl)).find((page) => page.id === pageId) ?? null
  );
}

export async function getProjectHomepageId(
  databaseUrl: string,
): Promise<string | null> {
  return (
    (await getPageRows(databaseUrl)).find((page) => page.isHomepage)?.id ?? null
  );
}

export async function assertProjectSlugsAvailable(
  databaseUrl: string,
  slugs: { slugEn: string; slugFa: string | null; slugDe: string | null },
  excludePageId?: string,
): Promise<void> {
  await ensureProjectPageBuilderTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);

  for (const [locale, slug] of [
    ["en", slugs.slugEn],
    ["fa", slugs.slugFa],
    ["de", slugs.slugDe],
  ] as const) {
    if (!slug) continue;

    const rows = (await sql`
      SELECT page_id
      FROM page_content
      WHERE locale = ${locale}
        AND slug = ${slug}
      LIMIT 1
    `) as ProjectDbRow[];
    const pageId = rows[0]?.page_id;

    if (pageId && pageId !== excludePageId) {
      throw new Error("Slug already exists");
    }
  }
}

async function upsertTranslation(
  databaseUrl: string,
  pageId: string,
  locale: PageLocale,
  slug: string,
  input: Omit<ProjectDbPageTranslation, "locale" | "slug">,
): Promise<void> {
  const sql = getProjectSql(databaseUrl);
  await sql`
    INSERT INTO page_content (
      id, page_id, locale, slug, title, excerpt, builder_data,
      seo_title, seo_description, navigation_title, og_image,
      canonical_url, enabled, created_at, updated_at
    ) VALUES (
      ${randomUUID()}, ${pageId}, ${locale}, ${slug}, ${input.title},
      ${input.excerpt}, ${JSON.stringify(input.builderData)}::jsonb,
      ${input.seoTitle}, ${input.seoDescription}, ${input.navigationTitle},
      ${input.ogImage}, ${input.canonicalUrl}, ${input.enabled}, NOW(), NOW()
    )
    ON CONFLICT (page_id, locale) DO UPDATE
    SET slug = EXCLUDED.slug,
        title = EXCLUDED.title,
        excerpt = EXCLUDED.excerpt,
        builder_data = EXCLUDED.builder_data,
        seo_title = EXCLUDED.seo_title,
        seo_description = EXCLUDED.seo_description,
        navigation_title = EXCLUDED.navigation_title,
        og_image = EXCLUDED.og_image,
        canonical_url = EXCLUDED.canonical_url,
        enabled = EXCLUDED.enabled,
        updated_at = NOW()
  `;
}

export async function createProjectPage(
  databaseUrl: string,
  input: ProjectPageWriteInput,
): Promise<ProjectDbPage> {
  await ensureProjectPageBuilderTables(databaseUrl);
  await assertProjectSlugsAvailable(databaseUrl, input);
  const sql = getProjectSql(databaseUrl);
  const pageId = randomUUID();

  await sql`
    INSERT INTO pages (
      id, status, is_homepage, no_index, author_id, theme_data,
      scheduled_at, published_at, created_at, updated_at
    ) VALUES (
      ${pageId}, ${input.status}, ${input.isHomepage}, ${input.noIndex},
      ${input.authorId}, ${JSON.stringify(input.themeData)}::jsonb,
      ${input.scheduledAt}, ${input.publishedAt}, NOW(), NOW()
    )
  `;

  for (const locale of ["en", "fa", "de"] as const) {
    const slug = slugByLocale(input, locale);
    if (slug)
      await upsertTranslation(
        databaseUrl,
        pageId,
        locale,
        slug,
        input.translations[locale],
      );
  }

  const page = await getProjectPageById(databaseUrl, pageId);
  if (!page) throw new Error("Failed to create page");
  return page;
}

export async function updateProjectPage(
  databaseUrl: string,
  pageId: string,
  input: ProjectPageWriteInput,
): Promise<ProjectDbPage> {
  await ensureProjectPageBuilderTables(databaseUrl);
  await assertProjectSlugsAvailable(databaseUrl, input, pageId);
  const sql = getProjectSql(databaseUrl);

  await sql`
    UPDATE pages
    SET status = ${input.status},
        is_homepage = ${input.isHomepage},
        no_index = ${input.noIndex},
        author_id = ${input.authorId},
        theme_data = ${JSON.stringify(input.themeData)}::jsonb,
        scheduled_at = ${input.scheduledAt},
        published_at = ${input.publishedAt},
        updated_at = NOW()
    WHERE id = ${pageId}
  `;

  for (const locale of ["en", "fa", "de"] as const) {
    const slug = slugByLocale(input, locale);
    if (slug)
      await upsertTranslation(
        databaseUrl,
        pageId,
        locale,
        slug,
        input.translations[locale],
      );
  }

  const page = await getProjectPageById(databaseUrl, pageId);
  if (!page) throw new Error("Page not found");
  return page;
}

export async function updateProjectPageBuilderData(
  databaseUrl: string,
  pageId: string,
  builderData: Record<PageLocale, unknown>,
): Promise<void> {
  await ensureProjectPageBuilderTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);

  for (const locale of ["en", "fa", "de"] as const) {
    await sql`
      UPDATE page_content
      SET builder_data = ${JSON.stringify(builderData[locale])}::jsonb,
          updated_at = NOW()
      WHERE page_id = ${pageId}
        AND locale = ${locale}
    `;
  }

  await sql`
    UPDATE pages
    SET updated_at = NOW()
    WHERE id = ${pageId}
  `;
}

export async function updateProjectPageTheme(
  databaseUrl: string,
  pageId: string,
  themeData: Record<string, unknown> | null,
): Promise<void> {
  await ensureProjectPageBuilderTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  await sql`
    UPDATE pages
    SET theme_data = ${JSON.stringify(themeData)}::jsonb,
        updated_at = NOW()
    WHERE id = ${pageId}
  `;
}

export async function deleteProjectPage(
  databaseUrl: string,
  pageId: string,
): Promise<void> {
  await ensureProjectPageBuilderTables(databaseUrl);
  const sql = getProjectSql(databaseUrl);
  await sql`
    DELETE FROM pages
    WHERE id = ${pageId}
  `;
}

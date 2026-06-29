"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import type { Locale } from "@/i18n/config";
import { ActionError } from "@/lib/errors/action-error";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getProjectConfig } from "@/lib/projects/project/_config";
import { getPublicProject } from "@/lib/projects/project/public";
import { getPublicProjectSettings } from "@/lib/projects/project/public";
import { getProjectSession } from "@/lib/projects/project/_auth/get-session";
import { getProjectFeatures } from "@/features/_core/lib";
import {
  assertProjectSlugsAvailable,
  createProjectPage,
  deleteProjectPage,
  getProjectHomepageId,
  getProjectPageById,
  getProjectSql,
  listProjectPages,
  listProjectUsers,
  updateProjectPage,
  updateProjectPageBuilderData,
  type ProjectDbPage,
  type ProjectPageWriteInput,
} from "@/lib/projects/project/_db";
import {
  pageBuilderDataUpdateSchema,
  pageCreateSchema,
  pageFormSchema,
  pageListQuerySchema,
  pageThemeUpdateSchema,
  type PageStatus,
} from "@/features/page-builder/schemas";
import { sanitizeSlug } from "@/features/page-builder/slug";
import { serializePuckData } from "@/features/page-builder/puck/data";
import { parseGeneralSettings } from "@/lib/site-settings/general";
import { zonedDateTimeToUtc } from "@/features/page-builder/scheduled-time";

import { mapPageRecord } from "@/features/page-builder/page-record";
import type {
  PageCreateFormData,
  PageFormData,
  PageRecord,
} from "@/features/page-builder/types";

export type PaginatedPages = {
  items: PageRecord[];
  total: number;
  page: number;
  pageSize: number;
};

type ResolvedProject = {
  id: string;
  databaseUrl: string;
  userId: string;
  role: "admin" | "user";
  timezone: string;
};

async function resolveProject(domainId: string): Promise<ResolvedProject> {
  const project = await getPublicProject(domainId);
  if (!project) throw new ActionError("NOT_FOUND", "Project not found");

  const session = await getProjectSession(project.id, domainId);
  if (!session) throw new ActionError("UNAUTHORIZED", "Unauthorized");

  const [config, features, settings] = await Promise.all([
    getProjectConfig(project.id),
    getProjectFeatures(project.id),
    getPublicProjectSettings(project.id),
  ]);

  if (!features.pageBuilder.enabled) {
    throw new ActionError("FORBIDDEN", "Page builder is disabled");
  }

  if (!config.databaseUrl) {
    throw new ActionError("UNAVAILABLE", "Project database not configured");
  }

  return {
    id: project.id,
    databaseUrl: config.databaseUrl,
    userId: session.id,
    role: session.role,
    timezone: parseGeneralSettings(settings.general).timezone,
  };
}

function assertCanManage(project: ResolvedProject, authorId: string) {
  if (project.role === "admin") return;
  if (authorId && authorId === project.userId) return;
  throw new ActionError("FORBIDDEN", "Unauthorized");
}

function normalizeOptionalSlug(value: string, locale: Locale) {
  const sanitized = sanitizeSlug(value, locale);
  return sanitized || null;
}

function normalizePageForm(data: PageFormData, timezone: string) {
  const parsed = pageFormSchema.safeParse({
    ...data,
    slugEn: sanitizeSlug(data.slugEn, "en"),
    slugFa: sanitizeSlug(data.slugFa, "fa"),
    slugDe: sanitizeSlug(data.slugDe, "de"),
  });

  if (!parsed.success) {
    throw new ActionError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Invalid page",
    );
  }

  const scheduledAt = parsed.data.scheduledAt
    ? zonedDateTimeToUtc(parsed.data.scheduledAt, timezone)
    : null;

  return {
    ...parsed.data,
    slugFa: normalizeOptionalSlug(parsed.data.slugFa, "fa"),
    slugDe: normalizeOptionalSlug(parsed.data.slugDe, "de"),
    scheduledAt,
  };
}

function buildWriteInput(
  payload: ReturnType<typeof normalizePageForm>,
  authorId: string,
  publishedAt: Date | null,
  themeData: Record<string, unknown> | null,
  builderData?: Record<Locale, unknown>,
): ProjectPageWriteInput {
  const toTranslation = (locale: Locale) => ({
    title: payload.translations[locale].title,
    excerpt: payload.translations[locale].excerpt,
    builderData: serializePuckData(
      builderData?.[locale] ?? payload.translations[locale].builderData,
    ),
    seoTitle: payload.translations[locale].seoTitle,
    seoDescription: payload.translations[locale].seoDescription,
    navigationTitle: payload.translations[locale].navigationTitle,
    ogImage: payload.translations[locale].ogImage,
    canonicalUrl: payload.translations[locale].canonicalUrl,
    enabled: payload.translations[locale].enabled,
  });

  return {
    slugEn: payload.slugEn,
    slugFa: payload.slugFa,
    slugDe: payload.slugDe,
    status: payload.status,
    isHomepage: payload.isHomepage,
    noIndex: payload.noIndex,
    themeData,
    authorId,
    scheduledAt: payload.scheduledAt,
    publishedAt,
    translations: {
      en: toTranslation("en"),
      fa: toTranslation("fa"),
      de: toTranslation("de"),
    },
  };
}

function revalidateProjectPages(domainId: string, pageId?: string) {
  revalidatePath(`/site/${domainId}/dashboard/page-builder`);
  revalidatePath(`/site/${domainId}`);
  revalidatePath(`/site/${domainId}/[[...path]]`, "page");
  if (pageId) {
    revalidatePath(`/site/${domainId}/dashboard/page-builder/${pageId}/edit`);
    revalidatePath(
      `/site/${domainId}/dashboard/page-builder/${pageId}/builder`,
    );
  }
}

async function recordWithAuthor(
  databaseUrl: string,
  page: ProjectDbPage,
): Promise<PageRecord> {
  let authorName: string | null = null;
  if (page.authorId) {
    const users = await listProjectUsers(databaseUrl);
    authorName = users.find((user) => user.id === page.authorId)?.name ?? null;
  }
  return mapPageRecord(page, authorName);
}

export async function getPages(
  domainId: string,
  options: {
    page?: number;
    pageSize?: number;
    query?: string;
    status?: PageStatus | "all";
  } = {},
): Promise<PaginatedPages> {
  const project = await resolveProject(domainId);

  const parsed = pageListQuerySchema.parse({
    page: options.page ?? 1,
    pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
    query: options.query ?? "",
    status: options.status ?? "all",
  });

  const result = await listProjectPages(project.databaseUrl, {
    page: parsed.page,
    pageSize: parsed.pageSize,
    query: parsed.query,
    status: parsed.status,
  });

  const visible =
    project.role === "admin"
      ? result.items
      : result.items.filter((page) => page.authorId === project.userId);

  const users = await listProjectUsers(project.databaseUrl);
  const nameById = new Map(users.map((user) => [user.id, user.name]));

  return {
    items: visible.map((page) =>
      mapPageRecord(page, nameById.get(page.authorId) ?? null),
    ),
    total: project.role === "admin" ? result.total : visible.length,
    page: parsed.page,
    pageSize: parsed.pageSize,
  };
}

export async function getManagedPageById(domainId: string, pageId: string) {
  const project = await resolveProject(domainId);
  const page = await getProjectPageById(project.databaseUrl, pageId);

  if (!page) throw new ActionError("NOT_FOUND", "Not found");
  assertCanManage(project, page.authorId);

  return recordWithAuthor(project.databaseUrl, page);
}

export async function getManagedHomepagePageId(domainId: string) {
  const project = await resolveProject(domainId);
  return getProjectHomepageId(project.databaseUrl);
}

export async function createPageQuick(
  domainId: string,
  data: PageCreateFormData,
) {
  const project = await resolveProject(domainId);

  const parsed = pageCreateSchema.safeParse({
    status: data.status,
    translations: {
      en: {
        title: data.translations.en.title,
        slug: sanitizeSlug(data.translations.en.slug, "en"),
      },
      ...(data.translations.fa
        ? {
            fa: {
              title: data.translations.fa.title,
              slug: sanitizeSlug(data.translations.fa.slug, "fa"),
            },
          }
        : {}),
      ...(data.translations.de
        ? {
            de: {
              title: data.translations.de.title,
              slug: sanitizeSlug(data.translations.de.slug, "de"),
            },
          }
        : {}),
    },
  });

  if (!parsed.success) {
    throw new ActionError(
      "VALIDATION",
      parsed.error.issues[0]?.message ?? "Invalid page",
    );
  }

  const { translations } = parsed.data;
  const sql = getProjectSql(project.databaseUrl);
  await assertProjectSlugsAvailable(project.databaseUrl, {
    slugEn: translations.en.slug,
    slugFa: translations.fa?.slug ?? null,
    slugDe: translations.de?.slug ?? null,
  });

  const pageId = randomUUID();
  const publishedAt = parsed.data.status === "published" ? new Date() : null;

  await sql`
    INSERT INTO pages (
      id, status, is_homepage, no_index, theme_data, author_id,
      scheduled_at, published_at, created_at, updated_at
    ) VALUES (
      ${pageId}, ${parsed.data.status}, false, false,
      null, ${project.userId},
      null, ${publishedAt}, NOW(), NOW()
    )
  `;

  for (const locale of ["en", "fa", "de"] as const) {
    const translation = translations[locale];
    if (!translation) continue;

    await sql`
      INSERT INTO page_content (
        id, page_id, locale, slug, title, excerpt, builder_data,
        seo_title, seo_description, navigation_title, og_image,
        canonical_url, enabled, created_at, updated_at
      ) VALUES (
        ${randomUUID()}, ${pageId}, ${locale},
        ${translation.slug}, ${translation.title}, ",
        null, '', '', '', '', '', true, NOW(), NOW()
      )
    `;
  }

  revalidateProjectPages(domainId, pageId);

  const page = await getProjectPageById(project.databaseUrl, pageId);
  if (!page) throw new ActionError("NOT_FOUND", "Failed to create page");

  return recordWithAuthor(project.databaseUrl, page);
}

export async function createPage(domainId: string, data: PageFormData) {
  const project = await resolveProject(domainId);
  const payload = normalizePageForm(data, project.timezone);

  await assertSlugs(project.databaseUrl, payload);

  const publishedAt = payload.status === "published" ? new Date() : null;
  const page = await createProjectPage(
    project.databaseUrl,
    buildWriteInput(payload, project.userId, publishedAt, null),
  );

  revalidateProjectPages(domainId, page.id);
  return recordWithAuthor(project.databaseUrl, page);
}

export async function updatePage(
  domainId: string,
  pageId: string,
  data: PageFormData,
) {
  const project = await resolveProject(domainId);
  const current = await getProjectPageById(project.databaseUrl, pageId);
  if (!current) throw new ActionError("NOT_FOUND", "Not found");
  assertCanManage(project, current.authorId);

  const payload = normalizePageForm(data, project.timezone);
  await assertSlugs(project.databaseUrl, payload, pageId);

  const publishedAt =
    payload.status === "published" ? (current.publishedAt ?? new Date()) : null;

  try {
    const page = await updateProjectPage(
      project.databaseUrl,
      pageId,
      buildWriteInput(
        payload,
        current.authorId,
        publishedAt,
        current.themeData,
        {
          en:
            current.translations.find(
              (translation) => translation.locale === "en",
            )?.builderData ?? null,
          fa:
            current.translations.find(
              (translation) => translation.locale === "fa",
            )?.builderData ?? null,
          de:
            current.translations.find(
              (translation) => translation.locale === "de",
            )?.builderData ?? null,
        },
      ),
    );

    revalidateProjectPages(domainId, pageId);
    return recordWithAuthor(project.databaseUrl, page);
  } catch (error) {
    if (isUniqueHomepageConstraintError(error)) {
      throw new ActionError("CONFLICT", "homepageAlreadySet");
    }
    throw error;
  }
}

export async function updatePageBuilderData(
  domainId: string,
  pageId: string,
  builderData: Record<Locale, unknown>,
  themeData?: Record<string, unknown> | null,
) {
  const project = await resolveProject(domainId);
  const current = await getProjectPageById(project.databaseUrl, pageId);
  if (!current) throw new ActionError("NOT_FOUND", "Not found");
  assertCanManage(project, current.authorId);

  const parsedBuilderData = pageBuilderDataUpdateSchema.safeParse(builderData);
  const parsedThemeData = pageThemeUpdateSchema.safeParse(themeData ?? null);

  if (!parsedBuilderData.success || !parsedThemeData.success) {
    throw new ActionError(
      "VALIDATION",
      parsedBuilderData.error?.issues[0]?.message ??
        parsedThemeData.error?.issues[0]?.message ??
        "Invalid page builder data",
    );
  }

  await updateProjectPageBuilderData(project.databaseUrl, pageId, {
    en: serializePuckData(parsedBuilderData.data.en),
    fa: serializePuckData(parsedBuilderData.data.fa),
    de: serializePuckData(parsedBuilderData.data.de),
  });

  if (themeData !== undefined) {
    const { updateProjectPageTheme } =
      await import("@/lib/projects/project/_db");
    await updateProjectPageTheme(
      project.databaseUrl,
      pageId,
      parsedThemeData.data,
    );
  }

  const page = await getProjectPageById(project.databaseUrl, pageId);
  if (!page) throw new ActionError("NOT_FOUND", "Not found");

  revalidateProjectPages(domainId, pageId);
  return recordWithAuthor(project.databaseUrl, page);
}

export async function deletePage(domainId: string, pageId: string) {
  const project = await resolveProject(domainId);
  const current = await getProjectPageById(project.databaseUrl, pageId);
  if (!current) throw new ActionError("NOT_FOUND", "Not found");
  assertCanManage(project, current.authorId);

  await deleteProjectPage(project.databaseUrl, pageId);
  revalidateProjectPages(domainId);
}

async function assertSlugs(
  databaseUrl: string,
  payload: ReturnType<typeof normalizePageForm>,
  excludePageId?: string,
) {
  try {
    await assertProjectSlugsAvailable(
      databaseUrl,
      {
        slugEn: payload.slugEn,
        slugFa: payload.slugFa,
        slugDe: payload.slugDe,
      },
      excludePageId,
    );
  } catch {
    throw new ActionError("CONFLICT", "Slug already exists");
  }
}

function isUniqueHomepageConstraintError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as {
    code?: unknown;
    constraint?: unknown;
  };

  return (
    candidate.code === "23505" &&
    candidate.constraint === "pages_single_homepage_idx"
  );
}

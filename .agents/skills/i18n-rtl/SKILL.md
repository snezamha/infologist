---
name: i18n-rtl
description: Enforces i18n and RTL rules for Next.js apps. Apply automatically when creating or modifying UI, layouts, navigation, forms, or copy.
user-invocable: false
globs:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "src/**/*.css"
---

# i18n & RTL (Next.js)

Apply on every UI change in this stack (Next.js App Router, Tailwind CSS, shadcn/ui).

## Direction

- Set `dir` on `<html>` from locale (`rtl` for fa/ar/he, `ltr` otherwise).
- Use Tailwind logical utilities: `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`.
- Avoid physical direction: `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right` unless intentionally LTR-only (numbers, code, URLs).
- Mirror directional icons (chevrons, arrows) in RTL; do not mirror neutral icons (close, search, settings).

## Copy & i18n

- No hardcoded user-facing strings in components — use the project's i18n layer (e.g. `next-intl`, dictionaries, `t()`).
- Pass locale into links (`Link`, `redirect`, `router.push`).
- Format dates, numbers, and lists with locale-aware APIs.

## Layout

- Prefer flex/grid with `gap` and logical spacing over asymmetric margins.
- For mixed-direction content (emails, phone numbers, code), wrap with `dir="ltr"` and `unicode-bidi: isolate`.
- Test dialogs, dropdowns, sidebars, and tables in both LTR and RTL.

## shadcn / Tailwind

- Use shadcn RTL support when available (`--rtl` / `.dark` patterns from project theme).
- Sidebar, Sheet, and Popover content must respect document direction.

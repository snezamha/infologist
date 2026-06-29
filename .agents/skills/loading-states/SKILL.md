---
name: loading-states
description: Enforces unified loading state patterns. Apply automatically when creating or modifying components that show loading, pending, or fetching states.
user-invocable: false
globs:
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

# Loading States

All loading indicators must follow this pattern. Apply on every component that shows a loading state.

## Section / page loading

Use `SiteSpinnerSection` for any centered spinner inside a card, page, widget, or modal body.
It reads the site's configured spinner from `LoadingSettingsProvider` (already provided in `AppProviders`).

```tsx
import { SiteSpinnerSection } from "@/components/loading/site-spinner";

// with a fixed height container
<SiteSpinnerSection className="h-44" />

// inside a full-page area
<SiteSpinnerSection className="min-h-[60vh]" />
```

Size defaults to `32`. Use `size={24}` for smaller widgets:

```tsx
<SiteSpinnerSection className="h-24" size={24} />
```

## Button / action loading

Use `Loader2` from lucide-react — small, inline, inside a `<Button>`:

```tsx
import { Loader2 } from "lucide-react";

<Button disabled={isPending}>
  {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
  Save
</Button>;
```

## Rules

| Context                          | Component              | Size                                       |
| -------------------------------- | ---------------------- | ------------------------------------------ |
| Centered inside card/page/widget | `SiteSpinnerSection`   | `size={32}` default, `size={24}` for small |
| Inline inside button             | `Loader2 animate-spin` | `h-4 w-4` or smaller                       |

## Never

- Never use `Loader2` with `animate-spin` for section loading.
- Never use `@/components/ui/spinner` — legacy only.
- Never use `@/components/loading/loading-spinner` directly — use `SiteSpinner` or `SiteSpinnerSection`.

```tsx
// ❌ wrong
import { Loader2 } from "lucide-react";
<div className="flex h-44 items-center justify-center">
  <Loader2 className="text-muted-foreground size-8 animate-spin" />
</div>;

// ✅ correct
import { SiteSpinnerSection } from "@/components/loading/site-spinner";
<SiteSpinnerSection className="h-44" />;
```

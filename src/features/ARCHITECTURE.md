# Features & Modules Architecture

This document explains the two-scope design of the platform's extensibility system.

## Scopes

### Global Scope (Build-Time)

**Module code** lives in `src/features/modules/<key>/` and is compiled into the Next.js bundle.

- **Module catalog**: A `module.json` file in each module directory declares identity (key, version, title), database table names, and dependencies.
- **Server configuration**: Each module exports a `_server.tsx` file that implements the database migration/cleanup logic and declares any routes.
- **Build-time indexing**: `scripts/modules/sync-module-paths.mjs` generates static module registries before dev/build so modules are baked into the bundle without webpack-only discovery APIs.
- **Constraint**: Adding or removing a module code requires editing `module.json`, committing, and redeploying the entire platform. Module code is not writable at runtime.

**Feature definitions** are hardcoded in `src/features/_core/registry.ts` (e.g., mediaManagement, statistics, aiAssistant).

- Each feature declares its database tables, settings schema (Zod), and default values.
- Features cannot be added without a code change.

### Per-Project Scope (Runtime)

**Activation rows** in the main database record which projects have what enabled/installed:

- `ProjectFeature` table: enables/disables platform features per project, stores feature settings.
- `ProjectModule` table: enables/disables installed modules per project, stores module version.

**Database provisioning**: When a feature or module is first enabled for a project:

1. The project's isolated tenant database (`Project.config.databaseUrl`) is fetched.
2. The feature's/module's `migrate()` function is called, creating the necessary tables in that tenant database.
3. A row is inserted into the activation table, marking the feature/module as active.

**On deactivation**: The activation row is marked `enabled: false` (soft delete), but the tenant database tables remain for safety. Global deletion of a module (super-admin only, non-production) also runs the module's `cleanup()` function to drop tenant tables.

## Why Two Systems?

- **Features** = hardcoded platform capabilities available to all projects. They have complex settings and are always audited.
- **Modules** = optional plugin extensions installable per-project, with versioning and migration support. Modules are authored by the platform and compiled at build time.

## Security Note

`installProjectModuleFromPackage()` in `src/features/modules/_actions/index.ts` is currently dormant. It accepts a zip file upload at runtime but does not write it to the source tree — instead it validates and imports data into an existing tenant database.

**Do not wire this to a tenant-facing action without a complete plugin-isolation design.** The current architecture compiles all module code at build time; supporting arbitrary runtime module uploads would require:

1. Code sandboxing (e.g., deno, wasm).
2. Secure storage (not the source tree).
3. Separate execution context per tenant.

Until then, module code is reviewed and deployed by platform admins only.

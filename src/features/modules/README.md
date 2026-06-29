# Project modules

Project modules are source-backed capabilities that can be activated independently for each project. Module code is deployed with the application. Admin dashboard ZIP import and export transfer complete module source archives (code + manifests); project dashboards can separately export/import project-specific module data.

Built-in capabilities live under `src/features` and use `ProjectFeature`. Installable project modules live under `src/features/modules` and use `ProjectModule`.

Public modules live under `src/features/modules`. Private modules live under `.private-modules` or in a private package that exports the `ProjectModulePrivateSource` shape from `src/features/modules/_core/types`. Public and private modules use the same manifest and runtime contract; only the source location differs. The public repository builds against the empty local `@infologist/private-modules` stub. Production builds can set `INFOLOGIST_PRIVATE_MODULES_PACKAGE` to an installed private package name, such as `@infologist/modules-private`, and Vercel will bundle that package instead.

## Create a module

```bash
npm run module:create -- --key my-module --title-en "My module" --title-fa "ماژول من" --title-de "Mein Modul"
```

The generator creates this contract:

```text
my-module/
├── module.json
├── frontend.tsx
├── _server.tsx
├── index.ts
├── db/
│   └── migrations.ts
├── messages/
│   ├── en.json
│   ├── fa.json
│   └── de.json
├── _actions/
└── _components/
```

No manual registry edit is required. Build-time discovery finds `module.json`, `frontend.tsx`, `_server.tsx`, messages and widgets.

## Import

Admin ZIP import uploads source files. If `module.json` has `"isPrivate": true`, files are written to `.private-modules/{key}`. Otherwise files are written to `src/features/modules/{key}`. Import installs declared npm package dependencies before writing source files so the next compile can resolve module imports. Import does not run migrations or activate the module.

## Manifest

Every field is required. Versions follow semantic versioning. Keys and dependencies use lowercase kebab-case.

```json
{
  "key": "my-module",
  "type": "module",
  "version": "1.0.0",
  "title": {
    "en": "My module",
    "fa": "ماژول من",
    "de": "Mein Modul"
  },
  "description": {
    "en": "Project module",
    "fa": "ماژول پروژه",
    "de": "Projektmodul"
  },
  "widget": false,
  "dbTables": ["my_module_items"],
  "dependencies": []
}
```

The catalog rejects duplicate keys, duplicate table ownership, missing dependencies, self-dependencies and dependency cycles during build.

## Lifecycle

- Activation checks dependencies, prevents downgrades, runs pending migrations and records the installed version.
- Activation installs declared package dependencies before recording the module as active.
- Deactivation keeps database tables, data, settings and installed version.
- Deactivation keeps declared package dependencies installed while the module source exists.
- A module cannot be deactivated while an active module depends on it.
- Global source deletion is a development-only super-admin operation and permanently cleans module data.
- Global source deletion removes package dependencies that are no longer required by any active module.

## Routes

The module root is rendered by `frontend.tsx`. Additional paths are declared in `_server.tsx` as ordered route definitions. Each route receives locale, project ID, base path, all remaining URL segments and search parameters.

```tsx
const config: ProjectModuleServerConfig = {
  routes: [
    {
      matches: (segments) => segments.length === 1,
      render: ({ segments }) => <ItemPage id={segments[0]} />,
    },
  ],
};
```

## Data archives

Exports contain exactly `manifest.json` and `module-data.json`. Imports enforce compressed and expanded size limits, manifest/version compatibility, checksums, table ownership, schema compatibility, project authorization and active dependencies. Imports replace module-owned table data inside a database transaction.

## Project boundaries

Every server action and route must authorize the target project with `requireProjectManageAccess` or an equivalent project-site session check. All project database operations use `getProjectConfig(projectId)` and the module must only query tables declared in its manifest.

See [MODULE.md](MODULE.md) for the runtime API and [MODULE_CHECKLIST.md](MODULE_CHECKLIST.md) before shipping.

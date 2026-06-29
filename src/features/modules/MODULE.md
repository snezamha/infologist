# Module runtime API

## `frontend.tsx`

Default-export a `ProjectModuleFrontendComponent`. It receives `locale`, `dir`, `siteName`, `projectPublicId` and `basePath`. User-facing copy belongs in `messages/en.json`, `messages/fa.json` and `messages/de.json` and is loaded under the module key namespace.

## `_server.tsx`

Default-export `ProjectModuleServerConfig`.

- `database.migrate(databaseUrl, installedVersion)` applies forward-only migrations.
- `database.cleanup(databaseUrl)` permanently removes module-owned data and is only used by global deletion.
- `routes` defines ordered matchers for paths below `/modules/{key}`.

## `db/migrations.ts`

Use `runProjectModuleMigrations`. Migration versions must be unique semantic versions. Migration functions must be idempotent because project databases can recover from interrupted operations.

```ts
const migrations = [
  { version: "1.0.0", up: createSchema },
  { version: "1.1.0", up: addStatus },
] as const;
```

The installed version is updated only after every pending migration succeeds.

## Module data

`exportModuleData`, `parseModuleDataSnapshot` and `importModuleData` operate only on tables declared by the manifest. Snapshots include column metadata, rows, source module version and SHA-256 checksum.

## Dependencies

Dependencies are module keys declared in `module.json`. The catalog validates the complete dependency graph at build time. Activation and data import require every dependency to be active. Deactivation is blocked while an active dependent exists.

## Commands

```bash
npm run module:create -- --key my-module
npm run module:delete -- --key my-module
npm run check
npm run build
```

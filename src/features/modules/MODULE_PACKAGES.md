# Module Package Dependencies

## Overview

Each module can declare npm package dependencies that should be automatically installed when the module is activated. Package dependencies stay installed while the module source exists, because inactive modules can still be part of the Next.js compile graph.

## How to Use

### 1. Declare Package Dependencies in `module.json`

Add a `packageDependencies` array to your module's `module.json`:

```json
{
  "key": "my-module",
  "type": "module",
  "version": "1.0.0",
  "title": { "en": "My Module", "fa": "ماژول من", "de": "Mein Modul" },
  "description": { "en": "...", "fa": "...", "de": "..." },
  "widget": true,
  "dbTables": ["my_table"],
  "dependencies": [],
  "packageDependencies": [
    { "name": "package-name", "version": "^1.2.3" },
    { "name": "dev-tool", "version": "^2.0.0", "isDev": true }
  ]
}
```

### 2. Package Dependency Format

Each package dependency must have:

- **`name`** (string, required): The npm package name
- **`version`** (string, required): The semantic version range (e.g., `^1.2.3`, `~2.0.0`, `1.2.3`)
- **`isDev`** (boolean, optional): Set to `true` for dev dependencies, defaults to `false`

### 3. How It Works

**When a module is installed:**

1. Module is activated in the database
2. Database migrations are run
3. Package dependencies are automatically added to `package.json`
4. `npm install` is executed to fetch new packages

**When a module is deactivated:**

1. Dependent modules are checked for conflicts
2. Module is deactivated in the database

**When a module is deleted globally in development:**

1. The module source directory is removed
2. Module records are removed from the database
3. Package dependencies are removed from `package.json` if no remaining active module declares them
4. `npm install` is executed to clean up packages

## Example: PDF Export Module

```json
{
  "key": "pdf-export",
  "type": "module",
  "version": "1.0.0",
  "title": { "en": "PDF Export", "fa": "صادرات PDF", "de": "PDF-Export" },
  "description": {
    "en": "Export documents as PDF",
    "fa": "صادرات اسناد به PDF",
    "de": "Dokumente als PDF exportieren"
  },
  "widget": false,
  "dbTables": ["pdf_exports"],
  "dependencies": [],
  "packageDependencies": [
    { "name": "@react-pdf/renderer", "version": "^4.5.1" },
    { "name": "pdfjs-dist", "version": "^6.0.227" }
  ]
}
```

## Important Notes

1. **Automatic Management**: Do NOT manually remove these packages from `package.json` while the module source exists - they are automatically installed by the module system
2. **Version Conflicts**: If multiple modules depend on the same package with conflicting versions, npm will resolve based on semver rules
3. **Build Impact**: Adding/removing packages requires running `npm install`, so module installation/uninstallation may take longer
4. **Error Handling**: If package installation fails, the module installation will be rolled back with an error message

## Best Practices

1. Keep the list of dependencies minimal
2. Use flexible version ranges (`^` or `~`) to allow patch updates
3. Only include packages that are truly needed for the module to function
4. Prefer existing project dependencies when possible
5. Document why each dependency is needed in a comment or README

## See Also

- [[module_system_architecture]] - Understanding the module system
- [Creating a New Module](./CREATE_MODULE.md) - Step-by-step guide to creating modules

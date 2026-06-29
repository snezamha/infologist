# Module template

Use the maintained generator instead of copying a module directory manually:

```bash
npm run module:create -- --key my-module --title-en "My module" --title-fa "ماژول من" --title-de "Mein Modul"
```

Then implement the generated migration, frontend, messages and optional route definitions. The generated files conform to the current automatic discovery and manifest contracts. See [README.md](README.md) for the architecture and [MODULE_CHECKLIST.md](MODULE_CHECKLIST.md) before shipping.

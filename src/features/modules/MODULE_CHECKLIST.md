# Module shipping checklist

## Contract

- [ ] Manifest has every required field and a new semantic version.
- [ ] Table names are unique to the module and match the migration schema.
- [ ] Dependencies are minimal and accurate.
- [ ] `frontend.tsx` and `_server.tsx` default exports satisfy their shared types.
- [ ] Additional URLs are expressed through ordered route matchers.

## Data and lifecycle

- [ ] Migrations are forward-only and idempotent.
- [ ] Queries are scoped by project and user where applicable.
- [ ] Activation works from a clean database and from the previous version.
- [ ] Deactivation preserves data and reactivation re-enables access.
- [ ] Active dependents prevent dependency deactivation.
- [ ] Export/import round-trips empty and populated data.

## UI

- [ ] All user-facing copy exists in English, Persian and German message files.
- [ ] Layout works in RTL and LTR with logical spacing utilities.
- [ ] Loading indicators follow the shared loading-state components.
- [ ] Forms expose accessible labels, validation and recoverable errors.

## Security and performance

- [ ] Every mutation authorizes access inside the action or route.
- [ ] External input is schema-validated.
- [ ] No module secret or source file is included in data archives.
- [ ] Independent I/O is parallelized and lists are paginated when necessary.

## Verification

- [ ] `npm run format:check`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npx prisma validate`
- [ ] `npm run build`

---
name: clean-refactor
description: Use whenever refactoring, rewriting, cleaning up, improving, or restructuring code. Enforces zero comments in output — no inline, block, JSX, docstring, or TODO comments.
user-invocable: false
---

# Clean Refactor

Apply on every code change, not only explicit refactor requests.

## Rules

1. Never add comments to code you write or edit.
2. Remove decorative comments when touching a file (`{/* Header */}`, `// step 1`, section dividers).
3. Keep only comments required by tooling (`eslint-disable-next-line`, `@ts-expect-error`, `@turbopack` directives).
4. Do not leave empty JSX fragments (`{}`) after removing JSX comments.
5. Prefer self-explanatory names over explanatory comments.

## Triggers

- refactor, rewrite, clean up, restructure, simplify, improve code
- removing comments from the codebase
- any edit where comments could be introduced

## Scope

- TypeScript, TSX, JavaScript, CSS in `src/`
- Skip generated files (`node_modules/`, `.next/`, `prisma/generated/`, build output)

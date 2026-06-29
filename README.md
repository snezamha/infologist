# Authentication Model

Infologist uses two separate authentication systems on purpose:

- The main Infologist dashboard uses `NextAuth` / Auth.js.
- Project sites use Clerk when `clerkPublishableKey` and `clerkSecretKey` are configured for that project.

There is one intentional fallback in project sites:

- If Clerk is unavailable or not configured, `getProjectSession` can still treat the project owner or a `super_admin` from the main Infologist app as an admin session.
- This is mainly for admin access and project handoff flows.

So the rule of thumb is:

- Dashboard auth = Infologist session.
- Project site auth = project-specific Clerk session, with a limited admin fallback when needed.

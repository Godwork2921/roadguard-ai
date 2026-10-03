# Admin Dashboard

Reserved for the administrator web application.

The administrator views currently live in
[`apps/web/authority-dashboard/src/pages/admin/`](../authority-dashboard/src/pages/admin/),
alongside the authority officer and driver views, because the project began as a
single React app.

Splitting them into a standalone package here is scheduled for **Phase 11**. The
move is a package boundary change, not a rewrite: the routes are already
separated under `pages/admin/`, so the work is largely re-pointing imports,
build config, and CI paths.

Do not add new admin features in the shared app after Phase 11 begins, or the
split gets harder to reason about.
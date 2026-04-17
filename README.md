# Dashboard Bugfix Playbook

Small public sample for frontend/dashboard triage work.

It demonstrates a focused delivery pattern:

1. Reproduce likely dashboard failure modes from an HTML snapshot or fixture.
2. Check the DOM/CSS for common breakpoints: duplicate IDs, missing viewport, empty links, unstable chart containers, missing table overflow wrappers, unlabeled icon buttons, and negative letter spacing.
3. Return a short Markdown report with pass/fail checks and fix notes.
4. Keep the handoff easy to review without requiring production credentials.

## Files

- `dashboard_audit.mjs` - dependency-free Node audit script.
- `fixtures/broken-dashboard.html` - intentionally flawed dashboard snapshot.
- `fixtures/fixed-dashboard.html` - corrected dashboard snapshot.
- `test_dashboard_audit.mjs` - Node test coverage for the audit rules.
- `handoff.md` - example handoff note.

## Run

```sh
npm test
npm run audit
```

Or directly:

```sh
node dashboard_audit.mjs fixtures/broken-dashboard.html --output out/broken-report.md
node dashboard_audit.mjs fixtures/fixed-dashboard.html --output out/fixed-report.md
```

## What This Is Good For

- SaaS admin dashboards
- Internal reporting pages
- CRM and ops dashboards
- table-heavy backoffice screens
- frontend QA before handoff
- responsive/layout regressions

## Boundary

This sample works on static HTML snapshots. Real client work may also include browser screenshots, console/network logs, Playwright smoke checks, local repros, and targeted CSS/JS patches.

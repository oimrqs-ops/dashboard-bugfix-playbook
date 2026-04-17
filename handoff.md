# Handoff - Dashboard Bugfix Playbook

## Scope

Audit one dashboard snapshot for common frontend handoff blockers:

- mobile viewport issues
- fixed-width layout problems
- duplicate IDs
- unlabeled icon buttons
- placeholder links
- chart containers without stable sizing
- data tables that can stretch the page
- missing async status feedback

## Validation

```sh
npm test
npm run audit
```

Expected result:

```text
fixed-dashboard.html: 10/10 checks passed
broken-dashboard.html: fails with actionable issues
```

## Client Handoff Format

```text
Input: dashboard URL, HTML snapshot, staging page, or exported source.
Output: issue list, smallest safe fix path, patched files if scope allows, and browser/responsive evidence.
Check: rerunnable script plus screenshot/browser smoke where useful.
Risk: real production data, auth-only charts, or third-party widgets may need guided/staging access.
```

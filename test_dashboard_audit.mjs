import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { auditDashboard, renderMarkdownReport } from "./dashboard_audit.mjs";

test("broken fixture exposes practical dashboard issues", () => {
  const html = fs.readFileSync("fixtures/broken-dashboard.html", "utf8");
  const audit = auditDashboard(html);
  const failedIds = audit.checks.filter((check) => !check.pass).map((check) => check.id);

  assert.ok(failedIds.includes("viewport"));
  assert.ok(failedIds.includes("duplicate-ids"));
  assert.ok(failedIds.includes("icon-buttons"));
  assert.ok(failedIds.includes("table-overflow"));
  assert.ok(failedIds.includes("fixed-body-width"));
});

test("fixed fixture passes the audit", () => {
  const html = fs.readFileSync("fixtures/fixed-dashboard.html", "utf8");
  const audit = auditDashboard(html);

  assert.equal(audit.failed, 0);
  assert.equal(audit.passed, audit.total);
});

test("markdown report includes handoff and check table", () => {
  const html = fs.readFileSync("fixtures/fixed-dashboard.html", "utf8");
  const report = renderMarkdownReport(auditDashboard(html), "fixtures/fixed-dashboard.html");

  assert.match(report, /Dashboard Bugfix Audit/);
  assert.match(report, /Summary:/);
  assert.match(report, /Handoff/);
});

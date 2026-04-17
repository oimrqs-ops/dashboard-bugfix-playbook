#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const inputPath = args[0];
const outputIndex = args.indexOf("--output");
const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : null;

function readHtml(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function auditDashboard(html) {
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((m) => m[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const iconButtons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
  const unlabeledButtons = iconButtons.filter(([, attrs, body]) => {
    const hasAria = /\baria-label=["'][^"']+["']/i.test(attrs);
    const text = body.replace(/<[^>]+>/g, "").trim();
    return !hasAria && !text;
  });
  const emptyLinks = [...html.matchAll(/<a\b([^>]*)>/gi)].filter(([, attrs]) => /\bhref=["'](?:#|javascript:void\(0\)|)["']/i.test(attrs));
  const dashboardTables = [...html.matchAll(/<table\b/gi)].length;
  const tableWrappers = [...html.matchAll(/class=["'][^"']*(?:table-wrap|table-scroll|overflow-x|responsive-table)[^"']*["']/gi)].length;
  const chartBlocks = [...html.matchAll(/class=["'][^"']*(?:chart|graph|sparkline)[^"']*["']/gi)].length;
  const stableChartSizing = /(?:aspect-ratio|min-height|height):\s*(?:[0-9]|clamp|var)/i.test(html);
  const negativeLetterSpacing = /letter-spacing\s*:\s*-/i.test(html);
  const hasViewport = /<meta\s+name=["']viewport["']/i.test(html);
  const hasSkipLink = /href=["']#(?:main|content)["']/i.test(html);
  const hasMain = /<main\b/i.test(html);
  const hasStatusRegion = /role=["']status["']|aria-live=["'](?:polite|assertive)["']/i.test(html);
  const fixedBodyWidth = /body\s*{[^}]*width\s*:\s*[0-9]+px/i.test(html);

  const checks = [
    {
      id: "viewport",
      pass: hasViewport,
      detail: hasViewport ? "viewport meta present" : "missing mobile viewport meta",
      fix: "Add `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`."
    },
    {
      id: "duplicate-ids",
      pass: duplicateIds.length === 0,
      detail: duplicateIds.length ? `duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}` : "no duplicate IDs found",
      fix: "Make each chart, filter, and table target ID unique."
    },
    {
      id: "icon-buttons",
      pass: unlabeledButtons.length === 0,
      detail: unlabeledButtons.length ? `${unlabeledButtons.length} icon/empty button(s) without accessible label` : "buttons have visible text or aria labels",
      fix: "Add visible text or `aria-label` to icon-only controls."
    },
    {
      id: "empty-links",
      pass: emptyLinks.length === 0,
      detail: emptyLinks.length ? `${emptyLinks.length} placeholder link(s)` : "no placeholder links found",
      fix: "Use real destinations or replace placeholder anchors with buttons."
    },
    {
      id: "table-overflow",
      pass: dashboardTables === 0 || tableWrappers >= dashboardTables,
      detail: `${dashboardTables} table(s), ${tableWrappers} responsive wrapper(s)`,
      fix: "Wrap data tables in an overflow container so mobile screens do not stretch."
    },
    {
      id: "chart-sizing",
      pass: chartBlocks === 0 || stableChartSizing,
      detail: chartBlocks ? "chart-like blocks found" : "no chart blocks found",
      fix: "Give charts stable sizing with `min-height`, `height`, or `aspect-ratio`."
    },
    {
      id: "letter-spacing",
      pass: !negativeLetterSpacing,
      detail: negativeLetterSpacing ? "negative letter spacing found" : "no negative letter spacing",
      fix: "Avoid negative letter spacing in dashboards; it hurts dense labels and narrow screens."
    },
    {
      id: "landmarks",
      pass: hasMain && hasSkipLink,
      detail: `${hasMain ? "main landmark" : "missing main landmark"}, ${hasSkipLink ? "skip link" : "missing skip link"}`,
      fix: "Add a skip link and wrap primary content in `<main id=\"main\">`."
    },
    {
      id: "status-region",
      pass: hasStatusRegion,
      detail: hasStatusRegion ? "status/live region present" : "missing status/live region for async dashboard state",
      fix: "Add `role=\"status\"` or `aria-live=\"polite\"` for loading/export/filter feedback."
    },
    {
      id: "fixed-body-width",
      pass: !fixedBodyWidth,
      detail: fixedBodyWidth ? "body has a fixed pixel width" : "body width is not fixed to pixels",
      fix: "Remove fixed body widths; constrain inner content instead."
    }
  ];

  return {
    total: checks.length,
    passed: checks.filter((check) => check.pass).length,
    failed: checks.filter((check) => !check.pass).length,
    checks
  };
}

export function renderMarkdownReport(audit, sourceLabel) {
  const lines = [
    `# Dashboard Bugfix Audit`,
    ``,
    `Source: \`${sourceLabel}\``,
    ``,
    `Summary: ${audit.passed}/${audit.total} checks passed, ${audit.failed} issue(s) need attention.`,
    ``,
    `| Check | Result | Detail | Fix |`,
    `| --- | --- | --- | --- |`
  ];

  for (const check of audit.checks) {
    lines.push(`| \`${check.id}\` | ${check.pass ? "pass" : "fail"} | ${check.detail} | ${check.pass ? "-" : check.fix} |`);
  }

  lines.push(
    ``,
    `## Handoff`,
    ``,
    audit.failed
      ? `Start with failed checks that can create visible bugs or block review: ${audit.checks.filter((check) => !check.pass).map((check) => `\`${check.id}\``).join(", ")}.`
      : `No blocking dashboard hygiene issues found in this snapshot. Validate real data, browser console, network calls, and responsive screenshots before final handoff.`
  );

  return `${lines.join("\n")}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!inputPath) {
    console.error("Usage: node dashboard_audit.mjs <html-file> [--output report.md]");
    process.exit(2);
  }
  const html = readHtml(inputPath);
  const audit = auditDashboard(html);
  const report = renderMarkdownReport(audit, inputPath);
  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, report);
  }
  process.stdout.write(report);
  process.exit(audit.failed ? 1 : 0);
}

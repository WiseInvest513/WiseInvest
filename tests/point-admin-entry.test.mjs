import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

// Render the actual admin components; stub only framework, auth and persistence
// boundaries so these checks never open the configured production database.
function loadComponent(filename, overrides = {}) {
  const compiled = ts.transpileModule(
    readFileSync(new URL(`../app/admin/${filename}`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  const loadedModule = { exports: {} };
  const localRequire = (name) => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name === "next/link") return { default: "a" };
    if (name.startsWith("@/")) throw new Error(`Unexpected project import: ${name}`);
    return require(name);
  };
  new Function("require", "module", "exports", compiled)(
    localRequire,
    loadedModule,
    loadedModule.exports,
  );
  return loadedModule.exports;
}

function loadOverview({ deny = false } = {}) {
  const calls = [];
  let authorized = false;
  const database = Object.fromEntries(
    ["user", "partnerAccount", "vipExchangeRecord", "partner", "auditLog"].map(
      (model, index) => [
        model,
        {
          async count() {
            assert.equal(authorized, true, "authorization must precede database reads");
            calls.push(`count:${model}`);
            return index + 1;
          },
        },
      ],
    ),
  );
  const { default: AdminPage } = loadComponent("page.tsx", {
    "@/app/admin/admin-shell": {
      AdminShell: ({ children }) => createElement("main", null, children),
    },
    "@/lib/identity/current-user": {
      async requireAdminUser() {
        calls.push("authorize");
        if (deny) throw new Error("ADMIN_REQUIRED");
        authorized = true;
        return { role: "ADMIN" };
      },
    },
    "@/lib/identity/dev-preview-data": {
      devPreviewAuditLogs: [],
      devPreviewPartnerAccounts: [],
      devPreviewPartners: [],
      devPreviewUsers: [],
    },
    "@/lib/identity/dev-preview-server": {
      isDevPreviewAdminSession: async () => false,
    },
    "@/lib/prisma": {
      isDatabaseConfigured: () => true,
      getPrisma() {
        assert.equal(authorized, true);
        return database;
      },
    },
  });
  return { AdminPage, calls };
}

test("admin overview exposes a whole-card point entry before statistics", async () => {
  const { AdminPage, calls } = loadOverview();
  const html = renderToStaticMarkup(await AdminPage());
  const entry = html.match(/<a\b[^>]*href="\/admin\/point"[^>]*>[\s\S]*?<\/a>/g);
  assert.equal(entry?.length, 1, "overview should have one dedicated point entry");
  assert.match(entry[0], /<h2[^>]*>点位管理<\/h2>/);
  assert.match(entry[0], /进入管理/);
  assert.match(entry[0], /新建、更新 VIP 点位计划，查看历史记录/);
  assert.equal((entry[0].match(/<a\b/g) || []).length, 1, "no nested links in the card");
  assert.ok(html.indexOf('href="/admin/point"') < html.indexOf('href="/admin/users"'));
  assert.equal(calls[0], "authorize");
  assert.equal(calls.filter((call) => call === "authorize").length, 1);
  assert.equal(calls.filter((call) => call.startsWith("count:")).length, 5);
});

test("admin overview stops before reading data when admin authorization fails", async () => {
  const { AdminPage, calls } = loadOverview({ deny: true });
  await assert.rejects(AdminPage(), /ADMIN_REQUIRED/);
  assert.deepEqual(calls, ["authorize"]);
});

function renderNav(pathname) {
  const { AdminNav } = loadComponent("admin-nav.tsx", {
    "next/navigation": { usePathname: () => pathname },
    "@/lib/utils": { cn: (...classes) => classes.filter(Boolean).join(" ") },
  });
  return renderToStaticMarkup(createElement(AdminNav));
}

test("sidebar places one point link immediately after overview in core management", () => {
  const html = renderNav("/admin");
  const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(links.slice(0, 3), ["/admin", "/admin/point", "/admin/vip"]);
  assert.equal(links.filter((href) => href === "/admin/point").length, 1);
  assert.ok(html.indexOf("核心管理") < html.indexOf('href="/admin/point"'));
  assert.ok(html.indexOf('href="/admin/point"') < html.indexOf("权限与接入"));
});

test("point sidebar entry stays active for its route and nested edit pages", () => {
  for (const pathname of ["/admin/point", "/admin/point/example"]) {
    const html = renderNav(pathname);
    const pointLink = html.match(/<a\b[^>]*href="\/admin\/point"[^>]*>/)?.[0];
    const overviewLink = html.match(/<a\b[^>]*href="\/admin"[^>]*>/)?.[0];
    assert.match(pointLink, /bg-slate-950 text-amber-300/);
    assert.doesNotMatch(overviewLink, /bg-slate-950 text-amber-300/);
  }
});

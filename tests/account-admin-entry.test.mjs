import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { cloneElement, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

// Render the actual page and display helpers, while replacing auth and database
// boundaries. These tests must never connect to the configured database.
function loadModule(filename, overrides = {}) {
  const compiled = ts.transpileModule(
    readFileSync(new URL(`../${filename}`, import.meta.url), "utf8"),
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
    if (name === "@/lib/vip/display" || name === "@/lib/vip/status") {
      return loadModule(`${name.slice(2)}.ts`, overrides);
    }
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

function loadAccount({ role = "USER", tier = "MEMBER", deny = false } = {}) {
  const calls = [];
  const { default: AccountPage } = loadModule("app/account/page.tsx", {
    "@/app/account/sign-out-button": {
      SignOutButton: () => createElement("button", null, "退出登录"),
    },
    "@/components/ui/button": {
      Button: ({ asChild, children, className }) =>
        asChild
          ? cloneElement(children, { className })
          : createElement("button", { className }, children),
    },
    "@/lib/identity/current-user": {
      async requireWiseUser() {
        calls.push("authorize");
        if (deny) throw new Error("LOGIN_REQUIRED");
        return {
          id: "account-entry-test",
          wiseUserId: "YTEST",
          name: "Account entry test",
          email: "account-entry@example.test",
          image: null,
          role,
          membershipTier: tier,
          partnerAccounts: [],
        };
      },
    },
    "@/lib/prisma": {
      isDatabaseConfigured() {
        calls.push("database-config");
        assert.equal(calls[0], "authorize");
        return false;
      },
      getPrisma() {
        throw new Error("Database access is forbidden in this test");
      },
    },
  });
  return { AccountPage, calls };
}

for (const tier of ["MEMBER", "VIP", "VIP_PLUS"]) {
  test(`account ADMIN ${tier} has one admin entry first in the hero actions`, async () => {
    const { AccountPage, calls } = loadAccount({ role: "ADMIN", tier });
    const html = renderToStaticMarkup(await AccountPage());
    const adminLinks = html.match(/<a\b[^>]*href="\/admin"[^>]*>[\s\S]*?<\/a>/g);
    assert.equal(adminLinks?.length, 1, "do not retain a duplicate footer entry");
    assert.match(adminLinks[0], /管理后台/);
    const hero = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/)?.[0];
    assert.ok(hero, "account hero must render");
    const heroLinks = [...hero.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(
      (match) => match[1],
    );
    assert.deepEqual(heroLinks.slice(0, 3), ["/admin", "/account/vip", "/account/settings"]);
    assert.ok(html.indexOf('href="/admin"') < html.indexOf("会员升级路径"));
    assert.deepEqual(calls, ["authorize", "database-config"]);
  });

  test(`account non-admin ${tier} has no admin entry`, async () => {
    const { AccountPage, calls } = loadAccount({ tier });
    const html = renderToStaticMarkup(await AccountPage());
    assert.doesNotMatch(html, /href="\/admin(?:\/|"|\?)/);
    assert.doesNotMatch(html, /管理后台/);
    assert.match(html, /href="\/account\/vip"/);
    assert.match(html, /href="\/account\/settings"/);
    assert.deepEqual(calls, ["authorize", "database-config"]);
  });
}

test("account stops before rendering or data access when login is required", async () => {
  const { AccountPage, calls } = loadAccount({ deny: true });
  await assert.rejects(AccountPage(), /LOGIN_REQUIRED/);
  assert.deepEqual(calls, ["authorize"]);
});

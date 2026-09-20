import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const filename = new URL(
  "../app/admin/point/point-editor.tsx",
  import.meta.url,
);
const source = ts.createSourceFile(
  filename.pathname,
  readFileSync(filename, "utf8"),
  ts.ScriptTarget.ES2022,
  true,
  ts.ScriptKind.TSX,
);
const declaration = (nodes, name) => {
  const node = nodes.find(
    (entry) => ts.isFunctionDeclaration(entry) && entry.name?.text === name,
  );
  assert.ok(node, `Actual editor function ${name} must exist`);
  return node;
};
const editor = declaration(source.statements, "PointEditor");
const actualCode = ts.transpileModule(
  [
    declaration(source.statements, "toChinaInput"),
    declaration(source.statements, "toUtc"),
    declaration(source.statements, "fieldsFor"),
    declaration(editor.body.statements, "save"),
  ]
    .map((node) => node.getText(source))
    .join("\n"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
).outputText;

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

// Execute the actual save handler and formatting helpers. Only React setters,
// fetch and the clock are mocked; no duplicate implementation of save logic.
function harness(fetchResponse) {
  const timers = new Map();
  let sequence = 0;
  const state = {
    Error,
    Date,
    AbortController,
    savingRef: { current: false },
    pendingRequest: { current: null },
    savedState: { current: "" },
    saveUncertain: false,
    range: false,
    plan: null,
    instrument: { symbol: "BTCUSDT", quoteAsset: "USDT" },
    fields: {
      direction: "LONG",
      entryPrice: "100",
      entryLower: "",
      entryUpper: "",
      stopLoss: "90",
      takeProfit: "120",
      rationale: "Reviewed rationale",
      entryCondition: "Reviewed entry",
      invalidationCondition: "Reviewed invalidation",
      publicSummary: "Public summary",
      changeReason: "First draft",
      validFrom: "2026-09-20T10:00",
      validUntil: "2026-09-21T10:00",
    },
    requestCount: 0,
    savedCount: 0,
    deniedCount: 0,
    error: "",
    saving: null,
    conflict: false,
    window: {
      setTimeout(callback) {
        const id = ++sequence;
        timers.set(id, callback);
        return id;
      },
      clearTimeout(id) {
        timers.delete(id);
      },
    },
    async fetch(...args) {
      state.requestCount++;
      return fetchResponse(...args);
    },
    setSaving(value) {
      state.saving = value;
    },
    setError(value) {
      state.error = value;
    },
    setConflict(value) {
      state.conflict = value;
    },
    setSaveUncertain(value) {
      state.saveUncertain = value;
    },
    setFields(value) {
      state.fields = value;
    },
    setRange(value) {
      state.range = value;
    },
    setInstrument(value) {
      state.instrument = value;
    },
    onSaved() {
      state.savedCount++;
    },
    onAccessDenied() {
      state.deniedCount++;
    },
  };
  vm.createContext(state);
  new vm.Script(actualCode).runInContext(state);
  return {
    state,
    save: (action = "draft") => state.save(action),
    expire: () => {
      for (const callback of [...timers.values()]) callback();
    },
    timers,
  };
}

test("admin save: timeout followed by a late JSON body enters uncertain state and blocks retry", async () => {
  const body = deferred();
  const reading = deferred();
  const { state, save, expire, timers } = harness(async () => ({
    ok: true,
    status: 200,
    json() {
      reading.resolve();
      return body.promise;
    },
  }));
  const originalFields = state.fields;
  const pending = save();
  await reading.promise;
  expire();
  assert.equal(state.pendingRequest.current.signal.aborted, true);
  body.resolve({ plan: { version: 1 } });
  await pending;
  assert.equal(state.saveUncertain, true);
  assert.match(state.error, /保存结果未确认/);
  assert.equal(state.fields, originalFields, "unsaved text must remain intact");
  assert.equal(state.savedCount, 0, "late response must not announce success");
  assert.equal(state.savingRef.current, false);
  assert.equal(state.saving, null);
  assert.equal(timers.size, 0);
  await save();
  assert.equal(state.requestCount, 1, "uncertain POST cannot be repeated");
});

test("admin save: unknown network failure preserves input and prevents duplicate submission", async () => {
  const { state, save } = harness(async () => {
    throw new TypeError("connection lost");
  });
  const originalFields = state.fields;
  await save();
  assert.equal(state.saveUncertain, true);
  assert.match(state.error, /避免重复发布/);
  assert.equal(state.fields, originalFields);
  assert.equal(state.savedCount, 0);
  assert.equal(state.saving, null);
  await save();
  assert.equal(state.requestCount, 1);
});

test("admin save: known validation response remains recoverable without uncertain lock", async () => {
  const { state, save } = harness(async () => ({
    ok: false,
    status: 400,
    async json() {
      return { message: "请检查价格" };
    },
  }));
  await save();
  assert.equal(state.saveUncertain, false);
  assert.equal(state.error, "请检查价格");
  await save();
  assert.equal(state.requestCount, 2);
});

test("admin save: permission loss revokes editor instead of treating it as an unknown write", async () => {
  const { state, save } = harness(async () => ({ ok: false, status: 403 }));
  await save();
  assert.equal(state.deniedCount, 1);
  assert.equal(state.saveUncertain, false);
  assert.equal(state.savedCount, 0);
  assert.equal(state.savingRef.current, false);
});

test("admin publish: one note is enough without legacy explanation or manual audit fields", async () => {
  let submitted;
  const { state, save } = harness(async (_url, init) => {
    submitted = JSON.parse(init.body);
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          plan: { ...submitted, version: 1, instrument: state.instrument },
        };
      },
    };
  });
  Object.assign(state.fields, {
    rationale: "82,000 附近观察做空，止损 84,000，止盈 77,000。",
    entryCondition: "",
    invalidationCondition: "",
    publicSummary: "",
    changeReason: "",
  });
  await save("publish");
  assert.equal(state.requestCount, 1);
  assert.equal(state.savedCount, 1);
  assert.equal(state.error, "");
  assert.equal(
    submitted.publicSummary,
    "",
    "private note is never copied into public text",
  );
  assert.equal(
    submitted.changeReason,
    "",
    "server generates a truthful operation label",
  );
  assert.match(submitted.rationale, /82,000/);
});

test("admin publish: a missing note gives actionable validation without disabling retry", async () => {
  const { state, save } = harness(async () => {
    throw new Error("must not submit");
  });
  state.fields.rationale = "";
  state.fields.changeReason = "";
  await save("publish");
  assert.equal(state.requestCount, 0);
  assert.match(state.error, /一句备注/);
  assert.equal(state.saveUncertain, false);
  assert.equal(state.savingRef.current, false);
});

test("admin publish: existing legacy conditions are preserved when the form hides them", async () => {
  let submitted;
  const { state, save } = harness(async (_url, init) => {
    submitted = JSON.parse(init.body);
    return {
      ok: false,
      status: 400,
      async json() {
        return { message: "test" };
      },
    };
  });
  state.fields.changeReason = "";
  await save("publish");
  assert.equal(submitted.entryCondition, "Reviewed entry");
  assert.equal(submitted.invalidationCondition, "Reviewed invalidation");
  assert.equal(submitted.publicSummary, "Public summary");
});

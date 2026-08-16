#!/usr/bin/env node

import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const canonicalPath = process.env.CALENDAR_EVENTS_PATH
  ? resolve(process.cwd(), process.env.CALENDAR_EVENTS_PATH)
  : resolve(projectRoot, "lib/calendar-events.json");

const allowedCategories = new Set(["宏观", "经济数据", "美股财报"]);
const allowedImpacts = new Set(["high", "medium", "low"]);
const allowedEnvelopeKeys = new Set([
  "schemaVersion",
  "timezone",
  "generatedAt",
  "range",
  "events",
]);
const allowedEventKeys = new Set([
  "date",
  "time",
  "title",
  "category",
  "impact",
  "description",
]);

const fail = (message) => {
  throw new Error(message);
};

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const assertExactKeys = (value, allowedKeys, label) => {
  const unknownKeys = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    fail(`${label} 包含未知字段：${unknownKeys.join(", ")}`);
  }
};

const assertDateKey = (dateKey, label = "日期") => {
  if (typeof dateKey !== "string") fail(`${label} 必须是字符串`);

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) fail(`${label} 格式无效：${dateKey}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    fail(`${label} 不是有效日期：${dateKey}`);
  }
};

const addDays = (dateKey, days) => {
  assertDateKey(dateKey);
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

const getTimeRank = (time) => {
  if (time === "全天") return 0;
  if (time === "盘前") return 8 * 60;
  if (time === "盘后") return 24 * 60;
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 23 * 60;
};

const sortEvents = (events) =>
  [...events].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      getTimeRank(a.time) - getTimeRank(b.time) ||
      a.title.localeCompare(b.title, "zh-CN")
  );

const validateEvent = (event, index, range) => {
  const label = `events[${index}]`;
  if (!isPlainObject(event)) fail(`${label} 必须是对象`);
  assertExactKeys(event, allowedEventKeys, label);

  assertDateKey(event.date, `${label}.date`);
  if (range && (event.date < range.start || event.date > range.end)) {
    fail(`${label}.date ${event.date} 不在导入区间 ${range.start} 至 ${range.end} 内`);
  }

  if (
    typeof event.time !== "string" ||
    !/^(全天|盘前|盘后|(?:[01]\d|2[0-3]):[0-5]\d)$/.test(event.time)
  ) {
    fail(`${label}.time 无效：${event.time}`);
  }

  if (typeof event.title !== "string" || event.title.trim().length < 2) {
    fail(`${label}.title 不能为空`);
  }
  if (event.title.length > 100) fail(`${label}.title 超过 100 个字符`);

  if (!allowedCategories.has(event.category)) {
    fail(`${label}.category 无效：${event.category}`);
  }
  if (!allowedImpacts.has(event.impact)) {
    fail(`${label}.impact 无效：${event.impact}`);
  }

  if (typeof event.description !== "string" || event.description.trim().length < 4) {
    fail(`${label}.description 不能为空`);
  }
  if (event.description.length > 240) {
    fail(`${label}.description 超过 240 个字符`);
  }

  return {
    date: event.date,
    time: event.time,
    title: event.title.trim(),
    category: event.category,
    impact: event.impact,
    description: event.description.trim(),
  };
};

const validateEvents = (value, range) => {
  if (!Array.isArray(value)) fail("events 必须是数组");
  const events = value.map((event, index) => validateEvent(event, index, range));
  const seen = new Set();

  for (const event of events) {
    const key = `${event.date}\u0000${event.time}\u0000${event.title}`;
    if (seen.has(key)) {
      fail(`发现重复事件：${event.date} ${event.time} ${event.title}`);
    }
    seen.add(key);
  }

  return sortEvents(events);
};

const validateEnvelope = (value) => {
  if (!isPlainObject(value)) fail("周数据顶层必须是对象");
  assertExactKeys(value, allowedEnvelopeKeys, "周数据");

  if (value.schemaVersion !== 1) fail("schemaVersion 必须为 1");
  if (value.timezone !== "Asia/Shanghai") fail("timezone 必须为 Asia/Shanghai");
  if (typeof value.generatedAt !== "string" || Number.isNaN(Date.parse(value.generatedAt))) {
    fail("generatedAt 必须是有效的 ISO 8601 时间");
  }
  if (!isPlainObject(value.range)) fail("range 必须是对象");
  assertExactKeys(value.range, new Set(["start", "end"]), "range");
  assertDateKey(value.range.start, "range.start");
  assertDateKey(value.range.end, "range.end");
  if (value.range.end !== addDays(value.range.start, 6)) {
    fail("range 必须覆盖连续 7 天（周一至周日）");
  }

  const [year, month, day] = value.range.start.split("-").map(Number);
  if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() !== 1) {
    fail("range.start 必须是周一");
  }

  return {
    schemaVersion: 1,
    timezone: value.timezone,
    generatedAt: value.generatedAt,
    range: { start: value.range.start, end: value.range.end },
    events: validateEvents(value.events, value.range),
  };
};

const readJson = async (path, label) => {
  let raw;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    fail(`无法读取${label} ${path}：${error.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`${label}不是有效 JSON：${error.message}`);
  }
};

const validateCanonical = async () => {
  const raw = await readJson(canonicalPath, "日历数据文件");
  const events = validateEvents(raw);
  const isSorted = JSON.stringify(raw) === JSON.stringify(events);
  if (!isSorted) fail("日历数据未按日期、时间和标题稳定排序");
  return events;
};

const formatCanonical = async () => {
  const raw = await readJson(canonicalPath, "日历数据文件");
  const events = validateEvents(raw);
  const temporaryPath = `${canonicalPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(events, null, 2)}\n`, "utf8");
  await rename(temporaryPath, canonicalPath);
  await validateCanonical();
  return events;
};

const importWeekly = async (inputPath, shouldWrite) => {
  if (!inputPath) {
    fail("缺少周数据文件。用法：npm run calendar:import -- <文件路径> [--write]");
  }

  const envelope = validateEnvelope(
    await readJson(resolve(process.cwd(), inputPath), "周数据文件")
  );
  const canonical = validateEvents(
    await readJson(canonicalPath, "日历数据文件")
  );
  const preserved = canonical.filter(
    (event) => event.date < envelope.range.start || event.date > envelope.range.end
  );
  const merged = validateEvents([...preserved, ...envelope.events]);

  const summary = {
    range: envelope.range,
    incoming: envelope.events.length,
    replaced: canonical.length - preserved.length,
    total: merged.length,
    mode: shouldWrite ? "write" : "dry-run",
  };

  if (shouldWrite) {
    const temporaryPath = `${canonicalPath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
    await rename(temporaryPath, canonicalPath);
    await validateCanonical();
  }

  console.log(JSON.stringify(summary, null, 2));
};

const [command, ...args] = process.argv.slice(2);

try {
  if (command === "validate") {
    const events = await validateCanonical();
    console.log(`日历数据校验通过：${events.length} 条事件`);
  } else if (command === "format") {
    const events = await formatCanonical();
    console.log(`日历数据已规范化：${events.length} 条事件`);
  } else if (command === "import") {
    const shouldWrite = args.includes("--write");
    const inputPath = args.find((arg) => arg !== "--write");
    await importWeekly(inputPath, shouldWrite);
  } else {
    fail("用法：calendar-events.mjs <validate|format|import> [周数据文件] [--write]");
  }
} catch (error) {
  console.error(`日历数据处理失败：${error.message}`);
  process.exitCode = 1;
}

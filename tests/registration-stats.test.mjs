import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../lib/identity/registration-stats.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;
const module = { exports: {} };
new Function('module', 'exports', compiled)(module, module.exports);
const { getRegistrationWindows, formatRegistrationTimestamp } = module.exports;
const serializeWindows = (now) => Object.fromEntries(
  Object.entries(getRegistrationWindows(new Date(now))).map(([key, value]) => [key, value.toISOString()]),
);

test('registration windows start at Beijing calendar midnight, not UTC midnight', () => {
  assert.deepEqual(serializeWindows('2026-10-18T04:15:23.456Z'), {
    monthStart: '2026-09-30T16:00:00.000Z',
    yesterdayStart: '2026-10-16T16:00:00.000Z',
    todayStart: '2026-10-17T16:00:00.000Z',
    now: '2026-10-18T04:15:23.456Z',
  });
});

for (const [name, now, monthStart, yesterdayStart, todayStart] of [
  ['before Beijing midnight', '2026-10-31T15:59:59.999Z', '2026-09-30T16:00:00.000Z', '2026-10-29T16:00:00.000Z', '2026-10-30T16:00:00.000Z'],
  ['month rollover', '2026-10-31T16:00:00.000Z', '2026-10-31T16:00:00.000Z', '2026-10-30T16:00:00.000Z', '2026-10-31T16:00:00.000Z'],
  ['year rollover', '2026-12-31T16:00:00.000Z', '2026-12-31T16:00:00.000Z', '2026-12-30T16:00:00.000Z', '2026-12-31T16:00:00.000Z'],
  ['leap day', '2024-02-28T16:00:00.000Z', '2024-01-31T16:00:00.000Z', '2024-02-27T16:00:00.000Z', '2024-02-28T16:00:00.000Z'],
  ['day after leap day', '2024-02-29T16:00:00.000Z', '2024-02-29T16:00:00.000Z', '2024-02-28T16:00:00.000Z', '2024-02-29T16:00:00.000Z'],
  ['non-leap February rollover', '2026-02-28T16:00:00.000Z', '2026-02-28T16:00:00.000Z', '2026-02-27T16:00:00.000Z', '2026-02-28T16:00:00.000Z'],
]) {
  test(`registration windows handle ${name}`, () => {
    assert.deepEqual(serializeWindows(now), { monthStart, yesterdayStart, todayStart, now });
  });
}

test('timestamp labels are padded Beijing dates and 24-hour times, including midnight', () => {
  for (const [instant, date, time] of [
    ['2026-10-17T15:59:59.999Z', '2026-10-17', '23:59:59'],
    ['2026-10-17T16:00:00.000Z', '2026-10-18', '00:00:00'],
    ['2026-01-01T17:02:03.000Z', '2026-01-02', '01:02:03'],
    ['2024-02-29T00:00:00.000Z', '2024-02-29', '08:00:00'],
    ['2026-12-31T16:00:00.000Z', '2027-01-01', '00:00:00'],
  ]) {
    assert.deepEqual(formatRegistrationTimestamp(new Date(instant)), { date, time });
  }
});

test('month includes its start and the captured now; yesterday excludes today midnight', () => {
  const { monthStart, yesterdayStart, todayStart, now } = getRegistrationWindows(new Date('2026-10-18T04:15:23.456Z'));
  const isThisMonth = (time) => time >= monthStart.getTime() && time <= now.getTime();
  const isYesterday = (time) => time >= yesterdayStart.getTime() && time < todayStart.getTime();
  assert.equal(isThisMonth(monthStart.getTime() - 1), false);
  assert.equal(isThisMonth(monthStart.getTime()), true);
  assert.equal(isThisMonth(now.getTime()), true);
  assert.equal(isThisMonth(now.getTime() + 1), false);
  assert.equal(isYesterday(yesterdayStart.getTime() - 1), false);
  assert.equal(isYesterday(yesterdayStart.getTime()), true);
  assert.equal(isYesterday(todayStart.getTime() - 1), true);
  assert.equal(isYesterday(todayStart.getTime()), false);
});

test('captured now is independent of later changes to the caller date', () => {
  const input = new Date('2026-10-18T04:15:23.456Z');
  const windows = getRegistrationWindows(input);
  input.setUTCFullYear(2027);
  assert.equal(windows.now.toISOString(), '2026-10-18T04:15:23.456Z');
  assert.notEqual(windows.now, input);
});

test('omitting now captures the current instant', () => {
  const before = Date.now();
  const windows = getRegistrationWindows();
  const after = Date.now();
  assert.ok(windows.now.getTime() >= before && windows.now.getTime() <= after);
});

test('host timezones, including a DST-observing host, cannot change the output', () => {
  const instant = '2026-10-31T16:00:00.000Z';
  const script = `
    const module = { exports: {} };
    new Function('module', 'exports', ${JSON.stringify(compiled)})(module, module.exports);
    const now = new Date(${JSON.stringify(instant)});
    process.stdout.write(JSON.stringify({
      windows: module.exports.getRegistrationWindows(now),
      timestamp: module.exports.formatRegistrationTimestamp(now),
    }));
  `;
  for (const TZ of ['UTC', 'America/Los_Angeles', 'Asia/Shanghai', 'Pacific/Kiritimati']) {
    const result = JSON.parse(execFileSync(process.execPath, ['-e', script], {
      env: { ...process.env, TZ }, encoding: 'utf8',
    }));
    assert.deepEqual(result, {
      windows: serializeWindows(instant),
      timestamp: { date: '2026-11-01', time: '00:00:00' },
    }, TZ);
  }
});

const registrationTimeZone = "Asia/Shanghai";
const shanghaiUtcOffsetMs = 8 * 60 * 60 * 1000;
const timestampFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: registrationTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function formatRegistrationTimestamp(date: Date): { date: string; time: string } {
  const parts = Object.fromEntries(
    timestampFormatter.formatToParts(date).map(({ type, value }) => [type, value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

export function getRegistrationWindows(now = new Date()): {
  monthStart: Date;
  yesterdayStart: Date;
  todayStart: Date;
  now: Date;
} {
  const snapshot = new Date(now.getTime());
  const [year, month, day] = formatRegistrationTimestamp(snapshot).date.split("-").map(Number);
  // Contemporary Asia/Shanghai calendar dates use UTC+08:00 without daylight saving.
  // UTC construction also makes month/year rollover independent of the server's TZ.
  const midnight = (dayOfMonth: number) =>
    new Date(Date.UTC(year, month - 1, dayOfMonth) - shanghaiUtcOffsetMs);

  return {
    monthStart: midnight(1),
    yesterdayStart: midnight(day - 1),
    todayStart: midnight(day),
    now: snapshot,
  };
}

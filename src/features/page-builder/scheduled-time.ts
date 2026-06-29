function dateParts(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  return match.slice(1).map(Number) as [number, number, number, number, number];
}

function partsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return [
    Number(values.year),
    Number(values.month),
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
  ] as const;
}

export function zonedDateTimeToUtc(value: string, timeZone: string) {
  const desired = dateParts(value);
  if (!desired) return null;
  const desiredTimestamp = Date.UTC(
    desired[0],
    desired[1] - 1,
    desired[2],
    desired[3],
    desired[4],
  );
  let timestamp = desiredTimestamp;

  for (let index = 0; index < 2; index += 1) {
    const actual = partsInTimeZone(new Date(timestamp), timeZone);
    const actualTimestamp = Date.UTC(
      actual[0],
      actual[1] - 1,
      actual[2],
      actual[3],
      actual[4],
    );
    timestamp += desiredTimestamp - actualTimestamp;
  }

  return new Date(timestamp);
}

export function utcToZonedDateTimeInput(date: Date, timeZone: string) {
  const [year, month, day, hour, minute] = partsInTimeZone(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

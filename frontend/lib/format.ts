// Display formatting only. No financial calculation lives in the browser.

export function formatMoney(value: string | number): string {
  const amount = Number(value);
  if (value === '' || !Number.isFinite(amount)) return value === '' ? '—' : String(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 ? 2 : 0,
    maximumFractionDigits: 3,
  }).format(amount);
}

export function formatDuration(months: number): string {
  const wholeYears = Math.floor(months / 12);
  const remainder = months % 12;
  if (wholeYears === 0) return `${remainder} mo`;
  return remainder ? `${wholeYears} yr ${remainder} mo` : `${wholeYears} yr`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

/** Calendar date when the backend supplied one; otherwise elapsed time from model start. */
export function formatTiming(date: string | null, month: number | null | undefined): string | null {
  if (date) return formatDate(date);
  if (month === null || month === undefined) return null;
  return `${formatDuration(month)} from start`;
}

export function formatYears(value: string | number): string {
  const years = Number(value);
  return Number.isFinite(years) ? `${years} yr` : String(value);
}

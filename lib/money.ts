export function formatPence(pence: number): string {
  const n = Number.isFinite(pence) ? Math.round(pence) : 0;
  return (n / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

/** "£1,250.50", "1250" and "1,250" all mean the same thing typed in a hurry. */
export function parsePounds(raw: FormDataEntryValue | null): number {
  const cleaned = String(raw ?? '').replace(/[£,\s]/g, '').trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

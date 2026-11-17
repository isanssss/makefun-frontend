// Small helpers for showing API values.

/** Text made safe to put inside HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** A dollar amount ('1000.00' or 0.5) as '$1,000' or '$0.50'. */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
  });
}

/** An integer with thousands separators. */
export function count(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '—';
}

/** A date as '17 Nov 2026, 12:30 UTC'. */
export function date(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}, ${d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })} UTC`;
}

/** Milliseconds until an ISO deadline (negative once it has passed). */
export function msLeft(iso) {
  return new Date(iso).getTime() - Date.now();
}

/** A duration as '2d 4h', '3h 12m', '9m 41s' or '12s' — for live countdowns. */
export function duration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** The time until a deadline: '2d 4h left', '35m left', or 'ended'. */
export function timeLeft(iso) {
  const ms = msLeft(iso);
  return ms <= 0 ? 'ended' : `${duration(ms)} left`;
}

/** A win-rate stored in micro units (0..1,000,000) as a percentage: '95.6%'. */
export function microRate(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${(n / 10000).toFixed(1)}%`;
}

/** '1 entry' / '132 entries'. */
export function entries(n) {
  return `${count(n)} ${Number(n) === 1 ? 'entry' : 'entries'}`;
}

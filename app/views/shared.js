// Helpers shared by the views: loading and error states, the aria-live
// announcer, live countdowns and leaderboard metric formatting.

import { duration, esc, microRate, msLeft } from '../format.js';

/** Tell assistive technology (politely) what just loaded. */
export function announce(text) {
  const region = document.getElementById('announcer');
  if (region) region.textContent = text;
}

/** A short loading note while a view fetches. */
export function loading(el, text = 'Loading…') {
  el.innerHTML = `<p class="status-line" role="status">${esc(text)}</p>`;
}

/** An error panel with a retry button — never a blank page. */
export function errorPanel(el, error, retry) {
  const notFound = error?.status === 404;
  el.innerHTML = `
    <div class="panel error" role="alert">
      <h2>${notFound ? 'Not found' : 'Something went wrong'}</h2>
      <p>${esc(error?.message ?? 'The data could not be loaded.')}</p>
      <p><button type="button" class="more" data-retry>Try again</button>
      <a href="#/">Back to the board</a></p>
    </div>`;
  el.querySelector('[data-retry]').addEventListener('click', retry);
}

/**
 * Tick every [data-deadline] element in root once a second, showing the time
 * remaining ('2d 4h left') or 'ended'. Returns a cleanup function.
 */
export function startCountdowns(root) {
  const nodes = [...root.querySelectorAll('[data-deadline]')];
  if (!nodes.length) return () => {};
  const tick = () => {
    for (const node of nodes) {
      const ms = msLeft(node.dataset.deadline);
      node.textContent = ms <= 0 ? 'ended' : `${duration(ms)} left`;
    }
  };
  tick();
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}

/** A leaderboard metric as readable text: micro win rates as percentages, the rest as the API displays them. */
export function metricText(column, values, display) {
  const key = column?.key;
  if (!key) return '—';
  if (column.source?.includes('_micro')) return microRate(values?.[key]);
  if (display?.[key] != null) return String(display[key]);
  return values?.[key] != null ? String(values[key]) : '—';
}

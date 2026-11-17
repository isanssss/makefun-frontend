// A bounty's leaderboard: ranked entries in the order the API returns them,
// rendered 50 at a time behind a "show more" button so a board with thousands
// of entries never lays out all at once. Entrant handles link to profiles.

import { absolute, getLeaderboard } from '../api.js';
import { count, date, esc } from '../format.js';
import { announce, errorPanel, loading, metricText } from './shared.js';

const PAGE = 50;

function row(entry, column) {
  const judge = entry.judge;
  const record = judge && judge.matches
    ? `${judge.wins}–${judge.draws}–${judge.losses}${judge.provisional ? ' · provisional' : ''}`
    : '';
  const tags = [entry.house ? 'house' : '', entry.baseline ? 'baseline' : ''].filter(Boolean).join(' ');
  return `<tr${entry.house || entry.baseline ? ' class="house"' : ''}>
    <td class="rank">${entry.rank ?? '—'}</td>
    <td><span class="entrant">${entry.image ? `<img class="avatar-sm" crossorigin="anonymous" src="${esc(absolute(entry.image))}" alt="" loading="lazy" width="26" height="26">` : ''}<a href="#/profile/${encodeURIComponent(entry.handle)}">@${esc(entry.handle)}</a></span>${tags ? ` <span class="chip">${tags}</span>` : ''}</td>
    <td>${esc(entry.title ?? '')}</td>
    <td class="num"><strong>${esc(metricText(column, entry.values, entry.display))}</strong></td>
    <td class="hide-sm">${record}</td>
    <td class="hide-sm muted">${entry.received_at ? date(entry.received_at) : ''}</td>
  </tr>`;
}

export async function render(el, slug) {
  loading(el, 'Loading the leaderboard…');
  let lb;
  try {
    lb = await getLeaderboard(slug);
  } catch (error) {
    errorPanel(el, error, () => render(el, slug));
    return () => {};
  }
  // The leaderboard payload names its own competition — no second fetch needed.
  const title = lb.competition?.title ?? slug;

  const rows = lb.entries ?? [];
  const column = (lb.columns ?? []).find((c) => c.key === lb.rank_key) ?? (lb.columns ?? [])[0];
  const metricTitle = column?.title ?? 'Score';
  document.title = `Leaderboard — ${title} | make.fun bounties`;
  el.innerHTML = `
    <p class="crumbs"><a href="#/bounty/${encodeURIComponent(slug)}">← ${esc(title)}</a></p>
    <h1 tabindex="-1">Leaderboard</h1>
    <p class="lede">${esc(title)} — ${count(rows.length)} ranked entries${lb.phase?.title ? `, ${esc(lb.phase.title)} phase` : ''}.
    Ranked by ${esc(metricTitle.toLowerCase())}${lb.tie_break?.title ? `, ties broken by ${esc(lb.tie_break.title.toLowerCase())}` : ''}.</p>
    <table>
      <thead><tr>
        <th scope="col">Rank</th><th scope="col">Entrant</th><th scope="col">Entry</th>
        <th scope="col" class="num">${esc(metricTitle)}</th>
        <th scope="col" class="hide-sm">Record</th><th scope="col" class="hide-sm">Received</th>
      </tr></thead>
      <tbody id="lb-rows"></tbody>
    </table>
    <p id="lb-more-wrap"></p>`;

  const tbody = el.querySelector('#lb-rows');
  const wrap = el.querySelector('#lb-more-wrap');
  let shown = 0;
  const showMore = () => {
    const next = rows.slice(shown, shown + PAGE);
    tbody.insertAdjacentHTML('beforeend', next.map((e) => row(e, column)).join(''));
    shown += next.length;
    if (shown < rows.length) {
      wrap.innerHTML = `<button type="button" class="more">Show more (${count(rows.length - shown)} remaining)</button>`;
      wrap.querySelector('button').addEventListener('click', showMore);
    } else {
      wrap.innerHTML = rows.length > PAGE ? `<span class="muted">All ${count(rows.length)} entries shown.</span>` : '';
    }
  };
  showMore();
  announce(`Leaderboard loaded: ${count(rows.length)} entries for ${title}.`);
  return () => {};
}

// One bounty's page: summary, the facts, the rewards table at the live pot,
// description, how it is decided, and the full rules.

import { getCompetition } from '../api.js';
import { count, date, entries, esc, money, msLeft } from '../format.js';
import { markdown } from '../markdown.js';
import { announce, errorPanel, loading, startCountdowns } from './shared.js';

function rewardsTable(b) {
  const rows = (b.rewardsNow ?? []).map(
    (r) => `<tr><td class="rank">#${r.place}</td><td class="num">${money(r.amountUsd)}</td><td class="num">${money(r.baseUsd)}</td><td class="num">${money(r.feeShareUsd)}</td></tr>`,
  );
  if (!rows.length && b.rewards) {
    for (const [place, amount] of Object.entries(b.rewards)) {
      rows.push(`<tr><td class="rank">#${place}</td><td class="num">${money(amount)}</td><td class="num">${money(amount)}</td><td class="num">$0</td></tr>`);
    }
  }
  if (!rows.length) return '';
  return `
    <h2>Rewards</h2>
    <table>
      <caption>Places paid from the live pot of ${money(b.potUsd ?? b.rewardAmount)}</caption>
      <thead><tr><th scope="col">Place</th><th scope="col" class="num">Prize now</th><th scope="col" class="num">Base</th><th scope="col" class="num">Fee share</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>`;
}

export async function render(el, slug) {
  loading(el, 'Loading the bounty…');
  let b;
  try {
    b = await getCompetition(slug);
  } catch (error) {
    errorPanel(el, error, () => render(el, slug));
    return () => {};
  }

  const open = msLeft(b.deadline) > 0;
  const state = b.status === 'resolved' ? 'Resolved' : open ? 'Open for entries' : 'Closed';
  document.title = `${b.title} | make.fun bounties`;
  el.innerHTML = `
    <p class="crumbs"><a href="#/">← All bounties</a></p>
    <h1 tabindex="-1">${esc(b.title)}</h1>
    ${b.summary ? `<p class="lede">${esc(b.summary)}</p>` : ''}
    <p>
      <span class="chip ${open && b.status !== 'resolved' ? 'open' : 'closed'}">${state}</span>
      ${b.category ? `<span class="chip">${esc(b.category)}</span>` : ''}
      ${(b.skills ?? []).map((s) => `<span class="chip">${esc(s)}</span>`).join(' ')}
    </p>
    ${b.winner ? `<div class="panel"><h2>Winner</h2>
      <p><a href="#/profile/${encodeURIComponent(b.winner.handle)}">@${esc(b.winner.handle)}</a> —
      ${esc(b.winner.title)} — ${money(b.winner.amountUsd)}</p></div>` : ''}
    <dl class="facts">
      <div><dt>Live pot</dt><dd>${money(b.potUsd ?? b.rewardAmount)}</dd></div>
      <div><dt>Base prize</dt><dd>${money(b.rewardAmount)}</dd></div>
      <div><dt>Entry fee</dt><dd>${b.entryFeeUsd ? money(b.entryFeeUsd) : 'Free'}</dd></div>
      <div><dt>Entries</dt><dd>${count(b.submissionCount)}</dd></div>
      <div><dt>Deadline</dt><dd class="normal">${date(b.deadline)}<br><span class="countdown" data-deadline="${esc(b.deadline)}"></span></dd></div>
      <div><dt>Opened</dt><dd class="normal">${date(b.opensAt ?? b.publishedAt)}</dd></div>
      ${b.sponsor?.name ? `<div><dt>Sponsor</dt><dd class="normal">${esc(b.sponsor.name)}${b.sponsor.isVerified ? ' ✓' : ''}</dd></div>` : ''}
      ${b.resolvedAt ? `<div><dt>Resolved</dt><dd class="normal">${date(b.resolvedAt)}</dd></div>` : ''}
    </dl>
    <p><a href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard"><strong>See the leaderboard →</strong></a>
    <span class="muted">(${entries(b.submissionCount)} ranked)</span></p>
    ${rewardsTable(b)}
    ${b.description ? `<h2>About this bounty</h2><div class="prose">${markdown(b.description)}</div>` : ''}
    ${b.resolution?.summary ? `<h2>How it is decided</h2><div class="prose"><p>${esc(b.resolution.summary)}</p>
      ${(b.resolution.criteria ?? []).length ? `<ul>${b.resolution.criteria.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}</div>` : ''}
    ${b.rulesNote?.text ? `<h2>Rules note</h2><div class="panel"><p>${esc(b.rulesNote.text)}</p></div>` : ''}
    ${b.rules ? `<h2>Rules</h2><div class="prose">${markdown(b.rules)}</div>` : ''}`;
  announce(`Bounty loaded: ${b.title}, live pot ${money(b.potUsd ?? b.rewardAmount)}, ${state.toLowerCase()}.`);
  return startCountdowns(el);
}

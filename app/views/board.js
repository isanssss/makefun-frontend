// The board: every live bounty as a card — live pot, entry fee, time left,
// entry count. A bounty counts as open while its deadline is in the future,
// whatever its status says; past-deadline bounties drop into a closed section.

import { getCompetitions } from '../api.js';
import { entries, esc, money, msLeft } from '../format.js';
import { announce, errorPanel, loading, startCountdowns } from './shared.js';

function card(b) {
  const open = msLeft(b.deadline) > 0;
  return `
  <li class="card">
    <p class="pot">${money(b.potUsd ?? b.rewardAmount)} <small>live pot</small></p>
    <h3><a href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a></h3>
    ${b.summary ? `<p class="summary">${esc(b.summary)}</p>` : ''}
    <p class="meta">
      <span class="chip ${open ? 'open' : 'closed'}">${open ? 'Open' : 'Closed'}</span>
      ${b.category ? `<span class="chip">${esc(b.category)}</span>` : ''}
      <span><span class="countdown" data-deadline="${esc(b.deadline)}"></span></span>
      <span>${entries(b.submissionCount)}</span>
      ${b.entryFeeUsd ? `<span>${money(b.entryFeeUsd)} entry fee</span>` : '<span>Free to enter</span>'}
    </p>
  </li>`;
}

export async function render(el) {
  loading(el, 'Loading the live board…');
  let data;
  try {
    data = await getCompetitions();
  } catch (error) {
    errorPanel(el, error, () => render(el));
    return () => {};
  }
  const items = data.items ?? [];
  const accepting = items
    .filter((b) => msLeft(b.deadline) > 0)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const closed = items
    .filter((b) => msLeft(b.deadline) <= 0)
    .sort((a, b) => new Date(b.deadline) - new Date(a.deadline));

  document.title = 'make.fun bounties — live board';
  el.innerHTML = `
    <h1 tabindex="-1">Live bounties</h1>
    <p class="lede">Every bounty still on make.fun, with its reward as it stands now:
    the prize plus every entry fee paid into the pot.</p>
    <h2>Open for entries (${accepting.length})</h2>
    ${accepting.length ? `<ul class="board-grid">${accepting.map(card).join('')}</ul>` : '<p>No bounty is taking entries right now.</p>'}
    ${closed.length ? `
    <h2>Closed — judging under way (${closed.length})</h2>
    <ul class="board-grid">${closed.map(card).join('')}</ul>` : ''}`;
  announce(`Board loaded: ${accepting.length} bounties open for entries, ${closed.length} closed.`);
  return startCountdowns(el);
}

// An account's public profile: avatar, bio, links, their record across
// competitions, every entry they have made, and prizes paid out.

import { absolute, getProfile } from '../api.js';
import { count, date, esc, microRate, money } from '../format.js';
import { markdown } from '../markdown.js';
import { announce, errorPanel, loading } from './shared.js';

const PAGE = 25;

/** A solution's score as readable text (micro win rates as percentages). */
function scoreText(score) {
  if (!score?.column) return '';
  const label = score.column.title ?? score.column.key;
  const value = score.column.source?.includes('_micro') ? microRate(score.value) : (score.display ?? score.value);
  return `${label}: ${value}`;
}

function solution(s) {
  const c = s.competition ?? {};
  const bits = [
    s.placement ? `placed #${s.placement}` : c.status === 'resolved' ? 'resolved' : 'in progress',
    scoreText(s.score),
    s.prize_usd ? `won ${money(s.prize_usd)}` : '',
    s.entered_at ? `entered ${date(s.entered_at)}` : '',
  ].filter(Boolean);
  return `<li>
    <a href="#/bounty/${encodeURIComponent(c.slug ?? '')}">${esc(c.title ?? c.slug ?? 'Competition')}</a>
    ${c.category ? `<span class="chip">${esc(c.category)}</span>` : ''}
    <br>${esc(s.title ?? '')}
    <br><span class="muted small">${bits.map(esc).join(' · ')}</span>
  </li>`;
}

export async function render(el, handle) {
  loading(el, 'Loading the profile…');
  let p;
  try {
    p = await getProfile(handle);
  } catch (error) {
    errorPanel(el, error, () => render(el, handle));
    return () => {};
  }

  const name = p.display_name || `@${p.handle}`;
  const avatar = p.avatar?.url ?? p.image;
  const r = p.record ?? {};
  const links = [
    p.github_login ? `<a href="https://github.com/${encodeURIComponent(p.github_login)}" rel="noopener">GitHub: ${esc(p.github_login)}</a>` : '',
    p.x ? `<a href="https://x.com/${encodeURIComponent(p.x)}" rel="noopener">X: @${esc(p.x)}</a>` : '',
    p.discord ? `<span>Discord: ${esc(p.discord)}</span>` : '',
    p.wallet?.address ? `<a href="${esc(p.wallet.explorer_url ?? '#')}" rel="noopener">Wallet: ${esc(p.wallet.address.slice(0, 6))}…${esc(p.wallet.address.slice(-4))}</a>` : '',
  ].filter(Boolean);

  document.title = `${name} | make.fun bounties`;
  el.innerHTML = `
    <p class="crumbs"><a href="#/">← All bounties</a></p>
    <div class="profile-head">
      ${avatar ? `<img crossorigin="anonymous" src="${esc(absolute(avatar))}" alt="Avatar of ${esc(name)}" width="84" height="84">` : ''}
      <div>
        <h1 tabindex="-1">${esc(name)}</h1>
        <p class="muted">@${esc(p.handle)}${p.house ? ' · <span class="chip">house</span>' : ''}${p.demo ? ' · <span class="chip">demo</span>' : ''}
        · joined ${date(p.joined_at)}</p>
        ${links.length ? `<p>${links.join(' · ')}</p>` : ''}
      </div>
    </div>
    ${p.bio ? `<div class="prose">${markdown(p.bio)}</div>` : ''}
    <h2>Record</h2>
    <dl class="facts">
      <div><dt>Entered</dt><dd>${count(r.competitions_entered)}</dd></div>
      <div><dt>Placed</dt><dd>${count(r.competitions_placed)}</dd></div>
      <div><dt>Won</dt><dd>${count(r.competitions_won)}</dd></div>
      <div><dt>Podiums</dt><dd>${count(r.podium_finishes)}</dd></div>
      <div><dt>Best placement</dt><dd>${r.best_placement ? `#${r.best_placement}` : '—'}</dd></div>
      <div><dt>Prizes won</dt><dd>${money(r.prize_usd ?? 0)}</dd></div>
    </dl>
    <h2>Entries (${count((p.solutions ?? []).length)})</h2>
    <ul class="clean" id="pf-entries"></ul>
    <p id="pf-more-wrap"></p>
    ${(p.payouts ?? []).length ? `<h2>Payouts</h2>
    <ul class="clean">${p.payouts.map((pay) => `<li>${money(pay.amount_usd)} for #${pay.place} in
      <a href="#/bounty/${encodeURIComponent(pay.competition?.slug ?? '')}">${esc(pay.competition?.title ?? '')}</a>
      <span class="muted small">· paid ${date(pay.paid_at)}</span></li>`).join('')}</ul>` : ''}`;

  const list = el.querySelector('#pf-entries');
  const wrap = el.querySelector('#pf-more-wrap');
  const solutions = p.solutions ?? [];
  let shown = 0;
  const showMore = () => {
    const next = solutions.slice(shown, shown + PAGE);
    list.insertAdjacentHTML('beforeend', next.map(solution).join(''));
    shown += next.length;
    if (shown < solutions.length) {
      wrap.innerHTML = `<button type="button" class="more">Show more (${count(solutions.length - shown)} remaining)</button>`;
      wrap.querySelector('button').addEventListener('click', showMore);
    } else wrap.innerHTML = '';
  };
  if (solutions.length) showMore();
  else list.innerHTML = '<li class="muted">No entries yet.</li>';
  announce(`Profile loaded: ${name}, ${count(r.competitions_entered)} competitions entered.`);
  return () => {};
}

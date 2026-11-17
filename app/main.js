// A make.fun frontend: a live bounty board, a page per bounty, leaderboards
// and profiles, on hash routes. Each view is a separate module, loaded lazily
// with dynamic import() so the first load is just this router and the shell.
//
//   #/                              the board
//   #/bounty/<slug>                 one bounty
//   #/bounty/<slug>/leaderboard     its leaderboard
//   #/profile/<handle>              an account's public profile
//
// window.__shotReady is false while a page loads and true once its data is on
// screen (or its error panel is), so a screenshot script knows when to capture.

const app = document.getElementById('app');
let cleanup = () => {};
let navigation = 0;

const routes = [
  { match: /^#\/bounty\/([^/]+)\/leaderboard\/?$/, view: () => import('./views/leaderboard.js') },
  { match: /^#\/bounty\/([^/]+)\/?$/, view: () => import('./views/bounty.js') },
  { match: /^#\/profile\/([^/]+)\/?$/, view: () => import('./views/profile.js') },
  { match: /^\#\/?$/, view: () => import('./views/board.js') },
];

async function render() {
  const ticket = ++navigation;
  cleanup();
  cleanup = () => {};
  window.__shotReady = false;

  const hash = location.hash || '#/';
  const route = routes.find((r) => r.match.test(hash)) ?? routes[routes.length - 1];
  const param = hash.match(route.match)?.[1];
  try {
    const { render: view } = await route.view();
    const done = await view(app, param ? decodeURIComponent(param) : undefined);
    if (ticket !== navigation) return; // a newer navigation already owns the page
    if (typeof done === 'function') cleanup = done;
  } catch (error) {
    if (ticket !== navigation) return;
    app.innerHTML = `<div class="panel error" role="alert"><h2>Something went wrong</h2>
      <p>${String(error?.message ?? error)}</p><p><a href="#/">Back to the board</a></p></div>`;
  }
  window.scrollTo(0, 0);
  app.querySelector('h1')?.focus({ preventScroll: true });
  window.__shotReady = true;
}

window.addEventListener('hashchange', render);
render();

# makefun-frontend

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/isanssss/makefun-frontend/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/isanssss/makefun-frontend/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, accessible make.fun frontend built from plain static files — no framework, no build step. It reads make.fun's public API live and shows the bounty board (each bounty's live pot, entry fee, entry count and a ticking countdown to its deadline, with openness decided by the deadline itself), a page for every bounty (summary, facts, the rewards table at the live pot, description, how it is decided and the full rules), ranked leaderboards rendered fifty entries at a time, and public profiles with an account's record, entries and payouts. Responses are cached in memory and revalidated with ETags, each route's code loads lazily, and the whole app is keyboard-navigable with semantic landmarks, a skip link and polite live announcements.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=sm62f3x7&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>

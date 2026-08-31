# Planscape

**[planscape.studio](https://planscape.studio)** — a graph-based OSRS quest and goal planner.

Map out your Old School RuneScape grind visually. Chain together quests, skill targets, unlocks, and boss kills with dependency edges — then see what's available right now, what's blocked, and where the biggest bottlenecks are.

Not a checklist. An efficiency engine with a visual graph UI.

## Features

- **Dependency graph** — hard `requires` edges and soft `improves` recommendations
- **Quest planner** — add quests with prerequisite trees from the OSRS wiki
- **Skill targets** — track level goals with optional boost levels; sync from [Wise Old Man](https://wiseoldman.net)
- **Planning panel** — filter available, blocked, and bottleneck nodes
- **Fold groups** — collapse sub-trees to keep large plans readable
- **Sync** — keep the graph on your other devices, or copy a read-only link
- **Export / import** — versioned JSON backups with auto-save to localStorage
- **Global notes** — free-form plan-level notes (gear, account details, reminders)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Device sync needs the Worker as well (two terminals):

```bash
npm run worker:dev
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run worker:dev` | Cloudflare Worker + local KV on port 8787 |
| `npm run worker:deploy` | Deploy the sync Worker to `planscape.studio/api/*` |
| `npm run build` | Generate SEO assets, type-check, production build |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |
| `npm run generate:seo` | Regenerate favicon, OG image, and CNAME in `public/` |

## Device sync (production)

The SPA stays on GitHub Pages. A Cloudflare Worker at `/api/sync/:id` stores one graph per sync code in KV.

Provision and deploy from this repo (requires `npx wrangler login`):

```bash
npx wrangler kv namespace create GRAPHS --config worker/wrangler.toml
# paste the printed id into worker/wrangler.toml, then:
npx wrangler deploy --config worker/wrangler.toml
```

The Worker is already configured to serve `planscape.studio/api/*`. GitHub Actions (`.github/workflows/deploy-worker.yml`) deploys on changes to `worker/` if `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set as repo secrets.

Anyone with a device code can read and overwrite that graph. Unlinking a device does not delete the cloud copy.

## Tech stack

- Vite 7 + React 19 + TypeScript
- Tailwind CSS 4
- Zustand (graph state + undo/redo via zundo)
- @xyflow/react (controlled graph canvas)
- Deployed to GitHub Pages at [planscape.studio](https://planscape.studio) via Cloudflare

## Feedback

[Open an issue](https://github.com/mevans/osrs-goal-tracker/issues/new) on GitHub.

## License

See the repository for license details.

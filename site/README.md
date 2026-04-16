# Game Dev Bootcamp — Site

Astro 5 site for the Game Dev Bootcamp course. Deployed to GitHub Pages at [seanking11.github.io/gamebootcamp](https://seanking11.github.io/gamebootcamp/).

38 genre modules (`01-pong` through `38-sandbox`), each with interactive canvas demos.

## Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build production site to `dist/` |
| `npm run preview` | Preview built site locally |
| `npm run test` | Content validators + all Playwright tests |
| `npm run test:content` | Sokoban level BFS solver |
| `npm run test:smoke` | 37 pages × 5 checks (status, errors, canvases, nav, resources) |
| `npm run test:interaction` | Sokoban + Pong game-logic tests |

## Structure

- `src/pages/` — module pages, learning paths, genre pages
- `src/layouts/` — shared layouts, nav
- `public/` — static assets
- `scripts/` — content validators (e.g. `validate-sokoban.js`)
- `tests/` — Playwright specs + `helpers/module-manifest.js`

## Deployment

CI in `.github/workflows/deploy.yml` runs tests then builds + deploys to Pages on push to `main`.

## Base URL

All site served under `/gamebootcamp/`. Links use `${base}` from `import.meta.env.BASE_URL` — don't hardcode paths.

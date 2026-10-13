# VUIZARD

A purely client-side app (React + TypeScript + Vite) drawing its visualisations with D3 and reading static JSON files, with no backend.

## The three levels

The sidebar switches between three levels of detail, each with a visualisation and a list:

| Route                  | Level            | What it shows                                                                                                                                                                    |
| ---------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                    | Overview         | All artists as packed circles grouped by cultural context, filtered by century. Selecting artists highlights who appears with them and lists the works they share.               |
| `/artist`, `/artist/:id` | Artist view    | A list of artists, and for one artist a radial visualisation of every work attributed to them (accepted vs. discarded, level of uncertainty, qualifiers such as "falso").       |
| `/work`, `/work/:id`   | Artwork view     | A list of works, and for one work its images, its attributions in tables and a "debate" visualisation of the accepted and discarded attributions with their reasons.             |

`/search-work` is a search box over the works index.

## Architecture

```
src/
├── main.tsx, router.tsx, App.tsx   entry point, route table, shell (sidebar + <Outlet/>)
├── pages/                          one component per route; each loads its data and owns its layout
├── components/
│   ├── layout/                     Header (sidebar with the level switch), Footer
│   ├── overview/                   PackingVis (circle packing), cards, legend, selected-works list
│   ├── artist/                     ArtistVis (d3-force radial layout), tier arcs, legends, work card
│   ├── work/                       work header and images, attribution tables, DebateVis
│   └── *.tsx                       cards and small pieces shared across pages
├── data/api.ts                     the only module that fetches data (cached promises)
├── stores/                         React contexts for selection, filters and highlighting, plus hoverBus
├── hooks/, utils/, types/          measuring and data hooks, geometry/constants/helpers, TypeScript types
└── styles/                         global.css (tokens, nav) plus one stylesheet per area
scripts/split-data.mjs              turns the source JSON into the files the app fetches
```

How the pieces fit together:

- **Data access.** Every page goes through `src/data/api.ts`, which caches the in-flight promises, so swapping the data source means changing one file. The data layout is versioned (`/data/v1/…`).
- **Visualisations.** D3 does the maths (pack layout, force simulation, zoom); React renders the SVG. The artist view has a separate layout for anonymous artists, and artists with more than 400 works load from one pre-built bundle instead of one request per work.
- **State.** Each page has its own small context providers (`stores/`): selection, filters and, for the work page, cross-selection between table and visualisation. In the overview, hover goes through `hoverBus.ts`, which bypasses React so that 5,000+ dots don't re-render on every mouseover.
- **Styling.** Plain CSS with design tokens in `global.css` and one stylesheet per area. There are no CSS-in-JS or UI libraries.

## Data

The data is not in the repository (`data-source/` and `public/data/` are git-ignored). The app expects four JSON files in `data-source/`:

| File              | Content                                                |
| ----------------- | ------------------------------------------------------ |
| `works.json`      | work records, keyed by work id                         |
| `attributions.json` | attributions of each work (defines which works are in scope) |
| `authors.json`    | artist records, keyed by author id                     |
| `authors_co.json` | co-occurrence statistics between artists               |

`npm run split-data` reads them and writes `public/data/v1/`: one file per work, attribution set and artist, a works index, two bulk files (all authors, all co-occurrences) and the per-artist bundles for artists with many works. `node scripts/split-data.mjs --bundles-only` rebuilds only those bundles.

## Running it

```bash
npm install
npm run split-data   # once the four JSON files are in data-source/
npm run dev          # development server
npm run build        # type-check and production build
npm run lint
```

## License

MIT, see [LICENSE](LICENSE).
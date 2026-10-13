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

The data is not in the repository (`data-source/` and `public/data/` are git-ignored). The app expects four JSON files in `data-source/`. Each is a single object keyed by id:

| File                | Entries | Size    | Each entry                                                                                                          |
| ------------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `works.json`        | 78,865  | ~101 MB | a work: title, subject, dating, photos, object, medium, size, `n_attributions`, …                                    |
| `attributions.json` | 78,865  | ~85 MB  | the attributions of one work (accepted or discarded, with authors, qualifiers and reasons), author similarities and relations |
| `authors.json`      | 5,312   | ~11 MB  | an artist: names, life and activity data, cultural context, links (ULAN, Wikidata, Wikipedia), …                      |
| `authors_co.json`   | 5,263   | ~14 MB  | an artist's works and the other artists they co-occur with, with counts and a similarity score                       |

`attributions.json` defines which works are in scope; `works.json` enriches them.

`npm run split-data` reads them and writes `public/data/v1/`, which is what the app fetches:

| Output                    | Files  | Average size | Largest   | Content                                                                 |
| ------------------------- | ------ | ------------ | --------- | ----------------------------------------------------------------------- |
| `works/<id>.json`         | 78,865 | ~1 KB        | ~44 KB    | one work                                                                |
| `attributions/<id>.json`  | 78,865 | ~0.6 KB      | ~7 KB     | the attributions of one work                                            |
| `authors/<id>.json`       | 5,312  | ~1.2 KB      | ~10 KB    | one artist                                                              |
| `artist-bundles/<id>.json`| 19     | ~1 MB        | ~2.1 MB   | an array of `{ id, work, attributions }`, for artists with over 400 works |
| `authors-full.json`       | 1      | ~6.4 MB      |           | all artists, loaded once by the overview                                |
| `authors-co-full.json`    | 1      | ~6.9 MB      |           | all co-occurrences, loaded once by the overview                         |
| `works-index.json`        | 1      | ~5.4 MB      |           | `{ workId: title }`, used by the work search and list                   |

About 163,000 files in total, around 170 MB of content. Splitting keeps every page to a few small requests; only the overview needs the large bulk files, and the bundles stop an artist with 1,000+ works from firing 2,000 requests at once. `node scripts/split-data.mjs --bundles-only` rebuilds only the bundles.

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
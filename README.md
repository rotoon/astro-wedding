# SOM & TOON — Wedding Invitation

Single-page wedding invitation for Suchanya (Som) & Nuttapon (Toon), 25 May 2025,
Virgin Ville Sanpatong, Chiang Mai. Live at <https://www.ststarttogether.com/>.

Built with [Astro](https://astro.build) as a fully static site. The only runtime
dependency is [Swiper](https://swiperjs.com) for the photo slider; everything else
is plain JS and CSS.

## Commands

Requires Node.js 22.12 or newer (even-numbered releases), as declared in `package.json` `engines`.

| Command        | Action                                        |
| :------------- | :-------------------------------------------- |
| `pnpm install` | Install dependencies                          |
| `pnpm dev`     | Start the dev server at `localhost:4321`      |
| `pnpm build`   | Build the static site to `./dist/`            |
| `pnpm preview` | Preview the production build locally          |

## Project structure

```text
public/
├── bgm/bgm.MP3          Background music (loaded on the guest's first tap)
├── img/
│   ├── hero.webp        Hero background
│   ├── slide/           "Our Love Story" slider — every image here is shown, in random order per build
│   ├── sweet/           "Sweet Moments" mosaic — numbered 1.webp, 2.webp, … (shown in number order)
│   └── og-cover.webp    Social share image (opengraph.jpg is the JPEG copy)
src/
├── layouts/Layout.astro SEO/OG meta, JSON-LD, scroll-reveal observer, background music
├── pages/
│   ├── index.astro      Page composition
│   ├── sitemap.xml.ts   Generates /sitemap.xml
│   └── opengraph.jpg.ts Serves /opengraph.jpg
├── components/          One component per section (Hero, Bio, PhotoGallery, PhotoMosaic, Countdown, …)
└── styles/global.css    All shared styles
```

## Adding photos

- **Slider:** drop `.webp` (or `.jpg`/`.png`) files into `public/img/slide/`.
- **Mosaic:** add the next number in `public/img/sweet/` (e.g. `24.webp`). The grid
  (`.photo-mosaic` in `src/styles/global.css`) has 24 cells — 3×8 on desktop, 2×12 on
  mobile — so raise its `grid-template-rows` count if you add more.

Keep photos around 1280px on the long edge and encode them as WebP (quality ~80).
They are displayed at 600px tall at most.

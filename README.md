# SOM & TOON — Wedding Invitation

Single-page wedding invitation for Suchanya (Som) & Nuttapon (Toon), 25 May 2025,
Virgin Ville Sanpatong, Chiang Mai. Live at <https://ststarttogether.vercel.app/>.

Built with [Astro](https://astro.build) as a static site: the invitation-turned-keepsake
homepage (plain JS/CSS + [Swiper](https://swiperjs.com)) and a guestbook at `/wishes`
(React islands + Firebase Firestore/Storage, merged in from the former
`wedding-wish-next` app).

## Commands

Requires Node.js 22.12+ or 24 (`package.json` `engines`; Vercel builds with 24.x).
`vercel.json` makes Vercel install from scratch on every build: a restored build cache once left
`tslib` (needed by Firebase) missing and broke the build.

| Command        | Action                                        |
| :------------- | :-------------------------------------------- |
| `pnpm install` | Install dependencies                          |
| `pnpm dev`     | Start the dev server at `localhost:4321`      |
| `pnpm build`   | Build the static site to `./dist/`            |
| `pnpm preview` | Preview the production build locally          |
| `pnpm check`   | Type-check `.astro` and `.ts` files           |
| `pnpm test:e2e`| Guestbook end-to-end test (see below)         |

## Project structure

```text
public/
├── bgm/bgm.MP3          Background music (loaded on the guest's first tap)
├── img/
│   ├── hero.webp        Hero background
│   ├── slide/           "Our Love Story" slider — every image here is shown, in random order per build
│   ├── wedding-day/     "Our Wedding Day" slider (file-name order); section hidden while empty
│   ├── sweet/           "Sweet Moments" mosaic — numbered 1.webp, 2.webp, … (shown in number order)
│   └── og-cover.webp    Social share image (opengraph.jpg is the JPEG copy)
src/
├── data/wedding.ts      Names, date, venue, site URL, thank-you text, video id — edit here
├── features/wishes/     Guestbook: Firebase API, React Query hooks, components, wishes.css
├── layouts/Layout.astro <head>: SEO/OG meta, JSON-LD, fonts, critical CSS
├── pages/
│   ├── index.astro      Homepage composition
│   ├── wishes/          /wishes (feed) and /wishes/new (form)
│   ├── sitemap.xml.ts   Generates /sitemap.xml
│   └── opengraph.jpg.ts Serves /opengraph.jpg
├── components/          One component per section, each with its own <script> if it needs one
├── scripts/
│   ├── intro.ts         "Loading screen finished" signal
│   └── reveal.ts        Scroll-reveal for .reveal-title / .reveal-item
├── utils/
│   ├── anniversary.ts   "Together for X years, Y months, Z days" (Thai calendar days)
│   ├── images.ts        Lists images in public/ at build time, shuffle()
│   └── throttle.ts      requestAnimationFrame throttle
└── styles/global.css    All shared styles
```

## Changing the details

Names, nicknames, birthdays, the ceremony time, the venue and the site URL all live in
[`src/data/wedding.ts`](src/data/wedding.ts). Display strings such as "Sunday, May 25,
2025", "08:39 AM" and "25 · 05 · 2025" are derived from `ceremony.start` in Thai time.

## Adding photos

- **Slider:** drop `.webp` (or `.jpg`/`.png`) files into `public/img/slide/`.
- **Mosaic:** add the next number in `public/img/sweet/` (e.g. `24.webp`). The grid
  (`.photo-mosaic` in `src/styles/global.css`) has 24 cells — 3×8 on desktop, 2×12 on
  mobile — so raise its `grid-template-rows` count if you add more.

Keep photos around 1280px on the long edge and encode them as WebP (quality ~80).
They are displayed at 600px tall at most.

## Wedding film

Set `afterWedding.highlightVideoId` in `src/data/wedding.ts` to the YouTube id (the part
after `v=` or `youtu.be/`). The section stays hidden while it is empty. Only a thumbnail
loads until the guest presses play.

## Guestbook (`/wishes`)

Guests post a name, a message and up to 5 photos (resized to 1200px in the browser);
the feed updates live, scrolls infinitely and supports likes. The homepage shows the
6 latest wishes through the Firestore REST API, so it never loads the Firebase SDK.

**Setup**

1. Set the `PUBLIC_FIREBASE_*` variables from [`.env.example`](.env.example) in the
   Vercel project (and in a local `.env`). Without them the site still builds; the
   guestbook shows a "not configured" note.
2. Deploy the security rules in [`firebase/`](firebase):
   `npx firebase-tools deploy --only firestore:rules,storage` (project from `.firebaserc`).

**Local testing with the emulators** (needs Java; never touches production data):

```sh
npx firebase-tools emulators:start --only firestore,storage --project demo-wedding   # terminal 1
pnpm build:emulator        # dist/ pointed at the emulators
npx playwright install chromium   # once
pnpm test:e2e              # 41 checks: posting + photos, likes, realtime, infinite scroll, rules…
```

For manual testing against the emulators use `pnpm dev` with the same `PUBLIC_FIREBASE_*`
values as the `build:emulator` script in `package.json`.


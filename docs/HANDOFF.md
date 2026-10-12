# Handoff — astro-wedding (11 ต.ค. 2026)

ย้ายงานจาก Claude Code cloud session ไปทำต่อบนเครื่อง local
(ไฟล์นี้ลบทิ้งได้หลังงานใน "งานที่ค้าง" เสร็จ)

---

## 1. สถานะตอนนี้

| | |
|---|---|
| เว็บจริง (production) | **https://ststarttogether.vercel.app** — deploy จาก `main` (โดเมน `ststarttogether.com` หมดอายุแล้ว) |
| Repo หลัก | `rotoon/astro-wedding` |
| Repo สมุดอวยพรเดิม | `rotoon/wedding-wish-next` — ย้ายโค้ดเข้ามาใน astro-wedding แล้ว (ยังไม่ได้ปิด) |
| Vercel projects | `wedding-web` (เว็บหลัก), `wedding-wish-next` (สมุดอวยพรเดิม) — team `rotoons-projects` |
| Firebase project | `wedding-wish-74c5d` (Firestore + Storage, คำอวยพรจริงอยู่ที่นี่) |

### PR

| PR | สถานะ | เนื้อหา |
|---|---|---|
| #2 | ✅ merged | แก้บั๊ก countdown/sitemap/JSON-LD, เพลงโหลดเมื่อแตะ, ลดขนาดรูป, a11y, ลบโค้ดตาย |
| #3 | ✅ merged | อัปเกรด Astro 5.7 → 7.3.8 (Vite 8), `pnpm audit` 73 → 0 |
| #4 | ✅ merged | Refactor: `src/data/wedding.ts`, script เป็น TS module, ลบ CSS ตาย |
| #5 | ✅ merged | ย้าย URL เป็น `ststarttogether.vercel.app` |
| **#6** | 🟡 **open** | **เนื้อหาหลังงานแต่ง + รวมสมุดอวยพรเข้ามาที่ `/wishes`** — branch `feat/post-wedding` |

PR #6: Vercel preview ✅ (env Firebase ใส่แล้วทั้ง Production/Preview), `pnpm check` 0 error,
e2e 41/41 ผ่านบน emulator, ทดสอบแบบอ่านอย่างเดียวกับ Firebase จริงแล้ว
→ **เหลือแค่ลองบนมือถือจริง (iPhone/Safari) แล้ว merge**

ดู preview ล่าสุด: หน้า PR #6 → ลิงก์ Vercel (ต้อง login Vercel เพราะ preview เปิด Vercel Authentication)

---

## 2. เริ่มทำบนเครื่อง

```sh
git clone https://github.com/rotoon/astro-wedding.git
cd astro-wedding
git checkout feat/post-wedding        # หรือ main ถ้า PR #6 merge แล้ว
pnpm install                          # Node 22.12+ หรือ 24, pnpm 10
cp .env.example .env                  # ใส่ค่า PUBLIC_FIREBASE_* (เอาจาก Vercel → wedding-web → Settings → Environment Variables)
pnpm dev                              # http://localhost:4321
```

> `vercel env pull .env` ก็ได้ ถ้าติดตั้ง Vercel CLI และ `vercel link` กับ project `wedding-web` แล้ว

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm preview` | ปกติ |
| `pnpm check` | type-check (ต้องใช้ TypeScript 6 — astro check ยังไม่รองรับ TS 7) |
| `pnpm build:emulator` + `pnpm test:e2e` | e2e สมุดอวยพรกับ Firebase emulator (ดู §5) |

---

## 3. โครงสร้างที่ควรรู้

```
src/data/wedding.ts        ← ข้อมูลทั้งหมด: ชื่อ, วันเวลา, สถานที่, URL, ข้อความขอบคุณ, YouTube id
src/pages/index.astro      ← หน้าแรก (ลำดับ section)
src/pages/wishes/          ← /wishes (feed) และ /wishes/new (ฟอร์ม)
src/features/wishes/       ← สมุดอวยพร: config, firebase, api, hooks (React Query), components, wishes.css
src/components/            ← 1 component ต่อ 1 section
src/utils/anniversary.ts   ← Together for X years/months/days (นับวันตามเวลาไทย)
src/styles/global.css      ← CSS ทั้งหมดของหน้าหลัก
firebase/                  ← Firestore/Storage rules (+ firebase.json, .firebaserc ที่ root)
vercel.json                ← บังคับติดตั้ง dependency ใหม่ทุก build (ดู §6) + cache header
tests/e2e/                 ← e2e สมุดอวยพร + รูปทดสอบ
```

- หน้าแรก **ไม่โหลด React/Firebase SDK** — กำแพงคำอวยพรใช้ Firestore REST (`WishesWall.astro`)
- React ใช้เฉพาะ `/wishes*` เป็น island `client:only` (Firebase ไม่ถูกรันฝั่ง Node ตอน build)
- ส่วน "Our Wedding Day" กับ "Our Wedding Film" **ซ่อนอยู่จนกว่าจะใส่ข้อมูล** (ดู §4)

---

## 4. งานที่ค้าง (เรียงตามลำดับที่แนะนำ)

- [ ] **ลอง preview ของ PR #6 บนมือถือจริง** — สไลด์, แตะให้เพลงเล่น, Sweet Moments, `/wishes` (ลองส่งคำอวยพรทดสอบ 1 อัน แล้วลบใน Firebase console)
- [ ] **Merge PR #6** แล้วดูว่า production deploy สำเร็จ
- [ ] **Deploy Firebase rules** (ต้อง login Firebase):
      `npx firebase-tools login` แล้ว `npx firebase-tools deploy --only firestore:rules,storage`
      (โค้ดใหม่ใช้ได้กับ rules เก่าอยู่แล้ว จึงทำหลัง merge ได้)
- [ ] **รูปวันงาน** → ใส่ไฟล์ใน `public/img/wedding-day/` (เรียงตามชื่อไฟล์, แนะนำ WebP ด้านยาว ~1280px คุณภาพ ~80)
- [ ] **วิดีโอไฮไลต์** → `afterWedding.highlightVideoId` ใน `src/data/wedding.ts` (ส่วนหลัง `v=` หรือ `youtu.be/`)
- [ ] **ข้อความขอบคุณ** → `afterWedding.thankYou.message` (ตอนนี้เป็นร่างที่ Claude เขียน)
- [ ] **Redirect สมุดอวยพรเดิม**: ใน repo `wedding-wish-next` เพิ่ม redirect ทุก path ไป `https://ststarttogether.vercel.app/wishes/`
      (เช่น `next.config.ts` → `redirects()` หรือ `vercel.json` `"redirects"`), deploy, แล้วค่อยปิด project `wedding-wish-next` ใน Vercel
- [ ] **ลบ branch ที่ merge แล้ว** (session cloud ลบให้ไม่ได้ — proxy บล็อก): `chore/astro-7`, `chore/vercel-domain`, `fix/countdown-sitemap-jsonld`, `refactor/project`, `copilot/update-swiper-button-svg-height`
      → https://github.com/rotoon/astro-wedding/branches และแนะนำเปิด Settings → General → "Automatically delete head branches"
- [ ] **ลบโดเมนเก่า** `ststarttogether.com`, `www.ststarttogether.com` ออกจาก Vercel `wedding-web` (และ `wish.ststarttogether.com` จาก `wedding-wish-next`)

### ไอเดียที่ยังไม่ได้ทำ (ไม่จำเป็น)
- Firebase **App Check** กันสแปม — ตอนนี้ใครก็โพสต์/อัปโหลดรูปได้ (rules จำกัดขนาด/ฟิลด์แล้ว แต่ไม่ได้ยืนยันตัวตน)
- ไลก์จำแค่ใน localStorage ต่อเบราว์เซอร์ (ล้าง storage แล้วไลก์ซ้ำได้) — เหมือนแอปเดิม

---

## 5. การทดสอบ

**e2e สมุดอวยพร (emulator — ไม่แตะข้อมูลจริง, ต้องมี Java):**

```sh
npx firebase-tools emulators:start --only firestore,storage --project demo-wedding   # terminal 1
pnpm build:emulator
npx playwright install chromium      # ครั้งแรกครั้งเดียว
pnpm test:e2e                        # 41 checks
```

ครอบคลุม: validation, โพสต์พร้อมรูป (ย่อ ≤1200px), server timestamp, carousel, ไลก์ครั้งเดียว/จำหลัง reload,
double-tap, เอกสารรูปแบบเก่า, realtime ข้ามแท็บ, infinite scroll, กำแพงหน้าแรก, XSS, security rules
สคริปต์จะไม่ยอมรันกับ build ที่ไม่ใช่ emulator และ **ล้างข้อมูลใน emulator** ทุกครั้ง

ยังไม่มี: unit test, CI (GitHub Actions) — ตอนนี้มีแค่ Vercel build เป็น check

---

## 6. เรื่องที่ควรรู้ / กับดัก

- **`vercel.json` ลบ `node_modules` ก่อนติดตั้งทุก build** — build แรกของ PR #6 พังด้วย
  `Rolldown failed to resolve import "tslib" from @firebase/firestore` หลัง Vercel ดึง cache เก่ามาใช้ ติดตั้งใหม่ใช้แค่ไม่กี่วินาที อย่าเอาออก
- **Vercel build ด้วย Node 24** (จาก `engines`), `@firebase/firestore` ประกาศ engines `>=24.12` — local ใช้ 22 ได้ (แค่ warning)
- **`pnpm audit`** เตือน `@grpc/grpc-js` (Firestore ล็อก `~1.9`) — ใช้เฉพาะ Firestore ฝั่ง Node ไม่อยู่ใน bundle เบราว์เซอร์ รอ Firebase อัปเดต
- **Firebase web config เป็นค่าสาธารณะ** (อยู่ใน JS ฝั่งเบราว์เซอร์อยู่แล้ว) ความปลอดภัยอยู่ที่ `firebase/*.rules`
- **Firestore REST**: ห้ามใช้ `URLSearchParams` กับ `orderBy` (ช่องว่างกลายเป็น `+` แล้ว 400) — ใน `WishesWall.astro` ประกอบ query เองแล้ว
- **IntersectionObserver ไม่ทำงานกับ element ที่ `display: none`** — กำแพงคำอวยพรจึง observe ตัว section
- `compressHTML: true` ตั้งไว้จงใจ (ค่า default ของ Astro 7 คือ `'jsx'` จะกินช่องว่างระหว่าง inline element)
- รูป hero เป็นแนวตั้ง — จอกว้างใช้ `background-position: center 70%` และย้ายวันที่/ชื่อ (`@media (min-width: 992px) and (min-aspect-ratio: 5/4)`)
- **ฟอนต์ self-host ผ่าน `@fontsource/*`** (ไม่ใช้ Google Fonts แล้ว) — เพิ่ม/ลด weight ที่ import ด้านบนของ `Layout.astro`
- **รูปใน `/img/` cache 30 วัน** (`vercel.json`) — ถ้าเปลี่ยนรูป ให้ตั้งชื่อไฟล์ใหม่ ไม่งั้นแขกบางคนจะเห็นรูปเก่า; `/assets/` (ไฟล์มี hash) cache 1 ปี
- **รูป hero มี 4 ขนาด**: `hero-800/1200/1600.webp`, `hero.webp` (2000px) — เปลี่ยนรูปต้องทำทั้ง 4 (ดู `srcset` ใน `HeroSection.astro`)
- ไม่มีหน้าโหลด (loading screen) แล้ว — เอาออกเพื่อให้ hero ขึ้นทันที
- **รูปอัลบั้มวันงาน 3 ขนาด**: `img/wedding-day/` (เต็ม, เปิดใน lightbox), `thumbs/` (ด้านยาว 640px), `thumbs/sm/` (ด้านยาว 360px สำหรับมือถือ)
  เพิ่มรูปใหม่ต้องทำทั้ง 3 ขนาด ถ้าไม่มี `thumbs/sm/` ก็ยังใช้ได้ (ตัด srcset ออกให้เอง)
- `.hero-title` เคยมองไม่เห็นตั้งแต่ commit แรก (keyframes `fadeUp` ไม่มีอยู่จริง) — แก้แล้วใน PR #6

---

## 7. ไฟล์ที่ session cloud ใช้แต่ไม่ได้ commit

เครื่องมือเหล่านี้หายไปพร้อม container — ถ้าต้องการทำซ้ำ บอก Claude ให้เขียนใหม่ได้:
- **ตัวเทียบ computed style** (dump CSS ที่คำนวณแล้วของทุก element ที่ 390px/1440px แล้ว diff ก่อน/หลัง) — ใช้ยืนยันว่า refactor ไม่เปลี่ยนหน้าตา
- สคริปต์ screenshot เทียบก่อน/หลัง, ทดสอบหน้าโหลด (hero ช้า/พัง), ปุ่มเพลง 5 สถานการณ์, นับถอยหลังแบบปลอมนาฬิกา

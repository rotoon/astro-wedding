// End-to-end guestbook test against the Firebase emulators (never touches production).
//
//   1. npx firebase-tools emulators:start --only firestore,storage --project demo-wedding
//   2. pnpm build:emulator      (builds dist/ pointed at the emulators)
//   3. pnpm test:e2e
//
// WARNING: it wipes the emulator's Firestore data between runs.
import { chromium } from 'playwright'
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'

const HERE = path.dirname(new URL(import.meta.url).pathname)
const ROOT = path.resolve(process.env.DIST_DIR || path.join(HERE, '../../dist'))
const PORT = 4600
const FIXTURES = path.join(HERE, 'fixtures')
const FS = 'http://127.0.0.1:8080/v1/projects/demo-wedding/databases/(default)/documents'
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.xml':'application/xml','.ico':'image/x-icon','.json':'application/json','.MP3':'audio/mpeg'}
http.createServer((q,r)=>{ let p=decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/')) p+='index.html'; let f=path.join(ROOT,p); if(fs.existsSync(f)&&fs.statSync(f).isDirectory()) f=path.join(f,'index.html'); if(!fs.existsSync(f)){r.writeHead(404);return r.end()} r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r) }).listen(PORT)

const configChunk = fs.readdirSync(path.join(ROOT, 'assets')).filter(f => f.startsWith('config.')).map(f => fs.readFileSync(path.join(ROOT, 'assets', f), 'utf8')).join('')
if (!configChunk.includes('demo-wedding')) { console.error('dist/ is not an emulator build — run `pnpm build:emulator` first'); process.exit(1) }

let failures = 0
const check = (label, ok, extra='') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? '  — '+extra : ''}`); if (!ok) failures++ }
const owner = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' } // emulator admin, bypasses rules
const anon = { 'Content-Type': 'application/json' }
const reset = () => fetch('http://127.0.0.1:8080/emulator/v1/projects/demo-wedding/databases/(default)/documents', { method: 'DELETE' })
const seed = (fields, headers = owner) => fetch(`${FS}/wishes`, { method: 'POST', headers, body: JSON.stringify({ fields }) })

// CHROMIUM_PATH lets you use an existing browser instead of `npx playwright install chromium`
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const page = async (vp = { width: 390, height: 844 }) => {
  const p = await b.newPage({ viewport: vp }); p.errors = []
  p.on('pageerror', e => p.errors.push(e.message))
  p.on('console', m => { if (m.type() === 'error') p.errors.push(m.text()) })
  await p.route(/fonts\.(googleapis|gstatic)\.com|i\.ytimg\.com/, r => r.abort())
  return p
}

// ---------- 1. Empty guestbook ----------
await reset()
let p = await page()
await p.goto(`http://localhost:${PORT}/wishes/`)
await p.waitForFunction(() => !document.querySelector('.wishes-spinner') && document.querySelector('.wishes-status'), null, { timeout: 15000 })
check('empty guestbook shows invitation to be first', (await p.textContent('.wishes-feed')).includes('ยังไม่มีคำอวยพร'))
check('canonical URL is per page', (await p.getAttribute('link[rel=canonical]', 'href')) === 'https://ststarttogether.vercel.app/wishes/', await p.getAttribute('link[rel=canonical]', 'href'))

// ---------- 2. Form validation ----------
const form = await page()
await form.goto(`http://localhost:${PORT}/wishes/new/`)
await form.waitForSelector('.wish-form')
await form.click('button[type=submit]')
check('empty submit shows error', (await form.textContent('.wish-error')).includes('กรุณากรอกชื่อและข้อความ'))
await form.setInputFiles('#wish-photos', path.join(FIXTURES, 'notes.txt'))
check('non-image file rejected', (await form.textContent('.wish-error')).includes('รูปภาพเท่านั้น'))
const six = Array.from({ length: 6 }, (_, i) => path.join(FIXTURES, `photo${(i % 3) + 1}.jpg`))
await form.setInputFiles('#wish-photos', six)
check('more than 5 photos rejected', (await form.textContent('.wish-error')).includes('สูงสุด 5 รูป'))

// ---------- 3. Post a wish with 2 photos ----------
await form.fill('input[type=text]', 'ทดสอบ แขกคนแรก')
await form.fill('textarea', 'ขอให้มีความสุขมากๆ นะ\nรักกันนานๆ')
await form.setInputFiles('#wish-photos', [path.join(FIXTURES, 'photo1.jpg'), path.join(FIXTURES, 'photo2.jpg')])
check('2 photo previews shown', (await form.locator('.wish-previews li').count()) === 2)
await form.click('.wish-previews li:nth-child(2) button')
check('remove photo works', (await form.locator('.wish-previews li').count()) === 1)
await form.setInputFiles('#wish-photos', path.join(FIXTURES, 'photo3.jpg'))
const msgLen = await form.$eval('textarea', t => t.value.length)
check('counter shows message length', (await form.textContent('.wish-counter')) === `${msgLen}/2000`, await form.textContent('.wish-counter'))
await form.click('button[type=submit]')
await form.waitForSelector('.wishes-status.sent', { timeout: 20000 })
check('success message after send', true)
await form.waitForURL(`http://localhost:${PORT}/wishes/`, { timeout: 5000 })
check('redirected back to /wishes/', true)
// Real cards only (:not(.wish-skeleton)): the feed shows placeholder cards while loading
await form.waitForSelector('.wish-card:not(.wish-skeleton)', { timeout: 15000 })
const card = form.locator('.wish-card:not(.wish-skeleton)').first()
check('new wish appears in feed', (await card.textContent()).includes('ทดสอบ แขกคนแรก'))
check('message keeps line break', (await card.locator('.wish-message').innerText()).includes('\n'))
check('2 photos → carousel', (await card.locator('.wish-carousel img').count()) === 2)
const imgOk = await card.locator('.wish-carousel img').first().evaluate(async (img) => { await img.decode().catch(()=>{}); return [img.naturalWidth, img.naturalHeight] })
check('uploaded photo served from storage and resized to ≤1200px', imgOk[0] > 0 && Math.max(...imgOk) <= 1200, imgOk.join('x'))
check('first page had the realtime wish (feed page A)', (await p.locator('.wish-card:not(.wish-skeleton)').count()) === 1, 'realtime into the tab opened before posting')

// stored doc shape
const stored = await (await fetch(`${FS}/wishes`, { headers: owner })).json()
const f0 = stored.documents?.[0]?.fields || {}
check('stored fields', JSON.stringify(Object.keys(f0).sort()) === JSON.stringify(['createdAt','message','name','photoURLs','reactions']), Object.keys(f0).join(','))
check('createdAt is server time (recent)', Math.abs(Date.now() - new Date(f0.createdAt?.timestampValue)) < 60000)

// ---------- 4. Carousel ----------
await card.locator('.wish-carousel-btn.next').click()
check('carousel next moves track', (await card.locator('.wish-carousel-track').getAttribute('style')).includes('-100%'))

// ---------- 5. Like ----------
const likeBtn = card.locator('.wish-like')
await likeBtn.click()
await form.waitForTimeout(800)
check('like → count 1 + liked', (await likeBtn.textContent()).trim() === '1' && (await likeBtn.getAttribute('aria-pressed')) === 'true')
await likeBtn.click(); await form.waitForTimeout(800)
check('second like ignored', (await likeBtn.textContent()).trim() === '1')
const afterLike = await (await fetch(`${FS}/wishes`, { headers: owner })).json()
check('server reactions = 1', afterLike.documents[0].fields.reactions.integerValue === '1', afterLike.documents[0].fields.reactions.integerValue)
await form.reload(); await form.waitForSelector('.wish-card:not(.wish-skeleton)')
check('liked state remembered after reload', (await form.locator('.wish-like').first().getAttribute('aria-pressed')) === 'true')

// ---------- 6. Legacy docs + double-tap ----------
await seed({ name: { stringValue: 'Legacy single photo' }, message: { stringValue: 'old format' }, photoURL: { stringValue: imgSrc() }, reactions: { integerValue: '3' }, createdAt: { timestampValue: new Date(Date.now() - 86400e3 * 30).toISOString() } })
function imgSrc() { return f0.photoURLs.arrayValue.values[0].stringValue }
await seed({ name: { stringValue: 'No photos' }, message: { stringValue: 'text only' }, photoURLs: { nullValue: null }, reactions: { integerValue: '0' }, createdAt: { timestampValue: new Date(Date.now() - 86400e3 * 31).toISOString() } })
await form.waitForTimeout(1500)
const legacy = form.locator('.wish-card:not(.wish-skeleton)', { hasText: 'Legacy single photo' })
check('legacy photoURL doc renders single image', (await legacy.locator('img.wish-photo').count()) === 1)
check('old wish shows a date, not "30 วันที่แล้ว"', /2569|2026/.test(await legacy.locator('.wish-date').textContent()), await legacy.locator('.wish-date').textContent())
check('text-only doc renders without photos', (await form.locator('.wish-card:not(.wish-skeleton)', { hasText: 'No photos' }).locator('img').count()) === 0)
await legacy.locator('.wish-photos').dblclick(); await form.waitForTimeout(800)
check('double-tap photo likes', (await legacy.locator('.wish-like').textContent()).trim() === '4')

// ---------- 7. Realtime into another open tab ----------
const before = await p.locator('.wish-card:not(.wish-skeleton)').count()
await seed({ name: { stringValue: 'Realtime guest' }, message: { stringValue: 'hello live' }, photoURLs: { nullValue: null }, reactions: { integerValue: '0' }, createdAt: { timestampValue: new Date().toISOString() } })
await p.waitForSelector('.wish-card:not(.wish-skeleton) >> text=Realtime guest', { timeout: 10000 }).catch(() => {})
check('new wish appears live in other tab', (await p.locator('.wish-card:not(.wish-skeleton)').count()) === before + 1)

// ---------- 8. Infinite scroll ----------
for (let i = 0; i < 25; i++) await seed({ name: { stringValue: `Seed ${i}` }, message: { stringValue: `seed wish ${i}` }, photoURLs: { nullValue: null }, reactions: { integerValue: '0' }, createdAt: { timestampValue: new Date(Date.now() - 86400e3 * (40 + i)).toISOString() } })
const total = (await (await fetch(`${FS}/wishes?pageSize=100`, { headers: owner })).json()).documents.length
const inf = await page()
await inf.goto(`http://localhost:${PORT}/wishes/`); await inf.waitForSelector('.wish-card:not(.wish-skeleton)')
check('first page = 10', (await inf.locator('.wish-card:not(.wish-skeleton)').count()) === 10)
for (let i = 0; i < 8; i++) { await inf.mouse.wheel(0, 4000); await inf.waitForTimeout(500) }
check(`all ${total} wishes after scrolling`, (await inf.locator('.wish-card:not(.wish-skeleton)').count()) === total, String(await inf.locator('.wish-card:not(.wish-skeleton)').count()))
check('end message shown', (await inf.textContent('.wishes-feed')).includes('ครบทั้งหมดแล้ว'))
const ids = await inf.locator('.wish-card:not(.wish-skeleton)').evaluateAll(els => els.map(e => e.id))
check('no duplicate cards', new Set(ids).size === ids.length)

// ---------- 9. Homepage wall ----------
const home = await page({ width: 1440, height: 900 })
await home.goto(`http://localhost:${PORT}/`); await home.waitForTimeout(2500)
await home.evaluate(() => document.querySelector('#wishes').scrollIntoView()); await home.waitForTimeout(1500)
check('wall shows only the 2 wishes with photos', (await home.locator('.wall-card').count()) === 2)
check('wall most-liked first', (await home.locator('.wall-card').first().textContent()).includes('Legacy single photo'))
// 3 guest photos; the 2 wish cards already show one each
check('guest photo strip skips photos shown on the cards', (await home.locator('.guest-photo').count()) === 1, String(await home.locator('.guest-photo').count()))
const homeJs = await home.evaluate(() => performance.getEntriesByType('resource').map(r => r.name).filter(n => n.endsWith('.js')).map(n => n.split('/').pop()))
check('homepage loads no Firebase/React chunk', !homeJs.some(n => /QueryProvider|client\.|WishesFeed|react\./.test(n)), homeJs.join(' '))
// XSS: a wish containing HTML must render as text
// (most liked with a real photo, so it is the first card; seeded as owner, the rules would block 50)
await seed({ name: { stringValue: '<img src=x onerror=alert(1)>' }, message: { stringValue: '<b>bold?</b>' }, photoURLs: { arrayValue: { values: [{ stringValue: 'javascript:alert(1)' }, { stringValue: 'https://example.com/tracker.png' }, { stringValue: imgSrc() }] } }, reactions: { integerValue: '50' }, createdAt: { timestampValue: new Date(Date.now() + 1000).toISOString() } })
const home2 = await page({ width: 1440, height: 900 }); let dialog = false; home2.on('dialog', d => { dialog = true; d.dismiss() })
await home2.goto(`http://localhost:${PORT}/`); await home2.waitForTimeout(2500)
await home2.evaluate(() => document.querySelector('#wishes').scrollIntoView()); await home2.waitForTimeout(1500)
check('HTML in a wish is shown as text on the wall', !dialog && (await home2.locator('.wall-card b').count()) === 0 && (await home2.locator('.wall-card').first().textContent()).includes('<b>bold?</b>'))
const foreign = await home2.evaluate(() => [...document.querySelectorAll('#wishes img, #wishes a')].map(e => e.getAttribute('src') || e.getAttribute('href')).filter(u => /javascript:|example\.com/.test(u)))
check('wall drops photo URLs outside our Storage', foreign.length === 0 && (await home2.locator('.guest-photo').count()) === 1, foreign.join(' '))
const feed2 = await page(); feed2.on('dialog', d => { dialog = true; d.dismiss() })
await feed2.goto(`http://localhost:${PORT}/wishes/`); await feed2.waitForSelector('.wish-card:not(.wish-skeleton)')
check('HTML in a wish is shown as text in the feed', !dialog && (await feed2.locator('.wish-card:not(.wish-skeleton) b').count()) === 0)
check('feed drops photo URLs outside our Storage', (await feed2.locator('.wish-card:not(.wish-skeleton) img[src*="example.com"], .wish-card:not(.wish-skeleton) img[src^="javascript:"]').count()) === 0)

// ---------- 10. Security rules (unauthenticated REST, like a malicious client) ----------
const ts = new Date().toISOString()
let r = await seed({ name: { stringValue: 'x' }, message: { stringValue: 'y' }, photoURLs: { nullValue: null }, reactions: { integerValue: '0' }, createdAt: { timestampValue: ts } }, anon)
check('rules: client-supplied createdAt rejected', r.status === 403, String(r.status))
const someId = afterLike.documents[0].name.split('/').pop()
r = await fetch(`${FS}/wishes/${someId}?updateMask.fieldPaths=reactions`, { method: 'PATCH', headers: anon, body: JSON.stringify({ fields: { reactions: { integerValue: '50' } } }) })
check('rules: reactions jump rejected', r.status === 403, String(r.status))
r = await fetch(`${FS}/wishes/${someId}?updateMask.fieldPaths=message`, { method: 'PATCH', headers: anon, body: JSON.stringify({ fields: { message: { stringValue: 'hacked' } } }) })
check('rules: editing message rejected', r.status === 403, String(r.status))
r = await fetch(`${FS}/wishes/${someId}`, { method: 'DELETE', headers: anon })
check('rules: delete rejected', r.status === 403, String(r.status))

const allErrors = [p, form, inf, home, home2, feed2].flatMap(x => x.errors).filter(e => !/ERR_FAILED|ERR_NAME|Failed to load resource|i\.ytimg/.test(e))
check('no page errors', allErrors.length === 0, allErrors.slice(0, 3).join(' | '))

console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED')
await b.close(); process.exit(failures ? 1 : 0)

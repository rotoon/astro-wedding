/**
 * Single source of truth for the wedding's names, date, venue and site URLs.
 * Components derive every display string from here, so a change (or a reuse of
 * this template for another couple) only needs editing this file.
 */

const TIME_ZONE = 'Asia/Bangkok'

export const site = {
  url: 'https://ststarttogether.vercel.app/',
  name: 'SOM&TOON START TOGETHER',
  ogImage: '/img/og-cover.webp',
  twitterHandle: '@weddingthailand',
  themeColor: '#7b5c43',
} as const

export const couple = {
  /** Short display title used for the logo, loading screen and footer */
  title: 'SOM & TOON',
  tagline: 'START TOGETHER',
  groom: {
    name: 'Nuttapon',
    nickname: 'Toon',
    thaiName: 'ณัฐพนธ์',
    birthday: 'September 8, 1989',
    description: 'Developer, passionate about travel',
    photo: '/img/groom.webp',
  },
  bride: {
    name: 'Suchanya',
    nickname: 'Som',
    thaiName: 'สุชัญญา',
    birthday: 'September 27, 1990',
    description: 'Food and Beverage, loves photography and coffee',
    photo: '/img/bride.webp',
  },
} as const

/** "Suchanya & Nuttapon" */
export const coupleNames = `${couple.bride.name} & ${couple.groom.name}`

export const ceremony = {
  /** Auspicious ceremony time, Thai time */
  start: '2025-05-25T08:39:00+07:00',
  end: '2025-05-25T15:00:00+07:00',
} as const

export const venue = {
  name: 'Wedding Venues at Virgin Ville Sanpatong Chiangmai',
  shortName: 'Virgin Ville Sanpatong, Chiangmai, Thailand',
  address: {
    street: '194/5 หมู่6 ตำบล ยุหว่า',
    locality: 'อำเภอสันป่าตอง',
    region: 'เชียงใหม่',
    postalCode: '50120',
    country: 'TH',
  },
  /** Full address as written on Google Maps */
  fullAddress: '194/5 หมู่6 ตำบล ยุหว่า อำเภอสันป่าตอง เชียงใหม่ 50120 ไทย',
  latitude: 18.6097137,
  longitude: 98.8788303,
} as const


// ---------- Date display helpers (always rendered in Thai time) ----------

const ceremonyDate = new Date(ceremony.start)

const datePart = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, ...options }).format(
    ceremonyDate
  )

/** { day: '25', month: '05', year: '2025' } */
export const dateParts = {
  day: datePart({ day: '2-digit' }),
  month: datePart({ month: '2-digit' }),
  year: datePart({ year: 'numeric' }),
} as const

export const dateDisplay = {
  /** "May 25, 2025" */
  long: datePart({ month: 'long', day: 'numeric', year: 'numeric' }),
  /** "Sunday, May 25, 2025" */
  full: datePart({
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }),
  /** "08:39 AM" */
  time: datePart({ hour: '2-digit', minute: '2-digit', hour12: true }),
  /** "25-05-2025" */
  dashed: `${dateParts.day}-${dateParts.month}-${dateParts.year}`,
  /** "25 · 05 · 2025" */
  dotted: `${dateParts.day} · ${dateParts.month} · ${dateParts.year}`,
} as const

// ---------- After the wedding ----------

export const afterWedding = {
  heroHeading: 'Just Married',
  thankYou: {
    title: 'Thank You',
    /** Draft — edit freely. Each string is a paragraph. */
    message: [
      'ขอบคุณทุกคนที่มาร่วมเป็นส่วนหนึ่งในวันสำคัญของเรา ทั้งคำอวยพร รอยยิ้ม และกำลังใจที่ส่งมาให้ เราจะเก็บทุกช่วงเวลานี้ไว้ในความทรงจำตลอดไป',
      'Thank you for celebrating with us. Your wishes, laughter and love made our day more beautiful than we ever imagined.',
    ],
    signature: `— ${couple.bride.nickname} & ${couple.groom.nickname}`,
  },
  /**
   * YouTube id of the highlight film (the part after `v=` or `youtu.be/`).
   * Leave empty to hide the video section.
   */
  highlightVideoId: 'xKU4cAmpGvI',
} as const

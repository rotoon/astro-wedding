const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "เมื่อสักครู่", "5 นาทีที่แล้ว", … then a Thai date once it is over a week old */
export const relativeTime = (date: Date, now = new Date()): string => {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < MINUTE) return 'เมื่อสักครู่'
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)} นาทีที่แล้ว`
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)} ชั่วโมงที่แล้ว`
  if (seconds < 2 * DAY) return 'เมื่อวาน'
  if (seconds < 7 * DAY) return `${Math.floor(seconds / DAY)} วันที่แล้ว`

  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  })
}

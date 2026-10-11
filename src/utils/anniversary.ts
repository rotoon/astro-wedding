/**
 * Time together since the ceremony, counted in Thai calendar days so the number
 * ticks over at midnight in Thailand wherever the guest is.
 */
const TIME_ZONE = 'Asia/Bangkok'
const DAY_MS = 24 * 60 * 60 * 1000

interface CalendarDate {
  year: number
  month: number // 1-12
  day: number
}

const thaiCalendarDate = (date: Date): CalendarDate => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day') }
}

const toUtcMidnight = ({ year, month, day }: CalendarDate) => Date.UTC(year, month - 1, day)

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

export interface Together {
  totalDays: number
  years: number
  months: number
  days: number
  /** True on the wedding date each year after the first */
  isAnniversary: boolean
}

export const timeTogether = (since: string | Date, now: Date = new Date()): Together => {
  const start = thaiCalendarDate(new Date(since))
  const today = thaiCalendarDate(now)

  const totalDays = Math.round((toUtcMidnight(today) - toUtcMidnight(start)) / DAY_MS)
  if (totalDays <= 0) {
    return { totalDays: 0, years: 0, months: 0, days: 0, isAnniversary: false }
  }

  // Calendar difference: whole years, then months, then leftover days
  let years = today.year - start.year
  let months = today.month - start.month
  let days = today.day - start.day
  if (days < 0) {
    months -= 1
    const previousMonth = today.month === 1 ? 12 : today.month - 1
    const previousYear = today.month === 1 ? today.year - 1 : today.year
    days += daysInMonth(previousYear, previousMonth)
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  return { totalDays, years, months, days, isAnniversary: years >= 1 && months === 0 && days === 0 }
}

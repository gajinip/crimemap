const NUMBER_FORMAT = new Intl.NumberFormat('en-IN')
const DATE_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
const MONTH_FORMAT = new Intl.DateTimeFormat('en-IN', { month: 'short' })

export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(value)
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : DATE_FORMAT.format(date)
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : DATE_TIME_FORMAT.format(date)
}

export function formatMonth(monthKey: string): string {
  const date = new Date(`${monthKey}-01T00:00:00+05:30`)
  return Number.isNaN(date.getTime()) ? monthKey : MONTH_FORMAT.format(date)
}

export function formatPercent(value: number, digits = 0): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`
}

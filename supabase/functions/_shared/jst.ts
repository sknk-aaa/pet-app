function jstDateString(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(date)
}

export function todayJST(): string {
  return jstDateString(new Date())
}

export function yesterdayJST(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return jstDateString(d)
}

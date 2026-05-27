import { toZonedTime, format, fromZonedTime } from 'date-fns-tz';
import { addDays, subDays, getDaysInMonth, startOfMonth } from 'date-fns';

const TZ = 'Asia/Tokyo';

function nowJST(): Date {
  return toZonedTime(new Date(), TZ);
}

export function getTodayJST(): string {
  return format(nowJST(), 'yyyy-MM-dd', { timeZone: TZ });
}

export function getYesterdayJST(): string {
  return format(subDays(nowJST(), 1), 'yyyy-MM-dd', { timeZone: TZ });
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayJST();
}

export function isYesterday(dateStr: string): boolean {
  return dateStr === getYesterdayJST();
}

export function isBefore(dateStr: string, referenceStr: string): boolean {
  return dateStr < referenceStr;
}

export function formatDisplayDate(dateStr: string): string {
  // '2026-05-27' → '2026年5月27日 (水)'
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${year}年${month}月${day}日 (${weekdays[d.getDay()]})`;
}

export function formatMonthLabel(year: number, month: number): string {
  return `${year}年${month}月`;
}

export function getMonthStartDay(year: number, month: number): number {
  // 0=日, 1=月, ..., 6=土
  return new Date(year, month - 1, 1).getDay();
}

export function getMonthTotalDays(year: number, month: number): number {
  return getDaysInMonth(new Date(year, month - 1, 1));
}

export function nowISOString(): string {
  return new Date().toISOString();
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function daysDiff(from: string, to: string): number {
  const a = new Date(from);
  const b = new Date(to);
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

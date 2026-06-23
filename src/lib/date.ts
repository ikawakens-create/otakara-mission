export function getTodayKey(): string {
  const d = new Date();
  return toDateKey(d);
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getWeekStartDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return toDateKey(monday);
}

export function isNewWeek(storedWeekStart: string, todayKey: string): boolean {
  return getWeekStartDate(todayKey) !== storedWeekStart;
}

export function formatDateJa(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekDays = ["にち", "げつ", "か", "すい", "もく", "きん", "ど"];
  const dayName = weekDays[date.getDay()];
  return `${m}がつ ${d}にち（${dayName}）`;
}

/** 週オフセット（0=今週, -1=先週）から週の月曜日のキーを返す */
export function getWeekStartForOffset(offset: number): string {
  const today = getTodayKey();
  const currentStart = getWeekStartDate(today);
  const [y, m, d] = currentStart.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + offset * 7);
  return toDateKey(date);
}

/** 週の月曜日キーから月〜日の7日間のキー配列を返す */
export function getWeekDays(weekStartDate: string): string[] {
  const [y, m, d] = weekStartDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return toDateKey(date);
  });
}

/** その月の全日キー配列を返す（カレンダー先頭の空白 null を含む） */
export function getMonthCalendar(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0, Sun=6

  const result: (string | null)[] = [];
  for (let i = 0; i < startDow; i++) result.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    result.push(
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }
  while (result.length % 7 !== 0) result.push(null);
  return result;
}

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function getCurrentMonthKey(): string {
  const d = new Date();
  return getMonthKey(d.getFullYear(), d.getMonth() + 1);
}

/** dateKey から年・月を返す */
export function parseYearMonth(dateKey: string): { year: number; month: number } {
  const [y, m] = dateKey.split("-").map(Number);
  return { year: y, month: m };
}

/** "YYYY-MM" から月オフセット（0=今月, -1=先月）後のキーを返す */
export function getMonthKeyForOffset(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return getMonthKey(d.getFullYear(), d.getMonth() + 1);
}

export const DAY_NAMES_JA = ["月", "火", "水", "木", "金", "土", "日"];

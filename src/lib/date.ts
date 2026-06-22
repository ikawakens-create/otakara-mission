export function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getWeekStartDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay();
  // 月曜始まり（0=日曜→6にずらす）
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const my = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const md = String(monday.getDate()).padStart(2, "0");
  return `${my}-${mm}-${md}`;
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

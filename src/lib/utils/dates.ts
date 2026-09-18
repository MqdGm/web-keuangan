import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatDate(date: string | Date, formatStr: string = 'dd MMM yyyy'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr, { locale: id });
  } catch {
    return String(date);
  }
}

export function formatFriendlyDate(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (isToday(d)) return 'Hari ini';
    if (isYesterday(d)) return 'Kemarin';
    return format(d, 'EEEE, d MMM yyyy', { locale: id });
  } catch {
    return String(date);
  }
}

export function formatMonthYear(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMMM yyyy', { locale: id });
  } catch {
    return String(date);
  }
}

export function formatRelativeTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: id });
  } catch {
    return String(date);
  }
}

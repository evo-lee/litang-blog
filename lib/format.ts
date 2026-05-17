import type { AppLocale } from '@/lib/i18n/config';

const READ_TIME_LABEL: Record<AppLocale, (minutes: number) => string> = {
  'zh-CN': (m) => `${m} 分钟`,
  en: (m) => `${m} min read`,
};

export function formatDate(date: Date, locale: AppLocale = 'zh-CN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatMonth(date: Date, locale: AppLocale = 'zh-CN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatReadTime(text: string, locale: AppLocale = 'zh-CN'): string {
  const charCount = text.length;
  const minutes = Math.max(1, Math.round(charCount / 500));
  return READ_TIME_LABEL[locale](minutes);
}

export function groupPostsByMonth<T extends { date: Date }>(items: T[]): Array<{
  key: string;
  items: T[];
}> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
    groups.set(key, [...(groups.get(key) || []), item]);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, groupedItems]) => ({
      key,
      items: groupedItems.sort((a, b) => b.date.getTime() - a.date.getTime()),
    }));
}

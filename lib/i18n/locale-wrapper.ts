import { APP_LOCALES, isAppLocale, type AppLocale } from './config';

export type LocaleParamsPromise = Promise<{ locale: string }>;

export function localeStaticParams() {
  return APP_LOCALES.map((locale) => ({ locale }));
}

export async function resolveLocaleSearchParams(
  params: LocaleParamsPromise
): Promise<{ __locale: AppLocale }> {
  const { locale } = await params;
  return { __locale: isAppLocale(locale) ? locale : 'zh-CN' };
}

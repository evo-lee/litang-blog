import HomePage, { generateMetadata as generateBaseMetadata } from '@/app/(site)/page';
import { localeStaticParams, resolveLocaleSearchParams, type LocaleParamsPromise } from '@/lib/i18n/locale-wrapper';

type PageProps = { params: LocaleParamsPromise };

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps) {
  return generateBaseMetadata({ searchParams: resolveLocaleSearchParams(params) });
}

export default function LocaleHomePage({ params }: PageProps) {
  return <HomePage searchParams={resolveLocaleSearchParams(params)} />;
}

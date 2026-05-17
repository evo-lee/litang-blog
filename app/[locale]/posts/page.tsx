import PostsPage, { generateMetadata as generateBaseMetadata } from '@/app/(site)/posts/page';
import { localeStaticParams, resolveLocaleSearchParams, type LocaleParamsPromise } from '@/lib/i18n/locale-wrapper';

type PageProps = { params: LocaleParamsPromise };

export const generateStaticParams = localeStaticParams;

export async function generateMetadata({ params }: PageProps) {
  return generateBaseMetadata({ searchParams: resolveLocaleSearchParams(params) });
}

export default function LocalePostsPage({ params }: PageProps) {
  return <PostsPage searchParams={resolveLocaleSearchParams(params)} />;
}

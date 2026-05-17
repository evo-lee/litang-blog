import PostPage, {
  generateMetadata as generateBaseMetadata,
  generateStaticParams as generateBaseStaticParams,
} from '@/app/(site)/posts/[slug]/page';
import { APP_LOCALES } from '@/lib/i18n/config';
import { resolveLocaleSearchParams, type LocaleParamsPromise } from '@/lib/i18n/locale-wrapper';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const posts = generateBaseStaticParams();
  return APP_LOCALES.flatMap((locale) => posts.map((post) => ({ locale, slug: post.slug })));
}

async function slugParams(params: PageProps['params']) {
  const { slug } = await params;
  return { slug };
}

export async function generateMetadata({ params }: PageProps) {
  return generateBaseMetadata({
    params: slugParams(params),
    searchParams: resolveLocaleSearchParams(params as LocaleParamsPromise),
  });
}

export default function LocalePostPage({ params }: PageProps) {
  return (
    <PostPage
      params={slugParams(params)}
      searchParams={resolveLocaleSearchParams(params as LocaleParamsPromise)}
    />
  );
}

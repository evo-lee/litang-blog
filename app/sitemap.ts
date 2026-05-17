import type { MetadataRoute } from 'next';
import { getRuntimePostBySlug, getRuntimePosts } from '@/lib/content/runtime';
import { APP_LOCALES } from '@/lib/i18n/config';
import { siteConfig } from '@/lib/site';

const STATIC_PATHS = ['', '/posts', '/projects', '/about'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    entries.push({ url: `${siteConfig.baseUrl}${path || '/'}` });
    for (const locale of APP_LOCALES) {
      entries.push({ url: `${siteConfig.baseUrl}/${locale}${path}` });
    }
  }

  for (const locale of APP_LOCALES) {
    const posts = getRuntimePosts(locale);
    for (const summary of posts) {
      const post = getRuntimePostBySlug(summary.slug, locale);
      if (!post) continue;
      const lastModified = post.updated || post.date;
      entries.push({
        url: `${siteConfig.baseUrl}${locale === 'zh-CN' ? '' : `/${locale}`}${post.url}`,
        lastModified,
      });
    }
  }

  return entries;
}

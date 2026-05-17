import { siteConfig } from '@/lib/site';

export const seoConfig = {
  siteName: siteConfig.name,
  siteTitle: siteConfig.title,
  siteDescription: siteConfig.description,
  baseUrl: siteConfig.baseUrl,
  locale: siteConfig.locale,
  defaultOgImage: `${siteConfig.baseUrl}${siteConfig.seo.defaultOgImage}`,
  author: {
    name: siteConfig.author.name,
    url: siteConfig.author.url || siteConfig.baseUrl,
  },
} as const;

/**
 * Single source of truth for site-wide personalization.
 * Fork this project: change values here and most of the site re-skins.
 */
export const siteConfig = {
  // Identity
  name: '刻意进化',
  title: "evo-lee's blog · lee刻意进化",
  description: 'AI 时代，是否要主动学习与进化完全掌握在自己手中。',
  baseUrl: 'https://litang.one',
  locale: 'zh-CN',

  // Author
  author: {
    name: 'evolee',
    handle: 'evo-lee',
    url: 'https://litang.one',
    email: '',
    avatar: '/avatar.jpg',
  },

  // Social / external links (empty string hides the entry)
  social: {
    github: 'https://github.com/evo-lee',
    twitter: '',
    email: '',
    rss: '/rss.xml',
  },

  // Footer copy
  footer: {
    brand: "evo-lee's blog",
    tagline: 'lee刻意进化',
    credits: '用 Lora · DM Sans 排版',
  },

  // SEO defaults
  seo: {
    defaultOgImage: '/og-default.svg',
  },

  // Navigation
  nav: [
    { id: 'home', href: '/', label: '首页' },
    { id: 'posts', href: '/posts', label: '文章' },
    { id: 'projects', href: '/projects', label: '作品' },
    { id: 'about', href: '/about', label: '关于' },
  ],

  // Feature flags (build-time only — runtime gating still uses NEXT_PUBLIC_*)
  features: {
    heti: true,
    umami: true,
    ga: true,
  },
} as const;

export type SiteConfig = typeof siteConfig;

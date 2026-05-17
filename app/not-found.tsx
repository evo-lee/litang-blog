'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getLocalePrefix, prefixToLocale } from '@/lib/i18n/routes';

const COPY = {
  'zh-CN': {
    title: '页面不存在',
    body: '这个地址没有内容，可能已被移除或从未存在。',
    home: '返回首页',
  },
  en: {
    title: 'Page not found',
    body: 'This URL has no content. It may have been removed or never existed.',
    home: 'Back to home',
  },
} as const;

export default function NotFound() {
  const pathname = usePathname() || '/';
  const prefix = getLocalePrefix(pathname);
  const locale = prefixToLocale(prefix);
  const copy = COPY[locale];
  const homeHref = prefix || '/';

  return (
    <main className="error-panel">
      <p className="meta-note">404</p>
      <h1>{copy.title}</h1>
      <p>{copy.body}</p>
      <p>
        <Link href={homeHref}>{copy.home}</Link>
      </p>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { formatDate, formatReadTime } from '@/lib/format';
import { getLocalePrefix, prefixToLocale, withLocalePrefix } from '@/lib/i18n/routes';
import type { PostSummary } from '@/lib/content/types';
import { CoverPlaceholder, pickCoverColor } from './CoverPlaceholder';

export function PostCard({
  post,
  featured = false,
  index = 0,
}: {
  post: PostSummary;
  featured?: boolean;
  index?: number;
}) {
  const cardClass = featured ? 'post-card post-card--featured' : 'post-card';
  const coverClass = featured ? 'post-card__cover post-card__cover--featured' : 'post-card__cover';
  const pathname = usePathname() || '/';
  const localePrefix = getLocalePrefix(pathname);
  const locale = prefixToLocale(localePrefix);
  const readTime = formatReadTime(post.excerpt || post.description || post.title, locale);

  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const delay = Math.min(index, 8) * 120;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => el.classList.add('is-revealed'), delay);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [index]);

  return (
    <Link
      ref={cardRef}
      href={withLocalePrefix(post.url, localePrefix)}
      className={cardClass}
    >
      <div className={coverClass}>
        <div className="post-card__cover-inner">
          {post.coverImage?.src && post.coverImage.source !== 'default' ? (
            <img
              src={post.coverImage.src}
              alt={post.coverImage.alt || post.title}
              className="post-card__cover-img"
            />
          ) : (
            <CoverPlaceholder color={pickCoverColor(post.slug)} />
          )}
        </div>
        <div className="post-card__cover-overlay" aria-hidden="true" />
      </div>
      <div className="post-card__body">
        <div className="post-card__meta">
          <span>{formatDate(post.date, locale)}</span>
          <span className="post-card__meta-dot">·</span>
          <span>{readTime}</span>
        </div>
        <h3 className="post-card__title">{post.title}</h3>
        <p className="post-card__excerpt">{post.excerpt || post.description}</p>
        {post.tags.length > 0 && (
          <div className="tag-row">
            {post.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

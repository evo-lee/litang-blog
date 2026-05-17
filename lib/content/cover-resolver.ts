import type { CoverResolution } from './types';

const DEFAULT_COVER_ALT = 'Default blog cover';
const DEFAULT_COVER_SRC = '/images/default-cover.svg';

function getFirstImageFromHtml(html: string): { src: string; alt: string } | null {
  const match = html.match(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/i);
  if (!match) {
    return null;
  }

  return {
    src: match[1],
    alt: match[2] || DEFAULT_COVER_ALT,
  };
}

/**
 * Resolve the cover image for a post using a deterministic fallback chain.
 * Pure: no filesystem writes. Safe for read-only runtimes.
 */
export async function resolveCoverImage({
  html,
  cover,
  coverAlt,
}: {
  slug?: string;
  html: string;
  cover?: string;
  coverAlt?: string;
}): Promise<CoverResolution> {
  if (cover) {
    return {
      src: cover,
      alt: coverAlt || DEFAULT_COVER_ALT,
      source: 'frontmatter',
    };
  }

  const firstImage = getFirstImageFromHtml(html);
  if (firstImage) {
    return { ...firstImage, source: 'first-image' };
  }

  return {
    src: DEFAULT_COVER_SRC,
    alt: DEFAULT_COVER_ALT,
    source: 'default',
  };
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCoverImage } from '@/lib/content/cover-resolver';

test('resolveCoverImage prefers frontmatter cover over body images', async () => {
  const cover = await resolveCoverImage({
    slug: 'test-frontmatter-cover',
    html: '<p><img src="/images/body.svg" alt="Body image"></p>',
    cover: '/images/frontmatter.svg',
    coverAlt: 'Frontmatter image',
  });

  assert.deepEqual(cover, {
    src: '/images/frontmatter.svg',
    alt: 'Frontmatter image',
    source: 'frontmatter',
  });
});

test('resolveCoverImage falls back to the first body image', async () => {
  const cover = await resolveCoverImage({
    slug: 'test-first-body-image',
    html: '<p>Intro</p><img src="/images/body.svg" alt="Body image"><p>Outro</p>',
  });

  assert.deepEqual(cover, {
    src: '/images/body.svg',
    alt: 'Body image',
    source: 'first-image',
  });
});

test('resolveCoverImage falls back to the site default when no image exists', async () => {
  const cover = await resolveCoverImage({
    slug: 'test-default-cover',
    html: '<p>No images here.</p>',
  });

  assert.deepEqual(cover, {
    src: '/images/default-cover.svg',
    alt: 'Default blog cover',
    source: 'default',
  });
});

import { NextResponse } from 'next/server';
import { decodeImageToken, getVariantConfig, VARIANT_CATALOG, type ImageVariant } from '@/lib/cloudflare/images';

function isVariant(value: string): value is ImageVariant {
  return value in VARIANT_CATALOG;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ variant: string; token: string }> }
) {
  const { variant, token } = await params;

  if (!isVariant(variant)) {
    return new NextResponse('Unknown image variant', { status: 404 });
  }

  let src: string;
  try {
    src = decodeImageToken(token);
  } catch {
    return new NextResponse('Invalid image token', { status: 400 });
  }

  if (!src.startsWith('/')) {
    return new NextResponse('Image source not allowed', { status: 400 });
  }

  const requestUrl = new URL(request.url);
  let target: URL;
  try {
    target = new URL(src, requestUrl);
  } catch {
    return new NextResponse('Invalid image source', { status: 400 });
  }

  if (target.origin !== requestUrl.origin || target.pathname.startsWith('/image/')) {
    return new NextResponse('Image source not allowed', { status: 400 });
  }

  const upstream = await fetch(target.toString());

  if (!upstream.ok) {
    return new NextResponse('Image source unavailable', { status: 404 });
  }

  const config = getVariantConfig(variant);
  const headers = new Headers(upstream.headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Image-Variant', variant);
  headers.set('X-Image-Width', String(config.width));
  headers.set('X-Image-Height', String(config.height));

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}


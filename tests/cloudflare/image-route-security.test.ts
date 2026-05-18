import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '@/app/image/[variant]/[token]/route';
import { encodeImageToken, VARIANT_CATALOG } from '@/lib/cloudflare/images';

const ORIGIN = 'https://blog.test';

type FetchCall = { url: string; init?: RequestInit };

function installFetchStub(response: Response): { calls: FetchCall[]; restore: () => void } {
  const original = globalThis.fetch;
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init });
    return response.clone();
  }) as typeof fetch;

  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

function makeRequest(variant: string, token: string): Request {
  return new Request(`${ORIGIN}/image/${variant}/${token}`);
}

function invoke(variant: string, token: string): Promise<Response> {
  return GET(makeRequest(variant, token), {
    params: Promise.resolve({ variant, token }),
  });
}

function rawToken(payload: string): string {
  return Buffer.from(payload, 'utf8').toString('base64url');
}

test('image route: unknown variant returns 404 without touching upstream', async () => {
  const stub = installFetchStub(new Response('ok', { status: 200 }));
  try {
    const res = await invoke('unknown-variant', encodeImageToken('/images/x.png'));
    assert.equal(res.status, 404);
    assert.equal(stub.calls.length, 0, 'must not fetch upstream on bad variant');
    assert.equal(res.headers.get('Cache-Control'), null, 'error responses must not be cacheable');
  } finally {
    stub.restore();
  }
});

test('image route: rejects absolute http(s) URLs (SSRF guard)', async () => {
  const stub = installFetchStub(new Response('should not be reached', { status: 200 }));
  try {
    for (const evil of [
      'http://evil.example/x.png',
      'https://evil.example/x.png',
      'HTTPS://EVIL.example/x.png',
    ]) {
      const res = await invoke('cover-md', rawToken(evil));
      assert.equal(res.status, 400, `absolute URL must be rejected: ${evil}`);
    }
    assert.equal(stub.calls.length, 0, 'no upstream fetch for absolute URLs');
  } finally {
    stub.restore();
  }
});

test('image route: rejects protocol-relative URLs (//host smuggling)', async () => {
  const stub = installFetchStub(new Response('should not be reached', { status: 200 }));
  try {
    const res = await invoke('cover-md', rawToken('//evil.example/x.png'));
    assert.equal(res.status, 400);
    assert.equal(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

test('image route: rejects recursive /image/ paths (amplification guard)', async () => {
  const stub = installFetchStub(new Response('should not be reached', { status: 200 }));
  try {
    const res = await invoke('cover-md', rawToken('/image/cover-md/abc'));
    assert.equal(res.status, 400);
    assert.equal(stub.calls.length, 0, 'must not allow image route to call itself');
  } finally {
    stub.restore();
  }
});

test('image route: rejects non-http schemes (data:, file:, javascript:)', async () => {
  const stub = installFetchStub(new Response('should not be reached', { status: 200 }));
  try {
    for (const evil of [
      'data:image/svg+xml,<svg/>',
      'file:///etc/passwd',
      'javascript:alert(1)',
      'gopher://evil.example/x',
    ]) {
      const res = await invoke('thumb-md', rawToken(evil));
      assert.equal(res.status, 400, `scheme must be rejected: ${evil}`);
    }
    assert.equal(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

test('image route: rejects empty / whitespace / control-prefix tokens', async () => {
  const stub = installFetchStub(new Response('should not be reached', { status: 200 }));
  try {
    for (const evil of ['', ' /images/x.png', '\n/images/x.png', '\t/images/x.png']) {
      const res = await invoke('thumb-sm', rawToken(evil));
      assert.equal(res.status, 400, `must reject payload starting with non-slash: ${JSON.stringify(evil)}`);
    }
    assert.equal(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

test('image route: path traversal cannot escape origin', async () => {
  const stub = installFetchStub(new Response('body', { status: 200 }));
  try {
    const res = await invoke('cover-md', rawToken('/../../../etc/passwd'));
    assert.equal(stub.calls.length, 1, 'same-origin path is allowed');
    const fetched = new URL(stub.calls[0].url);
    assert.equal(fetched.origin, ORIGIN, 'traversal must not escape request origin');
    assert.equal(fetched.pathname, '/etc/passwd', 'URL parser normalizes traversal segments');
    assert.equal(res.status, 200);
  } finally {
    stub.restore();
  }
});

test('image route: backslash smuggling (/\\evil.com) is rejected', async () => {
  const stub = installFetchStub(new Response('should not be reached', { status: 200 }));
  try {
    // WHATWG normalizes "\" → "/" for http URLs, so a naive startsWith('//') guard misses /\host
    const res = await invoke('cover-md', rawToken('/\\evil.example/x.png'));
    assert.equal(res.status, 400, 'backslash must not bypass cross-origin guard');
    assert.equal(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

test('image route: tab/CR/LF smuggling cannot cross origin', async () => {
  const stub = installFetchStub(new Response('should not be reached', { status: 200 }));
  try {
    // WHATWG strips \t \r \n during URL parse, so "/\t/evil" becomes "//evil" after parsing
    for (const evil of ['/\t/evil.example/x.png', '/\r/evil.example/x.png', '/\n/evil.example/x.png']) {
      const res = await invoke('cover-md', rawToken(evil));
      assert.equal(res.status, 400, `control-char smuggling must be rejected: ${JSON.stringify(evil)}`);
    }
    assert.equal(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

test('image route: legitimate URL-encoded and unicode paths still pass origin check', async () => {
  const stub = installFetchStub(new Response('pixels', { status: 200 }));
  try {
    const res = await invoke('cover-md', rawToken('/images/foo%20bar.png'));
    assert.equal(res.status, 200);
    assert.equal(new URL(stub.calls[0].url).origin, ORIGIN);
  } finally {
    stub.restore();
  }
});

test('image route: variant catalog is closed set (no surprise variants)', () => {
  const expected = ['thumb-sm', 'thumb-md', 'cover-md', 'cover-lg', 'og-cover'];
  assert.deepEqual(Object.keys(VARIANT_CATALOG).sort(), expected.sort());
});

test('image route: upstream 404 propagates without immutable cache poisoning', async () => {
  const stub = installFetchStub(new Response('missing', { status: 404 }));
  try {
    const res = await invoke('cover-md', encodeImageToken('/images/missing.png'));
    assert.equal(res.status, 404);
    assert.equal(
      res.headers.get('Cache-Control'),
      null,
      'must not cache attacker-probed misses for a year'
    );
  } finally {
    stub.restore();
  }
});

test('image route: successful fetch returns immutable cache and variant metadata', async () => {
  const stub = installFetchStub(
    new Response('pixels', {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    })
  );
  try {
    const res = await invoke('cover-md', encodeImageToken('/images/ok.png'));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
    assert.equal(res.headers.get('X-Image-Variant'), 'cover-md');
    assert.equal(res.headers.get('X-Image-Width'), '1200');
    assert.equal(res.headers.get('X-Image-Height'), '600');
    assert.equal(stub.calls.length, 1);
    assert.equal(new URL(stub.calls[0].url).origin, ORIGIN);
  } finally {
    stub.restore();
  }
});

test('image route: encodeImageToken normalizes data: sources to default cover', async () => {
  // attacker cannot smuggle a data: URL via the public encoder; decoded payload becomes the default image path.
  const stub = installFetchStub(new Response('pixels', { status: 200 }));
  try {
    const token = encodeImageToken('data:image/svg+xml,<svg onload=alert(1)/>');
    const res = await invoke('thumb-md', token);
    assert.equal(res.status, 200);
    assert.equal(stub.calls.length, 1);
    assert.equal(new URL(stub.calls[0].url).pathname, '/images/default-cover.svg');
  } finally {
    stub.restore();
  }
});

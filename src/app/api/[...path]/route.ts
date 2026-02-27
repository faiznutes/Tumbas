const DEFAULT_INTERNAL_API_BASE = 'http://backend:3001/api';

function getInternalApiBase() {
  const configured = process.env.INTERNAL_API_BASE_URL?.trim();
  if (!configured) return DEFAULT_INTERNAL_API_BASE;
  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
}

function buildTargetUrl(path: string[], search: string) {
  const base = getInternalApiBase();
  const joined = path.join('/');
  return `${base}/${joined}${search}`;
}

async function proxy(request: Request, path: string[]) {
  const requestUrl = new URL(request.url);
  const targetUrl = buildTargetUrl(path, requestUrl.search);

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(targetUrl, init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('content-length');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const params = await context.params;
  return proxy(request, params.path ?? []);
}

export async function POST(request: Request, context: RouteContext) {
  const params = await context.params;
  return proxy(request, params.path ?? []);
}

export async function PUT(request: Request, context: RouteContext) {
  const params = await context.params;
  return proxy(request, params.path ?? []);
}

export async function PATCH(request: Request, context: RouteContext) {
  const params = await context.params;
  return proxy(request, params.path ?? []);
}

export async function DELETE(request: Request, context: RouteContext) {
  const params = await context.params;
  return proxy(request, params.path ?? []);
}

export async function OPTIONS(request: Request, context: RouteContext) {
  const params = await context.params;
  return proxy(request, params.path ?? []);
}

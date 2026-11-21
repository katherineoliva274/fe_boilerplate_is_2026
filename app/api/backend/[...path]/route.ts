import { NextRequest, NextResponse } from "next/server";
import { backendApiUrl } from "@/lib/backend-url";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  setSessionCookies,
  type TokenPair,
} from "@/lib/session";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

const allowedMethods = new Set(["GET", "POST", "PATCH", "PUT", "DELETE"]);
const refreshInFlight = new Map<string, Promise<TokenPair | null>>();

function jsonError(status: number, message: string) {
  return NextResponse.json({ statusCode: status, message }, { status });
}

function isPublicRequest(method: string, path: string[]) {
  return method === "POST" && path.length === 1 && path[0] === "users";
}

async function rotate(refreshToken: string): Promise<TokenPair | null> {
  const existing = refreshInFlight.get(refreshToken);
  if (existing) return existing;
  const pending = (async () => {
    try {
      const response = await fetch(backendApiUrl("auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
      if (!response.ok) return null;
      const value = (await response.json()) as Partial<TokenPair>;
      return typeof value.accessToken === "string" && typeof value.refreshToken === "string"
        ? { accessToken: value.accessToken, refreshToken: value.refreshToken, expiresIn: value.expiresIn }
        : null;
    } catch {
      return null;
    } finally {
      refreshInFlight.delete(refreshToken);
    }
  })();
  refreshInFlight.set(refreshToken, pending);
  return pending;
}

async function forward(
  request: NextRequest,
  segments: string[],
  body: ArrayBuffer | undefined,
  accessToken?: string,
) {
  const url = backendApiUrl(segments.join("/"), request.nextUrl.search);
  const headers = new Headers();
  const accept = request.headers.get("accept");
  const contentType = request.headers.get("content-type");
  if (accept) headers.set("Accept", accept);
  if (contentType) headers.set("Content-Type", contentType);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(url, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
  });
}

async function handle(request: NextRequest, context: RouteContext) {
  if (!allowedMethods.has(request.method)) return jsonError(405, "Método no permitido.");
  const { path } = await context.params;
  if (!path?.length || path.some((part) => !part || part === "." || part === "..")) {
    return jsonError(400, "Ruta inválida.");
  }

  const isPublic = isPublicRequest(request.method, path);
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!access && !isPublic) return jsonError(401, "Sesión no autenticada.");
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await forward(request, path, body, access);
  } catch {
    return jsonError(502, "No se pudo conectar con el backend. Verifica que la API esté activa.");
  }

  let rotated: TokenPair | null = null;
  if (upstream.status === 401 && access && refresh) {
    rotated = await rotate(refresh);
    if (rotated) {
      try {
        upstream = await forward(request, path, body, rotated.accessToken);
      } catch {
        return jsonError(502, "No se pudo conectar con el backend.");
      }
    }
  }

  const responseHeaders = new Headers();
  for (const name of ["content-type", "content-disposition", "cache-control"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  const result = new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  if (rotated) setSessionCookies(result, rotated);
  else if (upstream.status === 401 && access && refresh) clearSessionCookies(result);
  return result;
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;

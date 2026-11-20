import { NextResponse, type NextRequest } from "next/server";
import { backendApiUrl } from "@/lib/backend-url";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  setSessionCookies,
  type TokenPair,
} from "@/lib/session";

function tokenNeedsRefresh(token?: string) {
  if (!token) return true;
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(normalized)) as { exp?: number };
    return !claims.exp || claims.exp * 1000 <= Date.now() + 45_000;
  } catch {
    return true;
  }
}

async function rotate(refreshToken: string): Promise<TokenPair | null> {
  try {
    const response = await fetch(backendApiUrl("auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const value = await response.json() as Partial<TokenPair>;
    return typeof value.accessToken === "string" && typeof value.refreshToken === "string"
      ? { accessToken: value.accessToken, refreshToken: value.refreshToken, expiresIn: value.expiresIn }
      : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/login" || pathname === "/registro" || pathname === "/manus-routes.json";
  if (isPublic) return NextResponse.next();

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (access && !tokenNeedsRefresh(access)) return NextResponse.next();

  if (refresh) {
    const tokens = await rotate(refresh);
    if (tokens) {
      const response = NextResponse.next();
      setSessionCookies(response, tokens);
      return response;
    }
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookies(response);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

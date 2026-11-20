import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "gkds_access";
export const REFRESH_COOKIE = "gkds_refresh";
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
};

function cookieOptions(maxAge: number) {
  const secure = process.env.COOKIE_SECURE === "true";
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge,
  };
}

export async function createSession(tokens: TokenPair) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.expiresIn ?? 900));
  jar.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_TTL_SECONDS));
}

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

/** Compatibilidad con las acciones existentes; devuelve solo el access token HttpOnly. */
export async function getSession() {
  return getAccessToken();
}

export async function getRefreshToken() {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

export async function deleteSession() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export function setSessionCookies(response: NextResponse, tokens: TokenPair) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.expiresIn ?? 900));
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_TTL_SECONDS));
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
}

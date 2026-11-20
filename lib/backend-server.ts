import "server-only";
import { backendApiUrl } from "@/lib/backend-url";
import { getAccessToken } from "@/lib/session";

export async function backendServerFetch(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(backendApiUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });
}

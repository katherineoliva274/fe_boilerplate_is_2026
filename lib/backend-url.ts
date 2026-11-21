import "server-only";

const API_PREFIX = "/api/v1";

export function backendApiUrl(path: string, search = ""): URL {
  const configured = process.env.API_URL?.trim();
  if (!configured) throw new Error("Falta configurar API_URL.");

  const base = new URL(configured);
  const currentPath = base.pathname.replace(/\/+$/, "");
  const apiRoot = currentPath.endsWith(API_PREFIX)
    ? currentPath
    : `${currentPath}${API_PREFIX}`;
  const cleanPath = path
    .split("?")[0]
    .split("/")
    .filter(Boolean)
    .filter((part, index) => !(index === 0 && part === "api") && !(index === 1 && part === "v1"))
    .map(encodeURIComponent)
    .join("/");

  const url = new URL(`${apiRoot}/${cleanPath}`, base.origin);
  if (search) url.search = search.startsWith("?") ? search : `?${search}`;
  return url;
}

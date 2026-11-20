export class BackendRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "BackendRequestError";
  }
}

function bffUrl(path: string) {
  const [pathname, query = ""] = path.replace(/^\/+/, "").split("?", 2);
  const encoded = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/api/backend/${encoded}${query ? `?${query}` : ""}`;
}

async function readError(response: Response) {
  const raw = await response.text().catch(() => "");
  if (!raw) return `La solicitud falló (${response.status}).`;
  try {
    const parsed = JSON.parse(raw) as { message?: string | string[]; error?: string };
    const message = Array.isArray(parsed.message) ? parsed.message.join(" ") : parsed.message;
    return message || parsed.error || `La solicitud falló (${response.status}).`;
  } catch {
    return raw.slice(0, 500);
  }
}

export async function backendRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type") && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(bffUrl(path), {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new BackendRequestError(await readError(response), response.status);
  }
  if (response.status === 204) return undefined as T;
  if (response.headers.get("content-type")?.includes("application/pdf")) {
    return (await response.blob()) as T;
  }
  return (await response.json()) as T;
}

export async function backendDownload(path: string): Promise<Blob> {
  const response = await fetch(bffUrl(path), {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new BackendRequestError(await readError(response), response.status);
  }
  return response.blob();
}

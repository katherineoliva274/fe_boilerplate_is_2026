"use server";

import { redirect } from "next/navigation";
import { backendApiUrl } from "@/lib/backend-url";
import { createSession, deleteSession, getRefreshToken, type TokenPair } from "@/lib/session";

export type LoginState = {
  error?: string;
  email?: string;
};

type UserRole = "RECEPCION_ADMIN" | "ENTRENADOR" | "MIEMBRO";
type AuthResponse = TokenPair & {
  user: { id: string; email: string; role: UserRole; isActive: boolean };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function messageFrom(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const message = (value as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === "string").join(" ");
  return fallback;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Ingresa tu correo y contraseña.", email };
  if (!EMAIL_REGEX.test(email)) return { error: "Ingresa un correo válido.", email };

  let authenticatedUser: AuthResponse["user"];
  let redirectTo: string;
  try {
    const response = await fetch(backendApiUrl("auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null) as Partial<AuthResponse> | null;
    if (response.status === 401 || response.status === 403) {
      return { error: "Correo o contraseña incorrectos.", email };
    }
    if (!response.ok || !payload?.accessToken || !payload.refreshToken || !payload.user) {
      return { error: messageFrom(payload, "No se pudo iniciar sesión. Intenta nuevamente."), email };
    }
    if (!payload.user.isActive || !["RECEPCION_ADMIN", "ENTRENADOR", "MIEMBRO"].includes(payload.user.role)) {
      return { error: "La cuenta no está activa o no tiene un rol habilitado.", email };
    }
    authenticatedUser = payload.user;
    await createSession({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      expiresIn: payload.expiresIn,
    });
    redirectTo = authenticatedUser.role === "RECEPCION_ADMIN"
      ? "/admin"
      : authenticatedUser.role === "ENTRENADOR"
        ? "/entrenador"
        : "/mi-membresia";
  } catch (error) {
    // Next's redirect is a control-flow exception and must escape this block.
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    console.error("No se pudo conectar con el backend durante el login.");
    return { error: "No se pudo conectar con el backend. Verifica que la API esté activa.", email };
  }
  redirect(redirectTo);
}

export async function logout() {
  const refreshToken = await getRefreshToken();
  try {
    if (refreshToken) {
      await fetch(backendApiUrl("auth/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
    }
  } catch {
    // La limpieza local debe completarse incluso si el backend no está disponible.
  }
  await deleteSession();
  redirect("/login");
}

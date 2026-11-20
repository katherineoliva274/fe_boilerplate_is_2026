
"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = {
  error?: string;
  email?: string;
};

type UserRole = "RECEPCION_ADMIN" | "ENTRENADOR" | "MIEMBRO";

type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function apiEndpoint(path: string): URL {
  const base = process.env.API_URL;
  if (!base) {
    throw new Error("Falta la variable API_URL.");
  }

  return new URL(path, base.endsWith("/") ? base : `${base}/`);
}

async function authenticate(email: string, password: string) {
  const response = await fetch(apiEndpoint("auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Error de autenticación: ${response.status}`);
  }

  const data = await response.json();

  const token: string | undefined =
    data.token ?? data.accessToken ?? data.access_token;

  if (!token) {
    throw new Error("La API no devolvió un token.");
  }

  return token;
}

async function getAuthenticatedUser(
  token: string,
): Promise<AuthenticatedUser> {
  const response = await fetch(apiEndpoint("auth/me"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No fue posible verificar el usuario.");
  }

  const user: AuthenticatedUser = await response.json();

  if (
    !user.isActive ||
    !["RECEPCION_ADMIN", "ENTRENADOR", "MIEMBRO"].includes(user.role)
  ) {
    throw new Error("Usuario inactivo o rol no autorizado.");
  }

  return user;
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña.", email };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Ingresa un correo válido.", email };
  }

  let token: string | null;
  let user: AuthenticatedUser;

  try {
    token = await authenticate(email, password);

    if (!token) {
      return { error: "Correo o contraseña incorrectos.", email };
    }

    user = await getAuthenticatedUser(token);
    await createSession(token);
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return {
      error: "No se pudo iniciar sesión. Verifica tus datos.",
      email,
    };
  }

  switch (user.role) {
    case "RECEPCION_ADMIN":
      redirect("/admin");

    case "ENTRENADOR":
      redirect("/entrenador");

    case "MIEMBRO":
      redirect("/mi-membresia");
  }
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

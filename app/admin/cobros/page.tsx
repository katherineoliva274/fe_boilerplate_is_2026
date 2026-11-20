
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import FormularioCobros from "./formulario-cobros";

export default async function CobrosPage() {
  const token = await getSession();

  if (!token) {
    redirect("/login");
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const base = apiUrl.endsWith("/")
    ? apiUrl
    : `${apiUrl}/`;

  const response = await fetch(
    new URL("auth/me", base),
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("No se pudo verificar la sesión.");
  }

  const usuario = await response.json();

  if (!usuario.isActive) {
    redirect("/login");
  }

  if (usuario.role !== "RECEPCION_ADMIN") {
    redirect("/");
  }

  return <FormularioCobros />;
}

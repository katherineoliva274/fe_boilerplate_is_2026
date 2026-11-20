
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import MiMembresiaVista from "./mi-membresia-vista";

export type MembresiaAPI = {
  id: string;
  planId: string;
  planName: string;
  benefits: string[];
  startsOn: string;
  endsOn: string;
  planType: string;
  creditsRemaining: Record<string, number>;
  status: string;
};

export default async function MiMembresiaPage() {
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

  const usuarioResponse = await fetch(
    new URL("auth/me", base),
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (usuarioResponse.status === 401) {
    redirect("/login");
  }

  if (!usuarioResponse.ok) {
    throw new Error("No se pudo verificar la sesión.");
  }

  const usuario = await usuarioResponse.json();

  if (!usuario.isActive) {
    redirect("/login");
  }

  if (usuario.role !== "MIEMBRO") {
    redirect("/");
  }

  const response = await fetch(
    new URL("memberships/me", base),
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

  if (response.status === 403) {
    redirect("/");
  }

  if (!response.ok) {
    throw new Error(
      `No se pudo consultar la membresía: ${response.status}`
    );
  }

  const data: { membership: MembresiaAPI | null } =
    await response.json();

  return (
    <MiMembresiaVista membresia={data.membership ?? null} />
  );
}

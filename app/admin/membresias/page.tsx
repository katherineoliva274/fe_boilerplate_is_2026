
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import FormularioMembresias from "./formulario-membresias";

export type PlanAPI = {
  id: string;
  name: string;
  type: string;
  priceUsd: string;
  durationMonths?: number | null;
  durationDays?: number | null;
  classCredits?: number | null;
  benefits: string[];
  status: string;
};

function endpoint(path: string) {
  const base = process.env.API_URL;

  if (!base) {
    throw new Error("Falta configurar API_URL.");
  }

  return new URL(
    path,
    base.endsWith("/") ? base : `${base}/`
  );
}

export default async function CompraRenovacionPage() {
  const token = await getSession();

  if (!token) {
    redirect("/login");
  }

  const usuarioResponse = await fetch(endpoint("auth/me"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (usuarioResponse.status === 401) {
    redirect("/login");
  }

  if (!usuarioResponse.ok) {
    throw new Error("No se pudo verificar el usuario.");
  }

  const usuario = await usuarioResponse.json();

  if (!usuario.isActive) {
    redirect("/login");
  }

  if (usuario.role !== "RECEPCION_ADMIN") {
    redirect("/");
  }

  let planes: PlanAPI[] = [];
  let errorPlanes = "";

  try {
    const response = await fetch(
      endpoint("membership-plans?status=ACTIVO"),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const resultado = await response.json();

    if (!Array.isArray(resultado.data)) {
      throw new Error("Respuesta de planes inválida.");
    }

    planes = resultado.data.filter(
      (plan: PlanAPI) => plan.status === "ACTIVO"
    );
  } catch (error) {
    console.error("Error al cargar planes:", error);
    errorPlanes = "No se pudieron cargar los planes activos.";
  }

  return (
    <FormularioMembresias
      planes={planes}
      errorPlanes={errorPlanes}
    />
  );
}

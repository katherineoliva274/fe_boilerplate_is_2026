
"use server";

import { getSession } from "@/lib/session";

type Operacion = "COMPRA" | "RENOVACION";

type Solicitud = {
  operacion: Operacion;
  memberNumber: string;
  planId: string;
  membershipId?: string;
};

export type ResultadoSolicitud = {
  ok: boolean;
  mensaje: string;
  requestId?: string;
  paymentId?: string;
  status?: string;
  expectedEndsOn?: string;
};

function apiUrl(path: string) {
  const base = process.env.API_URL;

  if (!base) {
    throw new Error("Falta configurar API_URL.");
  }

  return new URL(
    path,
    base.endsWith("/") ? base : `${base}/`
  );
}

export async function registrarSolicitud(
  datos: Solicitud
): Promise<ResultadoSolicitud> {
  const token = await getSession();

  if (!token) {
    return {
      ok: false,
      mensaje: "Tu sesión ha expirado. Inicia sesión nuevamente.",
    };
  }

  const memberNumber = datos.memberNumber.trim().toUpperCase();
  const planId = datos.planId.trim();

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!memberNumber || !planId || !uuidRegex.test(planId)) {
    return {
      ok: false,
      mensaje: "Completa el número de miembro y selecciona un plan válido.",
    };
  }

  if (
    datos.operacion !== "COMPRA" &&
    datos.operacion !== "RENOVACION"
  ) {
    return {
      ok: false,
      mensaje: "Operación no válida.",
    };
  }

  if (
    datos.operacion === "RENOVACION" &&
    !uuidRegex.test(datos.membershipId ?? "")
  ) {
    return {
      ok: false,
      mensaje: "Ingresa el ID válido de la membresía que deseas renovar.",
    };
  }

  try {
    const usuarioResponse = await fetch(apiUrl("auth/me"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!usuarioResponse.ok) {
      return {
        ok: false,
        mensaje: "No se pudo verificar la sesión.",
      };
    }

    const usuario = await usuarioResponse.json();

    if (
      usuario.isActive !== true ||
      usuario.role !== "RECEPCION_ADMIN"
    ) {
      return {
        ok: false,
        mensaje: "No tienes permisos para registrar membresías.",
      };
    }

    // Validar que el plan siga activo.
    const planesResponse = await fetch(
      apiUrl("membership-plans?status=ACTIVO"),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!planesResponse.ok) {
      return {
        ok: false,
        mensaje: "No se pudieron verificar los planes activos.",
      };
    }

    const planesData = await planesResponse.json();

    const planActivo =
      Array.isArray(planesData.data) &&
      planesData.data.some(
        (plan: { id: string; status: string }) =>
          plan.id === planId && plan.status === "ACTIVO"
      );

    if (!planActivo) {
      return {
        ok: false,
        mensaje: "El plan seleccionado ya no está activo.",
      };
    }

    let endpoint: string;
    let cuerpo: object;

    if (datos.operacion === "COMPRA") {
      endpoint = "memberships/purchases";

      cuerpo = {
        memberNumber,
        planId,
      };
    } else {
      endpoint = `memberships/${datos.membershipId}/renewals`;

      cuerpo = {
        planId,
      };
    }

    const response = await fetch(apiUrl(endpoint), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cuerpo),
      cache: "no-store",
    });

    if (!response.ok) {
      const errores: Record<number, string> = {
        400: "Los datos ingresados no son válidos.",
        401: "Tu sesión ha expirado.",
        403: "No tienes permisos para esta operación.",
        404: "El miembro, la membresía o el plan no existe.",
        409:
          datos.operacion === "COMPRA"
            ? "El plan no está disponible o ya existe una solicitud pendiente."
            : "La membresía no permite renovación.",
      };

      return {
        ok: false,
        mensaje:
          errores[response.status] ??
          `Error del servidor (${response.status}).`,
      };
    }

    const resultado = await response.json();

    return {
      ok: true,
      mensaje:
        "Solicitud registrada correctamente. El pago está pendiente de confirmación.",
      requestId: resultado.requestId,
      paymentId: resultado.paymentId,
      status: resultado.status,
      expectedEndsOn: resultado.expectedEndsOn,
    };
  } catch (error) {
    console.error("Error al registrar solicitud:", error);

    return {
      ok: false,
      mensaje: "No fue posible conectar con el backend.",
    };
  }
}

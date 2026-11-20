
"use server";

import { getSession } from "@/lib/session";

export type ResultadoCobro = {
  ok: boolean;
  mensaje: string;
};

export async function registrarCobro(
  paymentId: string
): Promise<ResultadoCobro> {
  const token = await getSession();

  if (!token) {
    return {
      ok: false,
      mensaje: "Tu sesión ha expirado. Inicia sesión nuevamente.",
    };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    return {
      ok: false,
      mensaje: "Falta configurar API_URL.",
    };
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const id = paymentId.trim();

  if (!uuidRegex.test(id)) {
    return {
      ok: false,
      mensaje: "Ingresa un ID de pago válido.",
    };
  }

  const base = apiUrl.endsWith("/")
    ? apiUrl
    : `${apiUrl}/`;

  try {
    const usuarioResponse = await fetch(
      new URL("auth/me", base),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

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
        mensaje: "No tienes permisos para registrar cobros.",
      };
    }

    const response = await fetch(
      new URL(`payments/${id}/collect`, base),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "EFECTIVO",
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errores: Record<number, string> = {
        400: "Los datos del cobro no son válidos.",
        401: "Tu sesión ha expirado.",
        403: "No tienes permisos para registrar este cobro.",
        404: "No se encontró el pago.",
        409: "El pago no puede cobrarse en su estado actual.",
      };

      return {
        ok: false,
        mensaje:
          errores[response.status] ??
          `No se pudo registrar el cobro (HTTP ${response.status}).`,
      };
    }

    return {
      ok: true,
      mensaje: "Cobro registrado correctamente en el backend.",
    };
  } catch (error) {
    console.error("Error registrando cobro:", error);

    return {
      ok: false,
      mensaje:
        "No se pudo completar la comunicación. Verifica el estado del pago antes de reintentarlo.",
    };
  }
}

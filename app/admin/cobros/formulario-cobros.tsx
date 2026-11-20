
"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { registrarCobro } from "./actions";

const menu = [
  { nombre: "Inicio", ruta: "/admin" },
  { nombre: "Membresías", ruta: "/admin/membresias" },
  { nombre: "Planes", ruta: "/admin/planes" },
  { nombre: "Cobros", ruta: "/admin/cobros" },
  {
    nombre: "Pagos pendientes",
    ruta: "/admin/pagos-pendientes",
  },
  { nombre: "Reportes", ruta: "/admin/reportes" },
];

export default function FormularioCobros() {
  const [paymentId, setPaymentId] = useState("");
  const [cargando, setCargando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);
  const [ultimoCobro, setUltimoCobro] = useState("");

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function prepararCobro() {
    setMensaje("");
    setExito(false);

    if (!uuidRegex.test(paymentId.trim())) {
      setMensaje("Ingresa un ID de pago válido.");
      return;
    }

    setConfirmando(true);
  }

  async function confirmarCobro() {
    if (cargando) return;

    setConfirmando(false);
    setCargando(true);
    setMensaje("");
    setExito(false);

    const id = paymentId.trim();

    try {
      const resultado = await registrarCobro(id);

      setMensaje(resultado.mensaje);
      setExito(resultado.ok);

      if (resultado.ok) {
        setUltimoCobro(id);
        setPaymentId("");
      }
    } catch {
      setMensaje(
        "No se pudo confirmar el resultado. Verifica el pago antes de reintentarlo."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between bg-slate-900 px-6 py-5 text-white">
        <h1 className="text-2xl font-bold">
          GKDS/GYM
        </h1>

        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <div className="flex min-h-[calc(100vh-80px)]">
        <aside className="hidden w-64 shrink-0 bg-slate-200 p-4 md:block">
          <nav className="space-y-2">
            {menu.map((opcion) => (
              <Link
                key={opcion.ruta}
                href={opcion.ruta}
                className={`block rounded-lg px-4 py-3 text-sm ${
                  opcion.ruta === "/admin/cobros"
                    ? "bg-teal-100 font-semibold text-teal-800"
                    : "text-slate-800 hover:bg-white"
                }`}
              >
                {opcion.nombre}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="w-full flex-1 p-6 md:p-10">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-2 text-3xl font-bold">
              Registro de cobros
            </h2>

            <p className="mb-8 text-slate-600">
              Registra los pagos pendientes del centro
              de entrenamiento.
            </p>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-9">
              <h3 className="mb-7 text-xl font-semibold">
                Confirmar pago
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="paymentId"
                    className="mb-2 block font-semibold"
                  >
                    ID del pago pendiente
                  </label>

                  <input
                    id="paymentId"
                    value={paymentId}
                    disabled={cargando}
                    onChange={(e) => {
                      setPaymentId(e.target.value);
                      setMensaje("");
                      setExito(false);
                    }}
                    placeholder="UUID del pago"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Método de pago
                  </label>

                  <div className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-3">
                    Efectivo
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm text-slate-600">
                Verifica el ID del pago en el sistema
                antes de registrar el cobro. El backend
                comprobará si la operación está permitida.
              </p>

              {mensaje && (
                <div
                  role="status"
                  className={`mt-6 rounded-lg p-4 ${
                    exito
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {mensaje}
                </div>
              )}

              {exito && ultimoCobro && (
                <div className="mt-5 rounded-lg border border-slate-200 p-4">
                  <strong>Pago procesado:</strong>
                  <p className="mt-2 break-all text-sm">
                    {ultimoCobro}
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  disabled={cargando}
                  onClick={() => {
                    setPaymentId("");
                    setMensaje("");
                    setExito(false);
                  }}
                  className="rounded-lg border border-slate-300 bg-slate-100 px-5 py-3 font-semibold disabled:opacity-50"
                >
                  Limpiar
                </button>

                <button
                  type="button"
                  disabled={cargando}
                  onClick={prepararCobro}
                  className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {cargando
                    ? "Procesando..."
                    : "Registrar cobro"}
                </button>
              </div>
            </section>

            <div className="mt-6 text-sm">
              <Link
                href="/admin"
                className="font-medium text-blue-700 hover:underline"
              >
                Volver al panel de administración
              </Link>
            </div>
          </div>
        </main>
      </div>

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-cobro-titulo"
            className="w-full max-w-md rounded-xl bg-white p-7 shadow-xl"
          >
            <h3
              id="confirmar-cobro-titulo"
              className="text-xl font-bold"
            >
              Confirmar cobro en efectivo
            </h3>

            <p className="mt-4 text-slate-600">
              Esta operación registrará el cobro
              en PostgreSQL mediante el backend.
            </p>

            <p className="mt-3 break-all text-sm">
              <strong>ID:</strong> {paymentId}
            </p>

            <p className="mt-4 text-sm text-amber-700">
              Confirma únicamente si el efectivo
              fue recibido.
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="rounded-lg border border-slate-300 px-4 py-2"
              >
                Volver
              </button>

              <button
                type="button"
                onClick={confirmarCobro}
                className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white"
              >
                Confirmar cobro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

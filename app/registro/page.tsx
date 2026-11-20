import Link from "next/link";
import type { Metadata } from "next";
import { RegistrationForm } from "./registration-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistrationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--gkds-page)] px-4 py-8 sm:py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(19,36,61,.16)] md:grid-cols-[1.05fr_.95fr]">
        <section className="flex min-h-[220px] flex-col justify-between bg-[var(--gkds-navy)] p-7 text-white sm:p-9 md:min-h-[680px] md:p-12">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-teal-300 text-xl font-extrabold text-teal-200">G</span>
            <span><strong className="block text-lg tracking-[.15em]">GKDS</strong><small className="text-[10px] tracking-[.24em] text-slate-300">FITNESS</small></span>
          </div>
          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-teal-200">Tu centro de entrenamiento</p>
            <h1 className="mt-4 max-w-md text-3xl font-bold leading-tight md:text-4xl">Empieza tu camino de bienestar.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Crea tu cuenta para consultar tus servicios, reservar clases y seguir tu progreso en GKDS.</p>
          </div>
          <p className="mt-8 text-xs text-slate-400">Registro seguro para nuevos miembros.</p>
        </section>
        <section className="p-6 sm:p-9 md:p-11">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Crear cuenta</h2>
            <p className="mt-2 text-sm text-slate-600">Completa tus datos para registrarte como miembro.</p>
          </div>
          <RegistrationForm />
          <p className="mt-6 text-center text-sm text-slate-600">¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-teal-700 underline-offset-4 hover:underline">Inicia sesión</Link></p>
        </section>
      </div>
    </main>
  );
}

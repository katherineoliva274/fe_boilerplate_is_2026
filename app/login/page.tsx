import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--gkds-page)] px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(19,36,61,.16)] md:grid-cols-[1.05fr_.95fr]">
        <section className="flex min-h-[260px] flex-col justify-between bg-[var(--gkds-navy)] p-8 text-white md:p-12">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-teal-300 text-xl font-extrabold text-teal-200">G</span>
            <span><strong className="block text-lg tracking-[.15em]">GKDS</strong><small className="text-[10px] tracking-[.24em] text-slate-300">FITNESS</small></span>
          </div>
          <div className="mt-10">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-teal-200">Tu centro de entrenamiento</p>
            <h1 className="mt-4 max-w-md text-3xl font-bold leading-tight md:text-4xl">Entrena con constancia. Sigue tu progreso.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Consulta tus servicios y gestiona tu experiencia GKDS desde un solo lugar.</p>
          </div>
          <p className="mt-8 text-xs text-slate-400">Acceso seguro para miembros, entrenadores y administración.</p>
        </section>
        <section className="p-7 sm:p-10 md:p-12">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-slate-600">Ingresa con el correo y contraseña de tu cuenta.</p>
          </div>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-slate-600">¿Todavía no tienes cuenta? <Link href="/registro" className="font-semibold text-teal-700 underline-offset-4 hover:underline">Regístrate</Link></p>
        </section>
      </div>
    </main>
  );
}

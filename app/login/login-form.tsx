"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold text-slate-800">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email} placeholder="tu@correo.com" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-semibold text-slate-800">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required placeholder="Ingresa tu contraseña" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" />
      </div>
      <p aria-live="polite" role="alert" className="min-h-5 text-sm font-medium text-red-700">{state.error}</p>
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}

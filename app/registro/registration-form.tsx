"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { BackendRequestError, backendRequest } from "@/lib/backend-client";

type Registration = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-100";
const labelClass = "flex flex-col gap-2 text-sm font-semibold text-slate-800";

export function RegistrationForm() {
  const [form, setForm] = useState<Registration>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function update<K extends keyof Registration>(key: K, value: Registration[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await backendRequest("users", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        }),
      });
      setSuccess(true);
    } catch (cause) {
      if (cause instanceof BackendRequestError && cause.status === 409) {
        setError("Ese correo ya está registrado. Inicia sesión o usa otro correo.");
      } else if (cause instanceof BackendRequestError && cause.status === 400) {
        setError(cause.message || "Revisa los datos: correo y contraseña no válidos.");
      } else {
        setError(cause instanceof Error ? cause.message : "No se pudo completar el registro.");
      }
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5" role="status" aria-live="polite">
        <h3 className="text-lg font-bold text-slate-900">Cuenta creada</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Tu registro como miembro se completó. Ya puedes iniciar sesión con {form.email.trim().toLowerCase()}.
        </p>
        <Link href="/login" className="mt-4 inline-flex w-full justify-center rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label htmlFor="fullName" className={labelClass}>
        Nombre completo
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          minLength={3}
          maxLength={100}
          value={form.fullName}
          onChange={(event) => update("fullName", event.target.value)}
          placeholder="Tu nombre y apellido"
          className={inputClass}
          disabled={pending}
        />
      </label>
      <label htmlFor="email" className={labelClass}>
        Correo electrónico
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          placeholder="tu@correo.com"
          className={inputClass}
          disabled={pending}
        />
      </label>
      <label htmlFor="phone" className={labelClass}>
        Teléfono <span className="font-normal text-slate-500">(opcional)</span>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={20}
          value={form.phone}
          onChange={(event) => update("phone", event.target.value)}
          placeholder="Tu número de teléfono"
          className={inputClass}
          disabled={pending}
        />
      </label>
      <label htmlFor="password" className={labelClass}>
        Contraseña
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+"
          title="Usa al menos 8 caracteres, con una minúscula, una mayúscula y un número."
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          placeholder="Mínimo 8 caracteres"
          className={inputClass}
          disabled={pending}
        />
      </label>
      <p className="-mt-1 text-xs leading-5 text-slate-600">
        Usa al menos 8 caracteres e incluye una minúscula, una mayúscula y un número.
      </p>
      <p aria-live="polite" role="alert" className="min-h-5 text-sm font-medium text-red-700">{error}</p>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}

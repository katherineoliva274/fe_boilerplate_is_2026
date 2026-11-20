
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | GKDS",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-200 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            GKDS
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Sistema de Gestión del Centro de Entrenamiento
          </p>
        </div>

        <section className="rounded-2xl border border-slate-600 bg-slate-700 p-8 shadow-xl">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white">
              Iniciar sesión
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              Ingresa tus datos para acceder a tu cuenta.
            </p>
          </div>

          <LoginForm />
        </section>

      
      </div>
    </main>
  );
}

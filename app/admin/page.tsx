
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";

export default async function AdminPage() {
  const token = await getSession();

  if (!token) {
    redirect("/login");
  }

  const baseUrl = process.env.API_URL;

  if (!baseUrl) {
    throw new Error("Falta configurar API_URL");
  }

  let authorized = false;

  try {
    const response = await fetch(
      new URL(
        "auth/me",
        baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
      ),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (response.ok) {
      const user = await response.json();

      authorized =
        user.isActive === true &&
        user.role === "RECEPCION_ADMIN";
    }
  } catch (error) {
    console.error("Error verificando el rol:", error);
  }

  if (!authorized) {
    redirect("/login");
  }

 
return (
  <main className="min-h-screen bg-slate-100 px-6 py-10">
    <div className="mx-auto max-w-6xl">
      
<header className="mb-8 flex flex-wrap items-center justify-between gap-4">
  <div>
    <h1 className="text-3xl font-bold text-slate-900">
      Panel de administración GKDS
    </h1>
    <p className="mt-2 text-slate-600">
      Gestiona las funcionalidades del centro de entrenamiento.
    </p>
  </div>

  <form action={logout}>
    <button
      type="submit"
      className="rounded-lg bg-slate-800 px-5 py-3 font-medium text-white hover:bg-slate-900"
    >
      Cerrar sesión
    </button>
  </form>
</header>


      <section className="mb-8 rounded-2xl bg-slate-800 p-7 text-white">
        <h2 className="text-2xl font-semibold">
          Bienvenido, administrador
        </h2>
        <p className="mt-2 text-slate-300">
          Selecciona una opción para comenzar.
        </p>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Membresías", "/admin/membresias", "Compras y renovaciones"],
          ["Planes", "/admin/planes", "Administración de planes"],
          ["Clases", "/admin/clases", "Gestión de clases"],
          ["Sesiones", "/admin/sesiones", "Sesiones grupales"],
          ["Cobros", "/admin/cobros", "Registro de cobros"],
          ["Pagos pendientes", "/admin/pagos-pendientes", "Consulta de deudas"],
          ["Mantenimiento", "/admin/mantenimiento", "Mantenimiento de máquinas"],
          ["Calificaciones", "/admin/calificaciones", "Evaluaciones recibidas"],
          ["Reportes", "/admin/reportes", "Indicadores y estadísticas"],
        ].map(([title, href, description]) => (
          <a
            key={href}
            href={href}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {description}
            </p>
            <span className="mt-5 inline-block text-sm font-medium text-blue-700">
              Abrir módulo →
            </span>
          </a>
        ))}
      </div>
    </div>
  </main>
);

}

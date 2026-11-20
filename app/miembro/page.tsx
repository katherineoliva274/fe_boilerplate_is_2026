
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function MiembroPage() {
  const token = await getSession();

  if (!token) {
    redirect("/login");
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  let authorized = false;

  try {
    const response = await fetch(
      new URL(
        "auth/me",
        apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`
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
        user.role === "MIEMBRO";
    }
  } catch (error) {
    console.error("Error verificando el rol:", error);
  }

  if (!authorized) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <h1 className="text-3xl font-bold text-slate-900">
        Panel del miembro GKDS
      </h1>

      <p className="mt-4 text-slate-600">
        Bienvenido al sistema de gestión del gimnasio.
      </p>
    </main>
  );
}

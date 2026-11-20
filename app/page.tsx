
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

type UserRole = "RECEPCION_ADMIN" | "ENTRENADOR" | "MIEMBRO";

export default async function Home() {
  const token = await getSession();

  if (!token) {
    redirect("/login");
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  let role: UserRole;

  try {
    const response = await fetch(
      new URL("auth/me", apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      redirect("/login");
    }

    const user = await response.json();

    if (!user.isActive) {
      redirect("/login");
    }

    role = user.role;
  } catch (error) {
    // Las redirecciones de Next.js deben ejecutarse fuera del catch.
    throw error;
  }

  switch (role) {
    case "RECEPCION_ADMIN":
      redirect("/admin");

    case "ENTRENADOR":
      redirect("/entrenador");

    case "MIEMBRO":
      redirect("/mi-membresia");

    default:
      redirect("/login");
  }
}

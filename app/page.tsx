import { redirect } from "next/navigation";
import { backendServerFetch } from "@/lib/backend-server";

type AuthenticatedUser = { role: "RECEPCION_ADMIN" | "ENTRENADOR" | "MIEMBRO"; isActive: boolean };

export default async function Home() {
  const response = await backendServerFetch("auth/me");
  if (!response.ok) redirect("/login");
  const user = await response.json() as AuthenticatedUser;
  if (!user.isActive) redirect("/login");
  if (user.role === "RECEPCION_ADMIN") redirect("/admin");
  if (user.role === "ENTRENADOR") redirect("/entrenador");
  if (user.role === "MIEMBRO") redirect("/mi-membresia");
  redirect("/login");
}

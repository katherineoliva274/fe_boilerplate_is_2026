"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { logout } from "@/app/actions/auth";
import { backendRequest } from "@/lib/backend-client";
import styles from "./AppShell.module.css";

type Role = "RECEPCION_ADMIN" | "ENTRENADOR" | "MIEMBRO";
type CurrentUser = { email: string; role: Role; isActive: boolean };
type NavItem = { href: string; label: string; mark: string };

const navigation: Record<Role, NavItem[]> = {
  RECEPCION_ADMIN: [
    { href: "/admin", label: "Panel", mark: "IN" },
    { href: "/admin/membresias", label: "Membresías", mark: "ME" },
    { href: "/admin/planes", label: "Planes", mark: "PL" },
    { href: "/admin/clases", label: "Clases", mark: "CL" },
    { href: "/admin/pagos-pendientes", label: "Pagos pendientes", mark: "PA" },
    { href: "/recepcion/cobros", label: "Cobros", mark: "CO" },
    { href: "/admin/mantenimiento", label: "Máquinas y mantenimiento", mark: "MA" },
    { href: "/admin/reportes/ingresos", label: "Reportes", mark: "RE" },
    { href: "/admin/calificaciones", label: "Calificaciones", mark: "CA" },
  ],
  ENTRENADOR: [
    { href: "/entrenador", label: "Panel", mark: "IN" },
    { href: "/entrenador/agenda", label: "Agenda y sesiones", mark: "AG" },
    { href: "/entrenador/disponibilidad", label: "Disponibilidad", mark: "DI" },
    { href: "/entrenador/clientes", label: "Mis clientes", mark: "CL" },
    { href: "/entrenador/rutinas", label: "Rutinas", mark: "RU" },
  ],
  MIEMBRO: [
    { href: "/mi-membresia", label: "Mi membresía", mark: "ME" },
    { href: "/clases", label: "Clases", mark: "CL" },
    { href: "/mis-reservas", label: "Mis reservas", mark: "RE" },
    { href: "/mi-progreso", label: "Mi progreso", mark: "PR" },
    { href: "/mis-sesiones", label: "Sesiones personales", mark: "SE" },
    { href: "/pagos", label: "Pagos", mark: "PA" },
    { href: "/mi-rutina", label: "Mis rutinas", mark: "RU" },
    { href: "/notificaciones", label: "Notificaciones", mark: "NO" },
  ],
};

const pageTitles: Record<string, string> = {
  "/admin": "Panel administrativo",
  "/entrenador": "Panel del entrenador",
  "/mi-membresia": "Mi membresía",
  "/clases": "Calendario de clases",
  "/mis-reservas": "Mis reservas",
  "/mi-rutina": "Mi rutina",
  "/notificaciones": "Notificaciones",
  "/pagos": "Pagos",
  "/recepcion/cobros": "Cobros en recepción",
};

function titleFor(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const segment = pathname.split("/").filter(Boolean).at(-1) ?? "GKDS Fitness";
  return segment.replace(/[-_]/g, " ").replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname === "/login" || pathname === "/registro";
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isPublic) return;
    let active = true;
    backendRequest<CurrentUser>("auth/me")
      .then((current) => { if (active && current.isActive) setUser(current); })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, [isPublic, pathname]);

  const items = useMemo(() => user ? navigation[user.role] : [], [user]);
  if (isPublic) return <>{children}</>;

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">G</span>
          <span><strong>GKDS</strong><small>FITNESS</small></span>
        </div>
        <h1 className={styles.contextTitle}>{titleFor(pathname)}</h1>
        <div className={styles.account}>
          <span className={styles.accountEmail}>{user?.email ?? "Sesión activa"}</span>
          <form action={logout}><button className={styles.logout} type="submit">Cerrar sesión</button></form>
        </div>
        <button className={styles.menuButton} type="button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          <span /><span /><span />
        </button>
      </header>
      <div className={styles.workspace}>
        <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`} aria-label="Navegación principal">
          <p className={styles.navLabel}>MENÚ PRINCIPAL</p>
          {user ? (
            <nav className={styles.navList}>
              {items.map((item) => {
                const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/entrenador" && pathname.startsWith(`${item.href}/`));
                return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`${styles.navItem} ${active ? styles.navItemActive : ""}`} aria-current={active ? "page" : undefined}>
                  <span className={styles.navMark}>{item.mark}</span><span>{item.label}</span>
                </Link>;
              })}
            </nav>
          ) : <p className={styles.navHint}>Cargando sesión segura…</p>}
          <div className={styles.sidebarFooter}><span className={styles.statusDot} /> API protegida · GKDS</div>
        </aside>
        {menuOpen && <button aria-label="Cerrar menú" className={styles.scrim} onClick={() => setMenuOpen(false)} />}
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

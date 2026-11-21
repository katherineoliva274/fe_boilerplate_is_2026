
"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import type { MembresiaAPI } from "./page";
import { logout } from "@/app/actions/auth";

const opcionesMenu = [
  { nombre: "Inicio", ruta: "/miembro" },
  { nombre: "Membresías", ruta: "/mi-membresia" },
  { nombre: "Clases y reservas", ruta: "/clases" },
  { nombre: "Entrenadores", ruta: "/entrenadores" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Máquinas", ruta: "/maquinas" },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
];

function formatearFecha(fecha: string) {
  const partes = fecha.slice(0, 10).split("-");

  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function mostrarCreditos(creditos: Record<string, number>) {
  const entradas = Object.entries(creditos ?? {});

  if (entradas.length === 0) {
    return "No aplica";
  }

  return entradas
    .map(([tipo, cantidad]) => `${tipo}: ${cantidad}`)
    .join(", ");
}

export default function MiMembresiaVista({
  membresia,
}: {
  membresia: MembresiaAPI | null;
}) {
  const [mostrarBeneficios, setMostrarBeneficios] =
    useState(false);

  return (
    <div className={styles.contenedor}>
      
<header
  className={styles.encabezado}
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  }}
>
  <h1>GKDS/GYM</h1>

  <form action={logout}>
    <button
      type="submit"
      style={{
        backgroundColor: "#2563eb",
        color: "#ffffff",
        padding: "11px 20px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "14px",
      }}
    >
      Cerrar sesión
    </button>
  </form>
</header>


      <div className={styles.estructura}>
        <aside className={styles.sidebar}>
          <nav className={styles.navegacion}>
            {opcionesMenu.map((opcion) => (
              <Link
                key={opcion.nombre}
                href={opcion.ruta}
                className={
                  opcion.ruta === "/mi-membresia"
                    ? styles.menuActivo
                    : styles.menuItem
                }
              >
                {opcion.nombre}
              </Link>
            ))}
          </nav>
        </aside>

        <main className={styles.contenido}>
          <div className={styles.tituloSeccion}>
            <h2>Mi membresía</h2>
          </div>

          <section className={styles.tarjeta}>
            <h3>Detalle de la información</h3>

            {membresia ? (
              <>
                <div className={styles.fila}>
                  <strong>Plan contratado</strong>
                  <span>{membresia.planName}</span>
                </div>

                <div className={styles.fila}>
                  <strong>Estado</strong>
                  <span
                    className={
                      membresia.status === "VIGENTE"
                        ? styles.vigente
                        : styles.vencida
                    }
                  >
                    {membresia.status}
                  </span>
                </div>

                <div className={styles.fila}>
                  <strong>Inicio</strong>
                  <span>
                    {formatearFecha(membresia.startsOn)}
                  </span>
                </div>

                <div className={styles.fila}>
                  <strong>Vencimiento</strong>
                  <span>
                    {formatearFecha(membresia.endsOn)}
                  </span>
                </div>

                <div className={styles.fila}>
                  <strong>Beneficios del plan</strong>
                  <button
                    type="button"
                    className={styles.botonTexto}
                    onClick={() =>
                      setMostrarBeneficios(!mostrarBeneficios)
                    }
                  >
                    {mostrarBeneficios
                      ? "Ocultar beneficios"
                      : "Ver información"}
                  </button>
                </div>

                {mostrarBeneficios && (
                  <ul className={styles.beneficios}>
                    {membresia.benefits.length > 0 ? (
                      membresia.benefits.map((beneficio, index) => (
                        <li key={index}>{beneficio}</li>
                      ))
                    ) : (
                      <li>No hay beneficios registrados.</li>
                    )}
                  </ul>
                )}

                <div className={styles.fila}>
                  <strong>Créditos restantes</strong>
                  <span>
                    {mostrarCreditos(
                      membresia.creditsRemaining
                    )}
                  </span>
                </div>
              </>
            ) : (
              <div className={styles.sinMembresia}>
                No tienes una membresía registrada
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

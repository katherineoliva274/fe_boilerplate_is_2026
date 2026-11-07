
"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type EstadoMembresia = "VIGENTE" | "VENCIDA";

interface Membresia {
  nombrePlan: string;
  estado: EstadoMembresia;
  fechaInicio: string;
  fechaVencimiento: string;
  beneficios: string[];
  creditosRestantes: number | null;
}

// Datos de prueba. Después vendrán del backend.
const membresiaEjemplo: Membresia = {
  nombrePlan: "Plan mensual",
  estado: "VIGENTE",
  fechaInicio: "01/11/2026",
  fechaVencimiento: "30/11/2026",
  beneficios: [
    "Acceso a instalaciones",
    "Uso de máquinas",
    "Clases grupales",
  ],
  creditosRestantes: null,
};

const opcionesMenu = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Membresías", ruta: "/mi-membresia" },
  { nombre: "Clases y reservas", ruta: "/clases" },
  { nombre: "Entrenadores", ruta: "/entrenadores" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Máquinas", ruta: "/maquinas" },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
  { nombre: "Reportes", ruta: "/reportes" },
];

export default function MiMembresiaPage() {
  const [membresia, setMembresia] =
    useState<Membresia | null>(membresiaEjemplo);

  const [mostrarBeneficios, setMostrarBeneficios] =
    useState(false);

  return (
    <div className={styles.contenedor}>
      <header className={styles.encabezado}>
        <h1>GKDS/GYM</h1>
      </header>

      <div className={styles.estructura}>
        <aside className={styles.sidebar}>
          

          <nav className={styles.navegacion}>
            {opcionesMenu.map((opcion) => (
              <Link
                key={opcion.nombre}
                href={opcion.ruta}
                className={
                  opcion.nombre === "Membresías"
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
            <div>
              <h2>Mi membresía</h2>
            </div>

            <span className={styles.etiquetaEjemplo}>
              Prototipo
            </span>
          </div>

          <section className={styles.tarjeta}>
            <h3>Detalle de la información</h3>

            {membresia ? (
              <>
                <div className={styles.fila}>
                  <strong>Plan contratado</strong>
                  <span>{membresia.nombrePlan}</span>
                </div>

                <div className={styles.fila}>
                  <strong>Estado</strong>
                  <span
                    className={
                      membresia.estado === "VIGENTE"
                        ? styles.vigente
                        : styles.vencida
                    }
                  >
                    {membresia.estado}
                  </span>
                </div>

                <div className={styles.fila}>
                  <strong>Inicio</strong>
                  <span>{membresia.fechaInicio}</span>
                </div>

                <div className={styles.fila}>
                  <strong>Vencimiento</strong>
                  <span>{membresia.fechaVencimiento}</span>
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
                    {membresia.beneficios.map((beneficio) => (
                      <li key={beneficio}>{beneficio}</li>
                    ))}
                  </ul>
                )}

                <div className={styles.fila}>
                  <strong>Créditos restantes</strong>
                  <span>
                    {membresia.creditosRestantes ?? "No aplica"}
                  </span>
                </div>
              </>
            ) : (
              <div className={styles.sinMembresia}>
                No tienes una membresía registrada
              </div>
            )}

            <div className={styles.acciones}>
              <button
                type="button"
                className={styles.botonPrincipal}
                onClick={() =>
                  window.alert(
                    "La consulta de planes se implementará próximamente."
                  )
                }
              >
                Ver planes
              </button>
            </div>
          </section>

        

          <div className={styles.pruebas}>
            <span>Pruebas de interfaz:</span>
            <button
              type="button"
              onClick={() => setMembresia(membresiaEjemplo)}
            >
              Con membresía
            </button>
            <button
              type="button"
              onClick={() => setMembresia(null)}
            >
              Sin membresía
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

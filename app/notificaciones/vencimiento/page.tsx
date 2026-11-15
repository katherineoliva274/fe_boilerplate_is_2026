"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Caso = "7" | "1" | "clases" | "leida" | "vacio" | "error";

interface Aviso {
  id: string;
  title: string;
  message: string;
  module: "MEMBRESIAS";
  referenceId: string;
  dedupeKey: string;
  planName: string;
  endsOn: string;
  createdAt: string;
  read: boolean;
}

const MENSAJE_SERVIDOR = "No se pudo cargar las notificaciones. Reintenta";
const MENSAJE_VACIO = "No tienes notificaciones";
const TITULO_AVISO = "Tu membresía vence pronto";

const menu = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Membresías", ruta: "/admin/membresias" },
  { nombre: "Clases y reservas", ruta: "/clases" },
  { nombre: "Entrenadores", ruta: "/entrenadores" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Máquinas", ruta: "/maquinas" },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
  { nombre: "Reportes", ruta: "/reportes" },
];

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

function mostrarFecha(fecha: Date): string {
  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

function mostrarFechaHora(fecha: Date): string {
  return `${mostrarFecha(fecha)} ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

function crearAviso(ahora: Date, dias: 7 | 1, plan: string, leida: boolean): Aviso {
  const vence = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + dias);
  const generado = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 6, 0);
  const membresia = "9f3c2b1a-4d5e-4a7b-8c9d-0e1f2a3b4c5d";

  return {
    id: `aviso-${dias}`,
    title: TITULO_AVISO,
    message: `Tu plan ${plan} vence el ${mostrarFecha(vence)}. Renuévalo para no perder el acceso.`,
    module: "MEMBRESIAS",
    referenceId: membresia,
    dedupeKey: `VENC-${membresia}-${dias}`,
    planName: plan,
    endsOn: mostrarFecha(vence),
    createdAt: generado.toISOString(),
    read: leida,
  };
}

function crearAvisos(caso: Caso, ahora: Date): Aviso[] {
  if (caso === "vacio") return [];
  if (caso === "1") return [crearAviso(ahora, 1, "Mensual Premium", false)];
  if (caso === "clases") return [crearAviso(ahora, 7, "Plan de clases (8 sesiones)", false)];
  if (caso === "leida") return [crearAviso(ahora, 7, "Mensual Premium", true)];
  return [crearAviso(ahora, 7, "Mensual Premium", false)];
}

export default function AvisoVencimientoPage() {
  const [caso, setCaso] = useState<Caso | null>(null);
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);
  const [fallo, setFallo] = useState(false);
  const [abiertos, setAbiertos] = useState<string[]>([]);

  function cargar(casoActual: Caso) {
    setAvisos(null);
    setFallo(false);

    setTimeout(() => {
      if (casoActual === "error") {
        setFallo(true);
        return;
      }
      setAvisos(crearAvisos(casoActual, new Date()));
    }, 500);
  }

  useEffect(() => {
    const temporizador = setTimeout(() => {
      const parametro = new URLSearchParams(window.location.search).get("caso");
      const detectado = (
        ["1", "clases", "leida", "vacio", "error"].includes(parametro ?? "")
          ? parametro
          : "7"
      ) as Caso;
      setCaso(detectado);
      cargar(detectado);
    }, 0);

    return () => clearTimeout(temporizador);
  }, []);

  function verDetalle(id: string) {
    setAvisos((actuales) =>
      actuales ? actuales.map((a) => (a.id === id ? { ...a, read: true } : a)) : actuales
    );
    setAbiertos((anteriores) =>
      anteriores.includes(id) ? anteriores.filter((x) => x !== id) : [...anteriores, id]
    );
  }

  function reintentar() {
    cargar("7");
  }

  const cargando = caso === null || (avisos === null && !fallo);

  return (
    <div className={styles.contenedor}>
      <header className={styles.encabezado}>
        <h1>
          GKDS <span>FITNESS</span>
        </h1>
      </header>

      <div className={styles.estructura}>
        <aside className={styles.sidebar}>
          <p className={styles.menuTitulo}>MENÚ PRINCIPAL</p>
          <nav className={styles.navegacion}>
            {menu.map((opcion) => (
              <Link
                href={opcion.ruta}
                key={opcion.nombre}
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
            <h2>Aviso de vencimiento</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          <section className={styles.tarjeta}>
            <h3>Bandeja de notificaciones</h3>

            {cargando ? (
              <p role="status" className={styles.estado}>
                Cargando notificaciones...
              </p>
            ) : fallo ? (
              <div className={styles.bloqueError}>
                <p role="alert" className={styles.error}>
                  {MENSAJE_SERVIDOR}
                </p>
                <button type="button" className={styles.secundario} onClick={reintentar}>
                  Reintentar
                </button>
              </div>
            ) : (avisos ?? []).length === 0 ? (
              <p role="status" className={styles.estado}>
                {MENSAJE_VACIO}
              </p>
            ) : (
              <ul className={styles.lista}>
                {(avisos ?? []).map((aviso) => {
                  const abierto = abiertos.includes(aviso.id);
                  return (
                    <li
                      key={aviso.id}
                      className={aviso.read ? styles.avisoLeido : styles.aviso}
                    >
                      <span
                        className={aviso.read ? styles.insigniaLeida : styles.insigniaNueva}
                      >
                        {aviso.read ? "LEÍDA" : "NO LEÍDA"}
                      </span>
                      <h4>{aviso.title}</h4>
                      <p className={styles.mensaje}>{aviso.message}</p>
                      <p className={styles.meta}>
                        Plan: {aviso.planName} • {mostrarFechaHora(new Date(aviso.createdAt))} •{" "}
                        <Link href="/admin/membresias" className={styles.enlace}>
                          Renovar membresía
                        </Link>
                      </p>

                      {abierto && (
                        <dl id={`detalle-${aviso.id}`} className={styles.detalle}>
                          <div>
                            <dt>Módulo</dt>
                            <dd>{aviso.module}</dd>
                          </div>
                          <div>
                            <dt>Vence el</dt>
                            <dd>{aviso.endsOn}</dd>
                          </div>
                          <div>
                            <dt>Referencia</dt>
                            <dd>{aviso.referenceId}</dd>
                          </div>
                          <div>
                            <dt>Clave de aviso</dt>
                            <dd>{aviso.dedupeKey}</dd>
                          </div>
                        </dl>
                      )}

                      <div className={styles.acciones}>
                        <button
                          type="button"
                          className={styles.guardar}
                          aria-expanded={abierto}
                          aria-controls={`detalle-${aviso.id}`}
                          onClick={() => verDetalle(aviso.id)}
                        >
                          {abierto ? "Ocultar detalle" : "Ver detalle"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

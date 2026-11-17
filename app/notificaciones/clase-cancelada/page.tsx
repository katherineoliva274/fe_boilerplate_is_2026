"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Caso = "motivo" | "sin-motivo" | "leida" | "vacio" | "error";

interface Aviso {
  id: string;
  title: string;
  message: string;
  module: "RESERVAS";
  referenceId: string;
  dedupeKey: string;
  className: string;
  startsAt: string;
  reason?: string;
  createdAt: string;
  read: boolean;
}

const MENSAJE_SERVIDOR = "No se pudo cargar las notificaciones. Reintenta";
const MENSAJE_VACIO = "No tienes notificaciones";
const TITULO_AVISO = "Clase cancelada";
const SESION = "5b7d1e22-3c4a-4f6b-9a8d-1c2e3f4a5b6c";

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

function mostrarHora(fecha: Date): string {
  return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

function crearAviso(ahora: Date, motivo: string | undefined, leida: boolean): Aviso {
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 18, 0);
  const nombre = "Spinning";
  const base = `La clase ${nombre} del ${mostrarFecha(inicio)} a las ${mostrarHora(inicio)} fue cancelada.`;

  return {
    id: "aviso-canc-1",
    title: TITULO_AVISO,
    message: motivo ? `${base} Motivo: ${motivo}` : base,
    module: "RESERVAS",
    referenceId: SESION,
    dedupeKey: `CANC-${SESION}`,
    className: nombre,
    startsAt: inicio.toISOString(),
    reason: motivo,
    createdAt: new Date(ahora.getTime() - 60000).toISOString(),
    read: leida,
  };
}

function crearAvisos(caso: Caso, ahora: Date): Aviso[] {
  if (caso === "vacio") return [];
  if (caso === "sin-motivo") return [crearAviso(ahora, undefined, false)];
  if (caso === "leida") return [crearAviso(ahora, "Entrenador no disponible", true)];
  return [crearAviso(ahora, "Entrenador no disponible", false)];
}

export default function AvisoClaseCanceladaPage() {
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
        ["sin-motivo", "leida", "vacio", "error"].includes(parametro ?? "")
          ? parametro
          : "motivo"
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
    cargar("motivo");
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
                  opcion.nombre === "Clases y reservas"
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
            <h2>Aviso de clase cancelada</h2>
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
                  const inicio = new Date(aviso.startsAt);
                  const generado = new Date(aviso.createdAt);
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
                        Clase: {aviso.className} • {mostrarFecha(generado)} {mostrarHora(generado)} •{" "}
                        <Link href="/clases" className={styles.enlace}>
                          Ver clases disponibles
                        </Link>
                      </p>

                      {abierto && (
                        <dl id={`detalle-${aviso.id}`} className={styles.detalle}>
                          <div>
                            <dt>Módulo</dt>
                            <dd>{aviso.module}</dd>
                          </div>
                          <div>
                            <dt>Clase</dt>
                            <dd>
                              {aviso.className} · {mostrarFecha(inicio)} {mostrarHora(inicio)}
                            </dd>
                          </div>
                          <div>
                            <dt>Motivo</dt>
                            <dd>{aviso.reason ?? "No registrado"}</dd>
                          </div>
                          <div>
                            <dt>Reserva</dt>
                            <dd>CANCELADA_POR_GIMNASIO</dd>
                          </div>
                          <div>
                            <dt>Sesión</dt>
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

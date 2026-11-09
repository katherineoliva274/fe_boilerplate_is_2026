"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type EstadoRutina = "VIGENTE" | "REEMPLAZADA" | "FINALIZADA";

interface EjercicioRutina {
  exerciseName: string;
  weekday: number;
  sets: number;
  reps: number;
  position: number;
}

interface Rutina {
  id: string;
  name: string;
  goal: string;
  trainerName: string;
  version: number;
  status: EstadoRutina;
  startsOn: string;
  endsOn: string;
  exercises: EjercicioRutina[];
}

type Caso = "normal" | "sin-vigente" | "sin-rutinas" | "historial-largo" | "error";

const TAMANO_PAGINA = 10;
const ENTRENADOR = "Roberto Alvarado";

const MENSAJE_SERVIDOR = "No se pudo cargar tu rutina";
const MENSAJE_SIN_VIGENTE = "Aún no tienes una rutina vigente";
const MENSAJE_SIN_RUTINAS = "Aún no tienes una rutina asignada";

const dias = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

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

const plantillas: { nombre: string; ejercicios: [string, number, number, number, number][] }[] = [
  {
    nombre: "Fuerza base",
    ejercicios: [
      ["Sentadilla con barra", 1, 4, 8, 1],
      ["Press de banca", 1, 4, 8, 2],
      ["Remo con mancuerna", 1, 3, 12, 3],
      ["Peso muerto", 3, 4, 6, 1],
      ["Press militar", 3, 3, 10, 2],
      ["Dominadas", 5, 3, 8, 1],
      ["Zancadas", 5, 3, 12, 2],
      ["Plancha abdominal", 5, 3, 45, 3],
    ],
  },
  {
    nombre: "Hipertrofia",
    ejercicios: [
      ["Press de banca", 2, 4, 10, 1],
      ["Fondos en paralelas", 2, 3, 12, 2],
      ["Sentadilla con barra", 4, 4, 10, 1],
      ["Zancadas", 4, 3, 12, 2],
      ["Curl de bíceps", 6, 3, 12, 1],
    ],
  },
  {
    nombre: "Adaptación",
    ejercicios: [
      ["Zancadas", 1, 2, 12, 1],
      ["Plancha abdominal", 1, 2, 30, 2],
      ["Remo con mancuerna", 4, 2, 12, 1],
    ],
  },
];

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

function claveIso(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

function mostrarFechaIso(texto: string): string {
  const [anio, mes, dia] = texto.split("-");
  return `${dia}/${mes}/${anio}`;
}

function crearRutina(
  version: number,
  estado: EstadoRutina,
  inicio: string,
  fin: string,
  indicePlantilla: number
): Rutina {
  const plantilla = plantillas[indicePlantilla % plantillas.length];
  return {
    id: `rut-${version}`,
    name: `${plantilla.nombre}${version > 3 ? ` ${version}` : ""}`,
    goal:
      indicePlantilla % plantillas.length === 0
        ? "Ganar fuerza general y mejorar la técnica de los levantamientos básicos"
        : indicePlantilla % plantillas.length === 1
          ? "Aumentar masa muscular en tren superior e inferior"
          : "Retomar el entrenamiento de forma progresiva",
    trainerName: ENTRENADOR,
    version,
    status: estado,
    startsOn: inicio,
    endsOn: fin,
    exercises: plantilla.ejercicios.map(
      ([exerciseName, weekday, sets, reps, position]) => ({
        exerciseName,
        weekday,
        sets,
        reps,
        position,
      })
    ),
  };
}

function crearRutinas(caso: Caso, ahora: Date): Rutina[] {
  const desde = (n: number) =>
    claveIso(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + n));

  if (caso === "sin-rutinas") return [];

  if (caso === "sin-vigente") {
    return [
      crearRutina(2, "VIGENTE", desde(-40), desde(-1), 1),
      crearRutina(1, "REEMPLAZADA", desde(-100), desde(-41), 0),
    ];
  }

  if (caso === "historial-largo") {
    const lista: Rutina[] = [crearRutina(13, "VIGENTE", desde(-10), desde(20), 0)];
    for (let v = 12; v >= 1; v--) {
      lista.push(
        crearRutina(v, v === 12 ? "REEMPLAZADA" : "FINALIZADA", desde(-10 - (13 - v) * 30), desde(-11 - (12 - v) * 30), v)
      );
    }
    return lista;
  }

  return [
    crearRutina(3, "VIGENTE", desde(-10), desde(20), 0),
    crearRutina(2, "REEMPLAZADA", desde(-50), desde(-11), 1),
    crearRutina(1, "FINALIZADA", desde(-90), desde(-51), 2),
  ];
}

function estadoEfectivo(rutina: Rutina, hoy: string): EstadoRutina {
  if (rutina.status === "VIGENTE" && hoy > rutina.endsOn) return "FINALIZADA";
  return rutina.status;
}

function esVigenteHoy(rutina: Rutina, hoy: string): boolean {
  return (
    rutina.status === "VIGENTE" && hoy >= rutina.startsOn && hoy <= rutina.endsOn
  );
}

function agruparPorDia(ejercicios: EjercicioRutina[]) {
  const grupos = new Map<number, EjercicioRutina[]>();
  for (const e of ejercicios) {
    const lista = grupos.get(e.weekday) ?? [];
    lista.push(e);
    grupos.set(e.weekday, lista);
  }
  return Array.from(grupos.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([dia, lista]) => ({
      dia,
      ejercicios: [...lista].sort((a, b) => a.position - b.position),
    }));
}

function textoEjercicios(rutina: Rutina): string {
  const dias = new Set(rutina.exercises.map((e) => e.weekday)).size;
  const total = rutina.exercises.length;
  return `${total} ${total === 1 ? "ejercicio" : "ejercicios"} en ${dias} ${dias === 1 ? "día" : "días"}`;
}

function TablaEjercicios({ rutina }: { rutina: Rutina }) {
  const grupos = agruparPorDia(rutina.exercises);

  return (
    <div className={styles.dias}>
      {grupos.map((grupo) => (
        <div key={grupo.dia} className={styles.dia}>
          <h4>{dias[grupo.dia - 1]}</h4>
          <div className={styles.tablaContenedor}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Posición</th>
                  <th>Ejercicio</th>
                  <th>Series</th>
                  <th>Repeticiones</th>
                </tr>
              </thead>
              <tbody>
                {grupo.ejercicios.map((e) => (
                  <tr key={`${e.weekday}-${e.position}`}>
                    <td>{e.position}</td>
                    <td className={styles.destacado}>{e.exerciseName}</td>
                    <td>{e.sets}</td>
                    <td>{e.reps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MiRutinaPage() {
  const [rutinas, setRutinas] = useState<Rutina[] | null>(null);
  const [hoy, setHoy] = useState("");
  const [fallo, setFallo] = useState(false);
  const [detalles, setDetalles] = useState(false);
  const [filtro, setFiltro] = useState("todas");
  const [pagina, setPagina] = useState(1);
  const [abiertas, setAbiertas] = useState<string[]>([]);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      const parametro = new URLSearchParams(window.location.search).get("caso");
      const caso = (
        ["sin-vigente", "sin-rutinas", "historial-largo", "error"].includes(parametro ?? "")
          ? parametro
          : "normal"
      ) as Caso;
      const ahora = new Date();

      setHoy(claveIso(ahora));
      if (caso === "error") {
        setFallo(true);
      } else {
        setRutinas(crearRutinas(caso, ahora));
      }
    }, 600);

    return () => clearTimeout(temporizador);
  }, []);

  const actual = rutinas?.find((r) => esVigenteHoy(r, hoy)) ?? null;
  const historial = (rutinas ?? [])
    .filter((r) => r.id !== actual?.id)
    .sort((a, b) => b.version - a.version);
  const filtrado =
    filtro === "todas"
      ? historial
      : historial.filter((r) => String(r.version) === filtro);
  const totalPaginas = Math.max(1, Math.ceil(filtrado.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrado.slice(
    (paginaActual - 1) * TAMANO_PAGINA,
    paginaActual * TAMANO_PAGINA
  );

  function alternar(id: string) {
    setAbiertas((anteriores) =>
      anteriores.includes(id)
        ? anteriores.filter((x) => x !== id)
        : [...anteriores, id]
    );
  }

  function cambiarFiltro(valor: string) {
    setFiltro(valor);
    setPagina(1);
  }

  const cargando = rutinas === null && !fallo;

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
                  opcion.nombre === "Entrenadores"
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
            <h2>Mi rutina</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          {cargando ? (
            <section className={styles.tarjeta}>
              <p role="status" className={styles.estado}>
                Cargando rutina...
              </p>
            </section>
          ) : fallo ? (
            <section className={styles.tarjeta}>
              <p role="alert" className={styles.error}>
                {MENSAJE_SERVIDOR}
              </p>
            </section>
          ) : (
            <>
              <section className={styles.tarjeta}>
                <h3>Detalle de la información</h3>

                {actual ? (
                  <>
                    <dl className={styles.lista}>
                      <div className={styles.fila}>
                        <dt>Rutina vigente</dt>
                        <dd>
                          {actual.name}{" "}
                          <span className={`${styles.insignia} ${styles.estadoVIGENTE}`}>
                            VIGENTE
                          </span>
                        </dd>
                      </div>
                      <div className={styles.fila}>
                        <dt>Objetivo de entrenamiento</dt>
                        <dd>{actual.goal}</dd>
                      </div>
                      <div className={styles.fila}>
                        <dt>Entrenador asignado</dt>
                        <dd>{actual.trainerName}</dd>
                      </div>
                      <div className={styles.fila}>
                        <dt>Inicio y fin</dt>
                        <dd>
                          {mostrarFechaIso(actual.startsOn)} –{" "}
                          {mostrarFechaIso(actual.endsOn)}
                        </dd>
                      </div>
                      <div className={styles.fila}>
                        <dt>Ejercicios por día</dt>
                        <dd>{textoEjercicios(actual)}</dd>
                      </div>
                      <div className={styles.fila}>
                        <dt>Versión</dt>
                        <dd>{actual.version}</dd>
                      </div>
                      <div className={styles.fila}>
                        <dt>Versiones anteriores</dt>
                        <dd>
                          {historial.length > 0
                            ? `${historial.length} ${historial.length === 1 ? "versión" : "versiones"}`
                            : "No aplica"}
                        </dd>
                      </div>
                    </dl>

                    {detalles && (
                      <div id="detalle-rutina" className={styles.detalleRutina}>
                        <TablaEjercicios rutina={actual} />
                      </div>
                    )}

                    <div className={styles.acciones}>
                      <button
                        type="button"
                        className={styles.guardar}
                        aria-expanded={detalles}
                        aria-controls="detalle-rutina"
                        onClick={() => setDetalles((v) => !v)}
                      >
                        {detalles ? "Ocultar detalles" : "Ver detalles"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p role="status" className={styles.estado}>
                    {MENSAJE_SIN_VIGENTE}
                  </p>
                )}
              </section>

              <section className={styles.tarjeta}>
                <div className={styles.historialEncabezado}>
                  <h3>Historial</h3>
                  {historial.length > 0 && (
                    <div className={styles.filtro}>
                      <label htmlFor="version">Versión</label>
                      <select
                        id="version"
                        value={filtro}
                        onChange={(e) => cambiarFiltro(e.target.value)}
                      >
                        <option value="todas">Todas las versiones</option>
                        {historial.map((r) => (
                          <option key={r.id} value={String(r.version)}>
                            Versión {r.version}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {historial.length === 0 ? (
                  <p role="status" className={styles.estado}>
                    {MENSAJE_SIN_RUTINAS}
                  </p>
                ) : (
                  <>
                    <ul className={styles.acordeon}>
                      {visibles.map((r) => {
                        const abierta = abiertas.includes(r.id);
                        const estado = estadoEfectivo(r, hoy);
                        return (
                          <li key={r.id} className={styles.version}>
                            <h4>
                              <button
                                type="button"
                                className={styles.versionBoton}
                                aria-expanded={abierta}
                                aria-controls={`version-${r.id}`}
                                onClick={() => alternar(r.id)}
                              >
                                <span className={styles.versionTitulo}>
                                  Versión {r.version} · {r.name}
                                </span>
                                <span className={styles.versionMeta}>
                                  {mostrarFechaIso(r.startsOn)} –{" "}
                                  {mostrarFechaIso(r.endsOn)}
                                </span>
                                <span className={`${styles.insignia} ${styles[`estado${estado}`]}`}>
                                  {estado}
                                </span>
                                <span className={styles.flecha} aria-hidden="true">
                                  {abierta ? "−" : "+"}
                                </span>
                              </button>
                            </h4>
                            {abierta && (
                              <div id={`version-${r.id}`} className={styles.versionCuerpo}>
                                <p>
                                  <strong>Objetivo:</strong> {r.goal}
                                </p>
                                <p>
                                  <strong>Entrenador:</strong> {r.trainerName}
                                </p>
                                <TablaEjercicios rutina={r} />
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {totalPaginas > 1 && (
                      <nav className={styles.paginacion} aria-label="Paginación del historial">
                        <button
                          type="button"
                          className={styles.secundario}
                          disabled={paginaActual === 1}
                          onClick={() => setPagina(paginaActual - 1)}
                        >
                          Anterior
                        </button>
                        <span>
                          Página {paginaActual} de {totalPaginas}
                        </span>
                        <button
                          type="button"
                          className={styles.secundario}
                          disabled={paginaActual === totalPaginas}
                          onClick={() => setPagina(paginaActual + 1)}
                        >
                          Siguiente
                        </button>
                      </nav>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

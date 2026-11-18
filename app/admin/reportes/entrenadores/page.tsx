"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Caso = "normal" | "vacio" | "error" | "denegado" | "empate";
type CriterioOrden = "rating" | "sessions";
type Sentido = "asc" | "desc";

interface PlantillaEntrenador {
  trainerId: string;
  name: string;
  dias: number[];
  promedio: number | null;
}

interface FilaEntrenador {
  trainerId: string;
  name: string;
  completedSessions: number;
  averageRating: number | null;
  ratingsCount: number;
}

interface Consulta {
  from: string;
  to: string;
  data: FilaEntrenador[];
}

const MS_CARGA = 600;

const MENSAJE_VACIO = "No hay sesiones en este rango";
const MENSAJE_SERVIDOR = "No se pudo cargar el reporte de desempeño.";
const MENSAJE_DENEGADO = "Acceso denegado";
const SIN_CALIFICACIONES = "Sin calificaciones";
const ERROR_REQUERIDO = "Selecciona la fecha inicial y la fecha final";
const ERROR_ORDEN = "La fecha final no puede ser anterior a la fecha inicial";
const ERROR_MAXIMO = "El rango no puede ser mayor a 12 meses";

const menu = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Membresías", ruta: "/admin/membresias" },
  { nombre: "Clases y reservas", ruta: "/admin/clases" },
  { nombre: "Entrenadores", ruta: "/entrenadores" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Máquinas", ruta: "/maquinas" },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
  { nombre: "Reportes", ruta: "/reportes" },
];

const entrenadoresBase: PlantillaEntrenador[] = [
  { trainerId: "33333333-0000-4000-8000-000000000001", name: "Laura Hernández", dias: [1, 3, 5], promedio: 4.8 },
  { trainerId: "33333333-0000-4000-8000-000000000002", name: "Carlos Méndez", dias: [2, 4], promedio: 4.5 },
  { trainerId: "33333333-0000-4000-8000-000000000003", name: "Ana Rivas", dias: [1, 4], promedio: 4.2 },
  { trainerId: "33333333-0000-4000-8000-000000000004", name: "Jorge Alvarado", dias: [3, 6], promedio: 3.9 },
  { trainerId: "33333333-0000-4000-8000-000000000005", name: "Marta Colindres", dias: [2, 5], promedio: null },
  { trainerId: "33333333-0000-4000-8000-000000000006", name: "Diego Funes", dias: [6], promedio: 3.1 },
];

const entrenadoresEmpate: PlantillaEntrenador[] = [
  { trainerId: "44444444-0000-4000-8000-000000000001", name: "Beatriz Ortiz", dias: [2, 4], promedio: 4.5 },
  { trainerId: "44444444-0000-4000-8000-000000000002", name: "Andrés Pineda", dias: [2, 4], promedio: 4.5 },
  { trainerId: "44444444-0000-4000-8000-000000000003", name: "Zoe Mena", dias: [1, 3, 5], promedio: 4.5 },
];

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

function aIso(f: Date): string {
  return `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())}`;
}

function aFecha(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d, 12, 0, 0);
}

function mostrarFecha(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function validarRango(from: string, to: string): string {
  if (!from || !to) return ERROR_REQUERIDO;
  const inicio = aFecha(from);
  const fin = aFecha(to);
  if (fin < inicio) return ERROR_ORDEN;
  const limite = new Date(inicio);
  limite.setMonth(limite.getMonth() + 12);
  if (fin > limite) return ERROR_MAXIMO;
  return "";
}

function contarCompletadas(from: string, to: string, dias: number[], hoy: string): number {
  const fin = aFecha(to);
  const cursor = aFecha(from);
  let total = 0;
  while (cursor <= fin) {
    if (dias.includes(cursor.getDay()) && aIso(cursor) <= hoy) total++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
}

function compararNombre(a: FilaEntrenador, b: FilaEntrenador): number {
  return a.name.localeCompare(b.name, "es");
}

function ordenar(
  filas: FilaEntrenador[],
  sortBy: CriterioOrden,
  order: Sentido
): FilaEntrenador[] {
  const signo = order === "asc" ? 1 : -1;

  return [...filas].sort((a, b) => {
    if (sortBy === "rating") {
      if (a.averageRating === null && b.averageRating !== null) return 1;
      if (a.averageRating !== null && b.averageRating === null) return -1;
      const porPromedio = ((a.averageRating ?? 0) - (b.averageRating ?? 0)) * signo;
      if (porPromedio !== 0) return porPromedio;
      return b.completedSessions - a.completedSessions || compararNombre(a, b);
    }

    const porSesiones = (a.completedSessions - b.completedSessions) * signo;
    if (porSesiones !== 0) return porSesiones;
    if (a.averageRating === null && b.averageRating !== null) return 1;
    if (a.averageRating !== null && b.averageRating === null) return -1;
    const porPromedio = (b.averageRating ?? 0) - (a.averageRating ?? 0);
    return porPromedio || compararNombre(a, b);
  });
}

function generarReporte(
  from: string,
  to: string,
  caso: Caso,
  sortBy: CriterioOrden,
  order: Sentido
): Consulta {
  const plantillas =
    caso === "empate" ? [...entrenadoresBase, ...entrenadoresEmpate] : entrenadoresBase;
  const hoy = aIso(new Date());
  const filas: FilaEntrenador[] = [];

  for (const p of plantillas) {
    const completedSessions = contarCompletadas(from, to, p.dias, hoy);
    if (completedSessions === 0) continue;
    const ratingsCount = p.promedio === null ? 0 : Math.max(1, Math.round(completedSessions * 1.6));
    filas.push({
      trainerId: p.trainerId,
      name: p.name,
      completedSessions,
      averageRating: p.promedio,
      ratingsCount,
    });
  }

  return { from, to, data: ordenar(filas, sortBy, order) };
}

export default function DesempenoEntrenadoresPage() {
  const [caso, setCaso] = useState<Caso | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<CriterioOrden>("rating");
  const [order, setOrder] = useState<Sentido>("desc");
  const [errorRango, setErrorRango] = useState("");
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [resultado, setResultado] = useState<Consulta | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      const parametro = new URLSearchParams(window.location.search).get("caso");
      const validos = ["vacio", "error", "denegado", "empate"];
      setCaso((validos.includes(parametro ?? "") ? parametro : "normal") as Caso);
    }, 0);

    return () => clearTimeout(temporizador);
  }, []);

  function consultar(e?: React.FormEvent) {
    e?.preventDefault();
    if (!caso) return;

    const mensaje = validarRango(from, to);
    setErrorRango(mensaje);
    setResultado(null);
    setFallo(false);
    if (mensaje) return;

    setCargando(true);

    const desde = from;
    const hasta = to;
    const casoActual = caso;
    const criterio = sortBy;
    const sentido = order;

    setTimeout(() => {
      setCargando(false);
      if (casoActual === "error") {
        setFallo(true);
        return;
      }
      setResultado(
        casoActual === "vacio"
          ? { from: desde, to: hasta, data: [] }
          : generarReporte(desde, hasta, casoActual, criterio, sentido)
      );
    }, MS_CARGA);
  }

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
                className={opcion.nombre === "Entrenadores" ? styles.menuActivo : styles.menuItem}
              >
                {opcion.nombre}
              </Link>
            ))}
          </nav>
        </aside>

        <main className={styles.contenido}>
          <div className={styles.tituloSeccion}>
            <h2>Desempeño de entrenadores</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          <section className={styles.tarjeta}>
            {caso === "denegado" ? (
              <p role="alert" className={styles.error}>
                {MENSAJE_DENEGADO}
              </p>
            ) : (
              <>
                <h3>Indicadores del período</h3>

                <form className={styles.filtros} onSubmit={consultar} noValidate>
                  <div className={styles.campo}>
                    <label htmlFor="from">Fecha inicial (from)</label>
                    <input
                      id="from"
                      type="date"
                      required
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      aria-invalid={errorRango ? true : undefined}
                    />
                  </div>

                  <div className={styles.campo}>
                    <label htmlFor="to">Fecha final (to)</label>
                    <input
                      id="to"
                      type="date"
                      required
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      aria-invalid={errorRango ? true : undefined}
                    />
                  </div>

                  <div className={styles.campo}>
                    <label htmlFor="sortBy">Ordenar por (sortBy)</label>
                    <select
                      id="sortBy"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as CriterioOrden)}
                    >
                      <option value="rating">Calificación</option>
                      <option value="sessions">Sesiones</option>
                    </select>
                  </div>

                  <fieldset className={styles.opciones}>
                    <legend>Orden (order)</legend>
                    <label>
                      <input
                        type="radio"
                        name="order"
                        value="asc"
                        checked={order === "asc"}
                        onChange={() => setOrder("asc")}
                      />
                      Ascendente
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="order"
                        value="desc"
                        checked={order === "desc"}
                        onChange={() => setOrder("desc")}
                      />
                      Descendente
                    </label>
                  </fieldset>

                  <button type="submit" className={styles.guardar} disabled={cargando}>
                    Consultar
                  </button>
                </form>

                {errorRango && (
                  <p role="alert" className={styles.error}>
                    {errorRango}
                  </p>
                )}

                {cargando && (
                  <p role="status" className={styles.estado}>
                    Cargando reporte...
                  </p>
                )}

                {fallo && (
                  <div className={styles.bloqueError}>
                    <p role="alert" className={styles.error}>
                      {MENSAJE_SERVIDOR}
                    </p>
                    <button type="button" className={styles.secundario} onClick={() => consultar()}>
                      Reintentar
                    </button>
                  </div>
                )}

                {!cargando && !fallo && !errorRango && !resultado && (
                  <p className={styles.estado}>
                    Elige un rango de fechas y presiona «Consultar».
                  </p>
                )}

                {resultado && resultado.data.length === 0 && (
                  <p role="status" className={styles.estado}>
                    {MENSAJE_VACIO}
                  </p>
                )}

                {resultado && resultado.data.length > 0 && (
                  <>
                    <p className={styles.rango}>
                      Del {mostrarFecha(resultado.from)} al {mostrarFecha(resultado.to)}
                    </p>
                    <div className={styles.tablaContenedor}>
                      <table className={styles.tabla}>
                        <thead>
                          <tr>
                            <th>Entrenador</th>
                            <th className={styles.numero}>Sesiones impartidas</th>
                            <th className={styles.numero}>Calificación promedio</th>
                            <th className={styles.numero}>Calificaciones recibidas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultado.data.map((fila) => (
                            <tr key={fila.trainerId}>
                              <td className={styles.destacado}>{fila.name}</td>
                              <td className={styles.numero}>{fila.completedSessions}</td>
                              <td
                                className={
                                  fila.averageRating === null ? styles.sinDatos : styles.numero
                                }
                              >
                                {fila.averageRating === null
                                  ? SIN_CALIFICACIONES
                                  : fila.averageRating.toFixed(1)}
                              </td>
                              <td className={styles.numero}>{fila.ratingsCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className={styles.pie}>
                      {resultado.data.length}{" "}
                      {resultado.data.length === 1 ? "entrenador" : "entrenadores"} con sesiones en
                      el rango
                    </p>
                  </>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

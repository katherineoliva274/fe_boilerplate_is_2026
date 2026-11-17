"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Caso = "normal" | "vacio" | "error" | "denegado" | "empate" | "cinco" | "cuatro";
type Etiqueta = "ALTA" | "BAJA" | null;

interface PlantillaClase {
  classId: string;
  name: string;
  dias: number[];
  cupo: number;
  tasa: number;
}

interface FilaOcupacion {
  classId: string;
  name: string;
  totalCapacity: number;
  confirmedReservations: number;
  occupancyPct: number;
  label: Etiqueta;
}

interface Consulta {
  from: string;
  to: string;
  data: FilaOcupacion[];
}

const MS_CARGA = 600;

const MENSAJE_VACIO = "No hay clases en este rango";
const MENSAJE_SERVIDOR = "No se pudo cargar el reporte de ocupación.";
const MENSAJE_DENEGADO = "Acceso denegado";
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

const clasesBase: PlantillaClase[] = [
  { classId: "11111111-0000-4000-8000-000000000001", name: "Spinning", dias: [1, 3, 5], cupo: 20, tasa: 0.93 },
  { classId: "11111111-0000-4000-8000-000000000002", name: "Yoga", dias: [2, 4], cupo: 15, tasa: 0.88 },
  { classId: "11111111-0000-4000-8000-000000000003", name: "Funcional", dias: [1, 4], cupo: 18, tasa: 0.81 },
  { classId: "11111111-0000-4000-8000-000000000004", name: "HIIT grupal", dias: [2, 5], cupo: 16, tasa: 0.74 },
  { classId: "11111111-0000-4000-8000-000000000005", name: "Zumba", dias: [3, 6], cupo: 25, tasa: 0.62 },
  { classId: "11111111-0000-4000-8000-000000000006", name: "Pilates", dias: [2, 4], cupo: 12, tasa: 0.55 },
  { classId: "11111111-0000-4000-8000-000000000007", name: "Crossfit", dias: [1, 3], cupo: 14, tasa: 0.47 },
  { classId: "11111111-0000-4000-8000-000000000008", name: "Boxeo", dias: [5], cupo: 20, tasa: 0.31 },
];

const clasesEmpate: PlantillaClase[] = [
  { classId: "22222222-0000-4000-8000-000000000001", name: "Core", dias: [1, 3], cupo: 20, tasa: 0.5 },
  { classId: "22222222-0000-4000-8000-000000000002", name: "Abdominales", dias: [1, 3], cupo: 20, tasa: 0.5 },
  { classId: "22222222-0000-4000-8000-000000000003", name: "Barra y glúteos", dias: [1, 3], cupo: 10, tasa: 0.5 },
];

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

function contarSesiones(from: string, to: string, dias: number[]): number {
  const fin = aFecha(to);
  const cursor = aFecha(from);
  let total = 0;
  while (cursor <= fin) {
    if (dias.includes(cursor.getDay())) total++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
}

function asignarEtiquetas(filas: FilaOcupacion[]): FilaOcupacion[] {
  const n = filas.length;
  const cantidad = n >= 6 ? 3 : Math.floor(n / 2);
  return filas.map((fila, i) => ({
    ...fila,
    label: i < cantidad ? "ALTA" : i >= n - cantidad ? "BAJA" : null,
  }));
}

function generarReporte(from: string, to: string, caso: Caso): Consulta {
  let plantillas = clasesBase;
  if (caso === "empate") plantillas = [...clasesBase, ...clasesEmpate];
  if (caso === "cinco") plantillas = clasesBase.slice(0, 5);
  if (caso === "cuatro") plantillas = clasesBase.slice(0, 4);

  const filas: FilaOcupacion[] = [];
  for (const p of plantillas) {
    const sesiones = contarSesiones(from, to, p.dias);
    if (sesiones === 0) continue;
    const totalCapacity = sesiones * p.cupo;
    const confirmedReservations = Math.round(totalCapacity * p.tasa);
    const occupancyPct = Math.round((confirmedReservations / totalCapacity) * 1000) / 10;
    filas.push({
      classId: p.classId,
      name: p.name,
      totalCapacity,
      confirmedReservations,
      occupancyPct,
      label: null,
    });
  }

  filas.sort(
    (a, b) =>
      b.occupancyPct - a.occupancyPct ||
      b.confirmedReservations - a.confirmedReservations ||
      a.name.localeCompare(b.name, "es")
  );

  return { from, to, data: asignarEtiquetas(filas) };
}

export default function OcupacionClasesPage() {
  const [caso, setCaso] = useState<Caso | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [errorRango, setErrorRango] = useState("");
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [resultado, setResultado] = useState<Consulta | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      const parametro = new URLSearchParams(window.location.search).get("caso");
      const validos = ["vacio", "error", "denegado", "empate", "cinco", "cuatro"];
      setCaso((validos.includes(parametro ?? "") ? parametro : "normal") as Caso);
    }, 0);

    return () => clearTimeout(temporizador);
  }, []);

  function consultar(e?: React.FormEvent) {
    e?.preventDefault();
    if (!caso) return;

    const mensaje = validarRango(from, to);
    setErrorRango(mensaje);
    if (mensaje) {
      setResultado(null);
      setFallo(false);
      return;
    }

    setCargando(true);
    setFallo(false);
    setResultado(null);

    const desde = from;
    const hasta = to;
    const casoActual = caso;

    setTimeout(() => {
      setCargando(false);
      if (casoActual === "error") {
        setFallo(true);
        return;
      }
      setResultado(
        casoActual === "vacio"
          ? { from: desde, to: hasta, data: [] }
          : generarReporte(desde, hasta, casoActual)
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
            <h2>Ocupación de clases</h2>
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
                            <th>#</th>
                            <th>Clase</th>
                            <th className={styles.numero}>Cupo total</th>
                            <th className={styles.numero}>Reservas confirmadas</th>
                            <th className={styles.numero}>Ocupación</th>
                            <th>Etiqueta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultado.data.map((fila, i) => (
                            <tr key={fila.classId}>
                              <td>{i + 1}</td>
                              <td className={styles.destacado}>{fila.name}</td>
                              <td className={styles.numero}>{fila.totalCapacity}</td>
                              <td className={styles.numero}>{fila.confirmedReservations}</td>
                              <td className={styles.numero}>{fila.occupancyPct.toFixed(1)}%</td>
                              <td>
                                {fila.label === "ALTA" && <span className={styles.alta}>Alta</span>}
                                {fila.label === "BAJA" && <span className={styles.baja}>Baja</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className={styles.pie}>
                      {resultado.data.length}{" "}
                      {resultado.data.length === 1 ? "clase" : "clases"} en el rango
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

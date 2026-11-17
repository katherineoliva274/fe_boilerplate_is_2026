"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Caso = "normal" | "error" | "denegado";

interface FilaMes {
  month: string;
  expired: number;
  renewed: number;
  cancelled: number;
  renewalRate: string | null;
  cancellationRate: string | null;
}

const MS_CARGA = 600;
const DIAS_GRACIA = 30;

const MENSAJE_SERVIDOR = "No se pudo cargar el reporte de renovaciones.";
const MENSAJE_DENEGADO = "Acceso denegado";
const MENSAJE_SIN_DATOS = "Sin datos para el periodo";
const ERROR_REQUERIDO = "Selecciona el mes inicial y el mes final";
const ERROR_ORDEN = "El mes final no puede ser anterior al mes inicial";
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

const nombresMes = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function aIndice(mes: string): number {
  const [a, m] = mes.split("-").map(Number);
  return a * 12 + (m - 1);
}

function deIndice(indice: number): string {
  const a = Math.floor(indice / 12);
  const m = (indice % 12) + 1;
  return `${a}-${String(m).padStart(2, "0")}`;
}

function etiquetaMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  const nombre = nombresMes[m - 1];
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${a}`;
}

function validarRango(from: string, to: string): string {
  if (!from || !to) return ERROR_REQUERIDO;
  const diferencia = aIndice(to) - aIndice(from);
  if (diferencia < 0) return ERROR_ORDEN;
  if (diferencia + 1 > 12) return ERROR_MAXIMO;
  return "";
}

function porcentaje(parte: number, total: number): string {
  return ((parte / total) * 100).toFixed(2);
}

function generarMeses(from: string, to: string, ahora: Date): FilaMes[] {
  const filas: FilaMes[] = [];

  for (let i = aIndice(from); i <= aIndice(to); i++) {
    const mes = deIndice(i);
    const [a, m] = mes.split("-").map(Number);
    const ultimoDia = new Date(a, m, 0, 12, 0, 0);
    const limite = new Date(ultimoDia.getTime() + DIAS_GRACIA * 86400000);
    const sinDatos = limite > ahora || i % 5 === 0;

    if (sinDatos) {
      filas.push({
        month: mes,
        expired: 0,
        renewed: 0,
        cancelled: 0,
        renewalRate: null,
        cancellationRate: null,
      });
      continue;
    }

    const expired = 14 + ((i * 7) % 19);
    const renewed = Math.min(expired, Math.round(expired * (0.55 + ((i * 3) % 8) / 20)));
    const cancelled = expired - renewed;

    filas.push({
      month: mes,
      expired,
      renewed,
      cancelled,
      renewalRate: porcentaje(renewed, expired),
      cancellationRate: porcentaje(cancelled, expired),
    });
  }

  return filas;
}

export default function RenovacionMembresiasPage() {
  const [caso, setCaso] = useState<Caso | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [errorRango, setErrorRango] = useState("");
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [meses, setMeses] = useState<FilaMes[] | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      const parametro = new URLSearchParams(window.location.search).get("caso");
      const validos = ["error", "denegado"];
      setCaso((validos.includes(parametro ?? "") ? parametro : "normal") as Caso);
    }, 0);

    return () => clearTimeout(temporizador);
  }, []);

  function consultar(e?: React.FormEvent) {
    e?.preventDefault();
    if (!caso) return;

    const mensaje = validarRango(from, to);
    setErrorRango(mensaje);
    setMeses(null);
    setFallo(false);
    if (mensaje) return;

    setCargando(true);

    const desde = from;
    const hasta = to;
    const casoActual = caso;

    setTimeout(() => {
      setCargando(false);
      if (casoActual === "error") {
        setFallo(true);
        return;
      }
      setMeses(generarMeses(desde, hasta, new Date()));
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
                className={opcion.nombre === "Reportes" ? styles.menuActivo : styles.menuItem}
              >
                {opcion.nombre}
              </Link>
            ))}
          </nav>
        </aside>

        <main className={styles.contenido}>
          <div className={styles.tituloSeccion}>
            <h2>Renovaciones y cancelaciones</h2>
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
                    <label htmlFor="from">Mes inicial (from)</label>
                    <input
                      id="from"
                      type="month"
                      required
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      aria-invalid={errorRango ? true : undefined}
                    />
                  </div>

                  <div className={styles.campo}>
                    <label htmlFor="to">Mes final (to)</label>
                    <input
                      id="to"
                      type="month"
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

                {!cargando && !fallo && !errorRango && !meses && (
                  <p className={styles.estado}>
                    Elige un rango de meses y presiona «Consultar».
                  </p>
                )}

                {meses && (
                  <>
                    <div className={styles.tablaContenedor}>
                      <table className={styles.tabla}>
                        <thead>
                          <tr>
                            <th>Mes</th>
                            <th className={styles.numero}>Vencidas</th>
                            <th className={styles.numero}>Renovadas</th>
                            <th className={styles.numero}>Canceladas</th>
                            <th className={styles.numero}>Tasa de renovación</th>
                            <th className={styles.numero}>Tasa de cancelación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meses.map((fila) => (
                            <tr key={fila.month}>
                              <td className={styles.destacado}>{etiquetaMes(fila.month)}</td>
                              {fila.renewalRate === null || fila.cancellationRate === null ? (
                                <td colSpan={5} className={styles.sinDatos}>
                                  {MENSAJE_SIN_DATOS}
                                </td>
                              ) : (
                                <>
                                  <td className={styles.numero}>{fila.expired}</td>
                                  <td className={styles.numero}>{fila.renewed}</td>
                                  <td className={styles.numero}>{fila.cancelled}</td>
                                  <td className={styles.numero}>{fila.renewalRate}%</td>
                                  <td className={styles.numero}>{fila.cancellationRate}%</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className={styles.pie}>
                      Cancelada: membresía vencida y no renovada dentro de los 30 días siguientes al
                      vencimiento. Solo se cuentan vencimientos con 30 días ya transcurridos.
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

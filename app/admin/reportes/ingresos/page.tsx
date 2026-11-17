"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Caso = "normal" | "vacio" | "error" | "denegado";
type Concepto = "MEMBRESIA" | "SESION_ADICIONAL";
type EstadoPago = "PAGADO" | "ANULADO" | "PENDIENTE";

interface Pago {
  concepto: Concepto;
  status: EstadoPago;
  paidAt: string;
  centavos: number;
}

interface ResultadoIngresos {
  from: string;
  to: string;
  totalUsd: string;
  byConcept: { concept: Concepto; totalUsd: string }[];
}

const MS_CARGA = 600;

const MENSAJE_SERVIDOR = "No se pudo cargar el reporte de ingresos.";
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

const nombresConcepto: Record<Concepto, string> = {
  MEMBRESIA: "Membresías",
  SESION_ADICIONAL: "Sesiones adicionales",
};

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

function formatoUsd(centavos: number): string {
  return `$${(centavos / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function crearPagos(ahora: Date): Pago[] {
  const montosMembresia = [2500, 4000, 6000, 850];
  const montosSesion = [850, 1500, 2000];
  const pagos: Pago[] = [];

  for (let d = 0; d <= 460; d++) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - d, 12, 0, 0);
    const paidAt = aIso(fecha);
    const status: EstadoPago = d % 7 === 0 ? "ANULADO" : d % 11 === 0 ? "PENDIENTE" : "PAGADO";

    if (d % 3 === 0) {
      pagos.push({
        concepto: "MEMBRESIA",
        status,
        paidAt,
        centavos: montosMembresia[d % montosMembresia.length],
      });
    }
    if (d % 4 === 1) {
      pagos.push({
        concepto: "SESION_ADICIONAL",
        status,
        paidAt,
        centavos: montosSesion[d % montosSesion.length],
      });
    }
  }

  return pagos;
}

function calcularIngresos(pagos: Pago[], from: string, to: string): ResultadoIngresos {
  const pagados = pagos.filter(
    (p) => p.status === "PAGADO" && p.paidAt >= from && p.paidAt <= to
  );
  const suma = (concepto: Concepto) =>
    pagados.filter((p) => p.concepto === concepto).reduce((acc, p) => acc + p.centavos, 0);

  const membresias = suma("MEMBRESIA");
  const sesiones = suma("SESION_ADICIONAL");

  return {
    from,
    to,
    totalUsd: ((membresias + sesiones) / 100).toFixed(2),
    byConcept: [
      { concept: "MEMBRESIA", totalUsd: (membresias / 100).toFixed(2) },
      { concept: "SESION_ADICIONAL", totalUsd: (sesiones / 100).toFixed(2) },
    ],
  };
}

export default function ReporteIngresosPage() {
  const [caso, setCaso] = useState<Caso | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [errorRango, setErrorRango] = useState("");
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [resultado, setResultado] = useState<ResultadoIngresos | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      const parametro = new URLSearchParams(window.location.search).get("caso");
      const validos = ["vacio", "error", "denegado"];
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

    setTimeout(() => {
      setCargando(false);
      if (casoActual === "error") {
        setFallo(true);
        return;
      }
      const pagos = casoActual === "vacio" ? [] : crearPagos(new Date());
      setResultado(calcularIngresos(pagos, desde, hasta));
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
                className={opcion.nombre === "Pagos" ? styles.menuActivo : styles.menuItem}
              >
                {opcion.nombre}
              </Link>
            ))}
          </nav>
        </aside>

        <main className={styles.contenido}>
          <div className={styles.tituloSeccion}>
            <h2>Reporte de ingresos</h2>
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

                {resultado && (
                  <>
                    <p className={styles.rango}>
                      Del {mostrarFecha(resultado.from)} al {mostrarFecha(resultado.to)} · solo pagos
                      en estado PAGADO
                    </p>
                    <div className={styles.tarjetas}>
                      <article className={styles.tarjetaTotal}>
                        <h4>Total de ingresos</h4>
                        <p className={styles.montoTotal}>
                          {formatoUsd(Math.round(Number(resultado.totalUsd) * 100))}
                        </p>
                        <span className={styles.moneda}>USD</span>
                      </article>
                      {resultado.byConcept.map((c) => (
                        <article className={styles.tarjetaConcepto} key={c.concept}>
                          <h4>{nombresConcepto[c.concept]}</h4>
                          <p className={styles.monto}>
                            {formatoUsd(Math.round(Number(c.totalUsd) * 100))}
                          </p>
                          <span className={styles.moneda}>USD</span>
                        </article>
                      ))}
                    </div>
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

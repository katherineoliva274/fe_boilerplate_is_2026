"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { descargarArchivo, generarPdfComprobante } from "@/lib/receipt-pdf";
import styles from "./page.module.css";

type Concepto = "MEMBRESIA" | "SESION_ADICIONAL";
type Metodo = "TARJETA" | "EFECTIVO";
type EstadoPago = "PAGADO" | "ANULADO";

interface Comprobante {
  id: string;
  number: string;
  memberName: string;
  concept: Concepto;
  amountUsd: string;
  method: Metodo;
  issuedAt: string;
  paymentStatus: EstadoPago;
}

const ID_DESCARGA_CON_ERROR = "rec-error";

const MENSAJE_DESCARGA = "No se pudo descargar el comprobante. Intente de nuevo.";

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

function mostrarFechaHora(iso: string): string {
  const f = new Date(iso);
  return `${dosDigitos(f.getDate())}/${dosDigitos(f.getMonth() + 1)}/${f.getFullYear()} ${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`;
}

function mostrarMonto(monto: string): string {
  return `$${Number(monto).toFixed(2)}`;
}

function nombreConcepto(concepto: Concepto): string {
  return concepto === "MEMBRESIA" ? "Membresía" : "Sesión adicional";
}

function nombreMetodo(metodo: Metodo): string {
  return metodo === "TARJETA" ? "Tarjeta" : "Efectivo";
}
function crearComprobantes(ahora: Date): Comprobante[] {
  const haceDias = (n: number) =>
    new Date(ahora.getTime() - n * 86400000).toISOString();

  return [
    { id: "rec-1", number: "C-000125", memberName: "Ana Martínez", concept: "MEMBRESIA", amountUsd: "25.00", method: "TARJETA", issuedAt: haceDias(1), paymentStatus: "PAGADO" },
    { id: "rec-2", number: "C-000126", memberName: "Ana Martínez", concept: "SESION_ADICIONAL", amountUsd: "8.50", method: "EFECTIVO", issuedAt: haceDias(3), paymentStatus: "PAGADO" },
    { id: "rec-3", number: "C-000124", memberName: "Ana Martínez", concept: "MEMBRESIA", amountUsd: "25.00", method: "TARJETA", issuedAt: haceDias(31), paymentStatus: "ANULADO" },
    { id: ID_DESCARGA_CON_ERROR, number: "C-000127", memberName: "Ana Martínez", concept: "MEMBRESIA", amountUsd: "45.00", method: "TARJETA", issuedAt: haceDias(5), paymentStatus: "PAGADO" },
  ];
}

export default function ComprobantePage() {
  const parametros = useParams<{ receiptId: string }>();
  const receiptId = String(parametros?.receiptId ?? "");

  const [comprobantes, setComprobantes] = useState<Comprobante[] | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setComprobantes(crearComprobantes(new Date()));
    }, 400);

    return () => clearTimeout(temporizador);
  }, []);

  const comprobante = comprobantes?.find((c) => c.id === receiptId) ?? null;
  const anulado = comprobante?.paymentStatus === "ANULADO";

  async function descargar() {
    if (!comprobante || descargando) return;

    setDescargando(true);
    setError("");

    try {
      await new Promise((resolver) => setTimeout(resolver, 700));
      if (comprobante.id === ID_DESCARGA_CON_ERROR) {
        throw new Error("Fallo simulado de la descarga");
      }

      const pdf = generarPdfComprobante({
        numero: comprobante.number,
        miembro: comprobante.memberName,
        concepto: nombreConcepto(comprobante.concept),
        montoUsd: comprobante.amountUsd,
        metodo: nombreMetodo(comprobante.method),
        fechaHora: mostrarFechaHora(comprobante.issuedAt),
        anulado: comprobante.paymentStatus === "ANULADO",
      });
      descargarArchivo(pdf, `comprobante-${comprobante.number}.pdf`);
    } catch {
      setError(MENSAJE_DESCARGA);
    } finally {
      setDescargando(false);
    }
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
                  opcion.nombre === "Pagos"
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
            <h2>Comprobante de pago</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          <section className={styles.tarjeta}>
            <h3>Detalle de la información</h3>

            {comprobantes === null ? (
              <p role="status" className={styles.estado}>
                Cargando comprobante...
              </p>
            ) : !comprobante ? (
              <>
                <p role="status" className={styles.estado}>
                  Comprobante no encontrado
                </p>
                <div className={styles.centrado}>
                  <Link href="/pagos" className={styles.secundario}>
                    Volver a pagos
                  </Link>
                </div>
              </>
            ) : (
              <>
                <dl className={styles.lista}>
                  <div className={styles.fila}>
                    <dt>Comprobante n.º</dt>
                    <dd>{comprobante.number}</dd>
                  </div>
                  <div className={styles.fila}>
                    <dt>Miembro y concepto</dt>
                    <dd>
                      {comprobante.memberName} · {nombreConcepto(comprobante.concept)}
                    </dd>
                  </div>
                  <div className={styles.fila}>
                    <dt>Monto en USD</dt>
                    <dd>{mostrarMonto(comprobante.amountUsd)}</dd>
                  </div>
                  <div className={styles.fila}>
                    <dt>Método de pago</dt>
                    <dd>{nombreMetodo(comprobante.method)}</dd>
                  </div>
                  <div className={styles.fila}>
                    <dt>Fecha y hora</dt>
                    <dd>{mostrarFechaHora(comprobante.issuedAt)}</dd>
                  </div>
                  <div className={styles.fila}>
                    <dt>Estado</dt>
                    <dd>
                      {anulado ? (
                        <span className={styles.sello}>ANULADO</span>
                      ) : (
                        "No aplica"
                      )}
                    </dd>
                  </div>
                </dl>

                {error && (
                  <p role="alert" className={styles.error}>
                    {error}
                  </p>
                )}

                <div className={styles.acciones}>
                  <Link href="/pagos" className={styles.secundario}>
                    Volver a pagos
                  </Link>
                  <button
                    type="button"
                    className={styles.descargar}
                    onClick={descargar}
                    disabled={descargando}
                    aria-busy={descargando}
                  >
                    {descargando ? "Generando PDF…" : "Descargar PDF"}
                  </button>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

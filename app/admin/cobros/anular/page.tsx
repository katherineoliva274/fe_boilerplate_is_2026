"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Concepto = "MEMBRESIA" | "SESION_ADICIONAL" | "SESION_PERSONAL";
type EstadoPago = "PENDIENTE" | "PAGADO" | "ANULADO";

interface Pago {
  id: string;
  receiptNumber?: string;
  memberName: string;
  concept: Concepto;
  amountUsd: string;
  status: EstadoPago;
  paidAt?: string;
  dueDate?: string;
  voidReason?: string;
  voidedAt?: string;
}

interface AlmacenCobros {
  pagos: Pago[];
}

const CLAVE_COBROS = "gkds_cobros_prototipo";
const FORMATO_COMPROBANTE = /^C-\d{6}$/;
const MIN_MOTIVO = 10;
const MAX_MOTIVO = 255;
const COMPROBANTE_CON_ERROR = "C-000500";

const MENSAJE_FORMATO = "Formato inválido. Use C-000000";
const MENSAJE_NO_ENCONTRADO = "Comprobante no encontrado";
const MENSAJE_SERVIDOR = "No se pudo anular el cobro. Intente de nuevo.";
const MENSAJE_NO_PAGADO = "Solo se puede anular un cobro en estado PAGADO";

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

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

function mostrarFechaHora(iso: string): string {
  const f = new Date(iso);
  return `${dosDigitos(f.getDate())}/${dosDigitos(f.getMonth() + 1)}/${f.getFullYear()} ${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`;
}

function mostrarFecha(iso: string): string {
  const f = new Date(iso);
  return `${dosDigitos(f.getDate())}/${dosDigitos(f.getMonth() + 1)}/${f.getFullYear()}`;
}

function mostrarMonto(monto: string): string {
  return `$${Number(monto).toFixed(2)}`;
}

function nombreConcepto(concepto: Concepto): string {
  if (concepto === "MEMBRESIA") return "Membresía";
  if (concepto === "SESION_ADICIONAL") return "Sesión adicional";
  return "Sesión personal";
}

function crearAlmacenInicial(ahora: Date): AlmacenCobros {
  const haceDias = (n: number) =>
    new Date(ahora.getTime() - n * 86400000).toISOString();

  return {
    pagos: [
      { id: "pay-1", receiptNumber: "C-000001", memberName: "Ana Martínez", concept: "MEMBRESIA", amountUsd: "25.00", status: "PAGADO", paidAt: haceDias(2) },
      { id: "pay-2", receiptNumber: "C-000002", memberName: "Luis Hernández", concept: "SESION_ADICIONAL", amountUsd: "8.50", status: "PAGADO", paidAt: haceDias(4) },
      { id: "pay-3", receiptNumber: "C-000003", memberName: "María López", concept: "SESION_PERSONAL", amountUsd: "15.00", status: "PAGADO", paidAt: haceDias(1) },
      { id: "pay-4", receiptNumber: "C-000004", memberName: "Carlos Ramírez", concept: "MEMBRESIA", amountUsd: "25.00", status: "ANULADO", paidAt: haceDias(10), voidedAt: haceDias(9), voidReason: "Cobro duplicado por error de caja" },
      { id: "pay-5", receiptNumber: COMPROBANTE_CON_ERROR, memberName: "Sofía Castillo", concept: "MEMBRESIA", amountUsd: "45.00", status: "PAGADO", paidAt: haceDias(3) },
    ],
  };
}

function leerAlmacen(): AlmacenCobros | null {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_COBROS);
    return crudo ? (JSON.parse(crudo) as AlmacenCobros) : null;
  } catch {
    return null;
  }
}

function guardarAlmacen(almacen: AlmacenCobros) {
  window.sessionStorage.setItem(CLAVE_COBROS, JSON.stringify(almacen));
}

export default function AnularCobroPage() {
  const [almacen, setAlmacen] = useState<AlmacenCobros | null>(null);
  const [numero, setNumero] = useState("");
  const [errorNumero, setErrorNumero] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [pagoId, setPagoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");
  const dialogoRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      let datos = leerAlmacen();
      if (!datos) {
        datos = crearAlmacenInicial(new Date());
        try {
          guardarAlmacen(datos);
        } catch {}
      }
      setAlmacen(datos);
    }, 0);

    return () => clearTimeout(temporizador);
  }, []);

  const pago = almacen?.pagos.find((p) => p.id === pagoId) ?? null;
  const motivoLimpio = motivo.trim();
  const motivoValido =
    motivoLimpio.length >= MIN_MOTIVO && motivoLimpio.length <= MAX_MOTIVO;
  const anulable = pago?.status === "PAGADO";

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (buscando) return;

    const valor = numero.trim().toUpperCase();
    setExito("");
    setError("");
    setPagoId(null);
    setMotivo("");

    if (!FORMATO_COMPROBANTE.test(valor)) {
      setErrorNumero(valor ? MENSAJE_FORMATO : "Ingrese un número de comprobante");
      return;
    }

    setErrorNumero("");
    setBuscando(true);
    await new Promise((resolver) => setTimeout(resolver, 500));

    const actual = leerAlmacen() ?? almacen;
    const encontrado = actual?.pagos.find((p) => p.receiptNumber === valor);

    if (actual) setAlmacen(actual);
    if (!encontrado) {
      setErrorNumero(MENSAJE_NO_ENCONTRADO);
    } else {
      setPagoId(encontrado.id);
    }
    setBuscando(false);
  }

  function abrirDialogo() {
    if (!anulable || !motivoValido) return;
    setError("");
    dialogoRef.current?.showModal();
  }

  function cerrarDialogo() {
    if (procesando) return;
    dialogoRef.current?.close();
  }

  async function confirmar() {
    if (!pago || !almacen || procesando) return;

    setProcesando(true);
    setError("");

    try {
      await new Promise((resolver) => setTimeout(resolver, 700));

      if (pago.receiptNumber === COMPROBANTE_CON_ERROR) {
        throw new Error("Fallo simulado del servidor");
      }

      const actual = leerAlmacen() ?? almacen;
      const vigente = actual.pagos.find((p) => p.id === pago.id);
      if (!vigente || vigente.status !== "PAGADO") {
        dialogoRef.current?.close();
        setAlmacen(actual);
        setError(MENSAJE_NO_PAGADO);
        return;
      }

      const ahora = new Date();
      const vencimiento = new Date(ahora.getTime() + 3 * 86400000);
      const nuevo: Pago = {
        id: `pay-${Date.now()}`,
        memberName: vigente.memberName,
        concept: vigente.concept,
        amountUsd: vigente.amountUsd,
        status: "PENDIENTE",
        dueDate: vencimiento.toISOString(),
      };

      const siguiente: AlmacenCobros = {
        pagos: [
          ...actual.pagos.map((p) =>
            p.id === vigente.id
              ? {
                  ...p,
                  status: "ANULADO" as const,
                  voidReason: motivoLimpio,
                  voidedAt: ahora.toISOString(),
                }
              : p
          ),
          nuevo,
        ],
      };

      guardarAlmacen(siguiente);
      setAlmacen(siguiente);
      setMotivo("");
      dialogoRef.current?.close();
      setExito(
        `Cobro anulado. Se generó un nuevo cobro pendiente de ${mostrarMonto(nuevo.amountUsd)} con vencimiento el ${mostrarFecha(nuevo.dueDate!)}.`
      );
    } catch {
      dialogoRef.current?.close();
      setError(MENSAJE_SERVIDOR);
    } finally {
      setProcesando(false);
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
            <h2>Anular cobro</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          {exito && (
            <p role="status" className={styles.exito}>
              {exito}
            </p>
          )}
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}

          <section className={styles.tarjeta}>
            <h3>Buscar comprobante</h3>
            <form className={styles.busqueda} onSubmit={buscar} noValidate>
              <div className={styles.campo}>
                <label htmlFor="receiptNumber">Número de comprobante</label>
                <div className={styles.fila}>
                  <input
                    id="receiptNumber"
                    type="text"
                    value={numero}
                    placeholder="C-000000"
                    maxLength={8}
                    aria-invalid={errorNumero ? true : undefined}
                    aria-describedby={errorNumero ? "error-numero" : undefined}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                  <button
                    type="submit"
                    className={styles.guardar}
                    disabled={buscando || !almacen}
                  >
                    {buscando ? "Buscando..." : "Buscar"}
                  </button>
                </div>
                {errorNumero && (
                  <p id="error-numero" role="alert" className={styles.errorCampo}>
                    {errorNumero}
                  </p>
                )}
              </div>
            </form>
          </section>

          <section className={styles.tarjeta}>
            <h3>Detalle del cobro</h3>

            {buscando ? (
              <p role="status" className={styles.estadoVacio}>
                Buscando comprobante...
              </p>
            ) : !pago ? (
              <p role="status" className={styles.estadoVacio}>
                Busque un comprobante
              </p>
            ) : (
              <>
                <dl className={styles.detalle}>
                  <div>
                    <dt>Comprobante</dt>
                    <dd>{pago.receiptNumber}</dd>
                  </div>
                  <div>
                    <dt>Miembro</dt>
                    <dd>{pago.memberName}</dd>
                  </div>
                  <div>
                    <dt>Concepto</dt>
                    <dd>{nombreConcepto(pago.concept)}</dd>
                  </div>
                  <div>
                    <dt>Monto</dt>
                    <dd>{mostrarMonto(pago.amountUsd)}</dd>
                  </div>
                  <div>
                    <dt>Fecha de pago</dt>
                    <dd>{pago.paidAt ? mostrarFechaHora(pago.paidAt) : "—"}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>
                      <span
                        className={`${styles.insignia} ${styles[`estado${pago.status}`]}`}
                      >
                        {pago.status}
                      </span>
                    </dd>
                  </div>
                </dl>

                {pago.status === "ANULADO" ? (
                  <div className={styles.resumenAnulacion}>
                    <p>
                      Este cobro fue anulado
                      {pago.voidedAt
                        ? ` el ${mostrarFechaHora(pago.voidedAt)}`
                        : ""}
                      .
                    </p>
                    <p>
                      Motivo:{" "}
                      <strong>{pago.voidReason ?? "Sin motivo indicado"}</strong>
                    </p>
                  </div>
                ) : (
                  <form
                    className={styles.formulario}
                    onSubmit={(e) => {
                      e.preventDefault();
                      abrirDialogo();
                    }}
                  >
                    <div className={styles.campo}>
                      <label htmlFor="reason">Motivo de anulación</label>
                      <textarea
                        id="reason"
                        rows={4}
                        maxLength={MAX_MOTIVO}
                        value={motivo}
                        disabled={!anulable}
                        placeholder="Escribe el motivo (mínimo 10 caracteres)..."
                        onChange={(e) => setMotivo(e.target.value)}
                      />
                      <span className={styles.contador}>
                        {motivo.length}/{MAX_MOTIVO}
                      </span>
                    </div>

                    {!anulable && (
                      <p role="alert" className={styles.advertencia}>
                        {MENSAJE_NO_PAGADO}
                      </p>
                    )}

                    <div className={styles.acciones}>
                      <button
                        type="submit"
                        className={styles.peligro}
                        disabled={!anulable || !motivoValido}
                      >
                        Anular
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </section>
        </main>
      </div>

      <dialog
        ref={dialogoRef}
        className={styles.dialogo}
        aria-labelledby="titulo-dialogo"
        onCancel={(e) => {
          if (procesando) e.preventDefault();
        }}
      >
        <h3 id="titulo-dialogo">Confirmar operación</h3>
        <p className={styles.pregunta}>
          ¿Anular este cobro? Esta acción no se puede deshacer.
        </p>

        {pago && (
          <ul className={styles.resumen}>
            <li>Pago registrado: {pago.receiptNumber}</li>
            <li>
              Miembro / concepto: {pago.memberName} / {nombreConcepto(pago.concept)}
            </li>
            <li>
              Monto y fecha: {mostrarMonto(pago.amountUsd)}
              {pago.paidAt ? ` · ${mostrarFecha(pago.paidAt)}` : ""}
            </li>
            <li>Motivo de anulación: {motivoLimpio}</li>
          </ul>
        )}

        {procesando && (
          <p role="status" className={styles.procesando}>
            Anulando cobro...
          </p>
        )}

        <div className={styles.accionesDialogo}>
          <button
            type="button"
            className={styles.secundario}
            onClick={cerrarDialogo}
            disabled={procesando}
          >
            Volver
          </button>
          <button
            type="button"
            className={styles.guardar}
            onClick={confirmar}
            disabled={procesando}
          >
            Confirmar
          </button>
        </div>
      </dialog>
    </div>
  );
}

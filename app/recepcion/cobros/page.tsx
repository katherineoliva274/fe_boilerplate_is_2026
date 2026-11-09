
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type MetodoPago = "EFECTIVO" | "TARJETA";

interface Pago {
  id: number;
  numero: string;
  miembro: string;
  concepto: string;
  monto: number;
  vencimiento: string;
  estado: "PENDIENTE" | "PAGADO";
}

interface Comprobante {
  numero: string;
  miembro: string;
  concepto: string;
  monto: number;
  metodo: MetodoPago;
  fecha: string;
}

const pagosEjemplo: Pago[] = [
  {
    id: 1,
    numero: "M-000001",
    miembro: "María López",
    concepto: "Renovación de membresía mensual",
    monto: 25,
    vencimiento: "2026-11-30",
    estado: "PENDIENTE",
  },
  {
    id: 2,
    numero: "M-000002",
    miembro: "Carlos Martínez",
    concepto: "Renovación de membresía mensual",
    monto: 25,
    vencimiento: "2026-11-10",
    estado: "PENDIENTE",
  },
  {
    id: 3,
    numero: "M-000003",
    miembro: "Ana Rodríguez",
    concepto: "Compra de membresía trimestral",
    monto: 65,
    vencimiento: "2026-11-15",
    estado: "PENDIENTE",
  },
  {
    id: 4,
    numero: "M-000004",
    miembro: "José Hernández",
    concepto: "Compra de membresía mensual",
    monto: 25,
    vencimiento: "2026-11-07",
    estado: "PAGADO",
  },
  {
    id: 5,
    numero: "M-000005",
    miembro: "Sofía Ramírez",
    concepto: "Renovación de membresía mensual",
    monto: 25,
    vencimiento: "2026-11-25",
    estado: "PENDIENTE",
  },
];

const menu = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Membresías", ruta: "/admin/membresias" },
  { nombre: "Clases y reservas", ruta: "/clases" },
  { nombre: "Entrenadores", ruta: "/entrenadores" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Máquinas", ruta: "/maquinas" },
  { nombre: "Registro de cobros", ruta: "/recepcion/cobros" },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
  { nombre: "Reportes", ruta: "/reportes" },
];

function moneda(monto: number) {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
  }).format(monto);
}

function fechaCorta(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

function fechaHora(fecha: string) {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/El_Salvador",
  }).format(new Date(fecha));
}

export default function RegistroCobrosPage() {
  const [pagos, setPagos] = useState<Pago[]>(pagosEjemplo);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<Pago | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>("EFECTIVO");
  const [efectivo, setEfectivo] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);

  const resultados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    if (termino.length < 2) return [];

    return pagos.filter(
      (pago) =>
        pago.miembro.toLowerCase().includes(termino) ||
        pago.numero.toLowerCase().includes(termino)
    );
  }, [busqueda, pagos]);

  const pendientes = pagos.filter(
    (pago) => pago.estado === "PENDIENTE"
  );

  const efectivoNumero = Number(efectivo);
  const efectivoValido =
    efectivo.trim() !== "" &&
    Number.isFinite(efectivoNumero) &&
    efectivoNumero >= (seleccionado?.monto ?? 0);

  const cambio =
    seleccionado && efectivoValido
      ? efectivoNumero - seleccionado.monto
      : 0;

  function seleccionarPago(pago: Pago) {
    if (pago.estado === "PAGADO") return;
    setSeleccionado(pago);
    setMetodo("EFECTIVO");
    setEfectivo("");
    setError("");
    setMensaje("");
  }

  function solicitarConfirmacion() {
    setError("");

    if (!seleccionado) {
      setError("Selecciona un pago pendiente.");
      return;
    }

    if (seleccionado.estado !== "PENDIENTE") {
      setError("Este pago ya fue registrado.");
      return;
    }

    if (metodo === "EFECTIVO" && !efectivoValido) {
      setError("El efectivo recibido debe cubrir el monto del pago.");
      return;
    }

    setConfirmando(true);
  }

  function registrarPago() {
    if (!seleccionado) return;

    const pagoActual = pagos.find(
      (pago) => pago.id === seleccionado.id
    );

    if (!pagoActual || pagoActual.estado !== "PENDIENTE") {
      setConfirmando(false);
      setError("El pago ya no está pendiente.");
      return;
    }

    const comprobante: Comprobante = {
      numero: `SIM-${String(seleccionado.id).padStart(4, "0")}`,
      miembro: seleccionado.miembro,
      concepto: seleccionado.concepto,
      monto: seleccionado.monto,
      metodo,
      fecha: new Date().toISOString(),
    };

    setPagos((anteriores) =>
      anteriores.map((pago) =>
        pago.id === seleccionado.id
          ? { ...pago, estado: "PAGADO" }
          : pago
      )
    );

    setComprobantes((anteriores) => [
      comprobante,
      ...anteriores,
    ]);

    setMensaje(
      `Pago de ${seleccionado.miembro} registrado.`
    );

    setConfirmando(false);
    setSeleccionado(null);
    setEfectivo("");
    setBusqueda("");
  }

  return (
    <div className={styles.contenedor}>
      <header className={styles.encabezado}>
        <h1>GKDS/GYM</h1>
      </header>

      <div className={styles.estructura}>
        <aside className={styles.sidebar}>

          <nav className={styles.navegacion}>
            {menu.map((opcion) => (
              <Link
                key={opcion.nombre}
                href={opcion.ruta}
                className={
                  opcion.nombre === "Registro de cobros"
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
            <h2>Registro de pagos</h2>
            <span className={styles.etiqueta}>Prototipo</span>
          </div>

          <section className={styles.resumen}>
            <div className={styles.resumenItem}>
              <span>Pagos pendientes</span>
              <strong>{pendientes.length}</strong>
            </div>
            <div className={styles.resumenItem}>
              <span>Monto pendiente</span>
              <strong>
                {moneda(
                  pendientes.reduce(
                    (total, pago) => total + pago.monto,
                    0
                  )
                )}
              </strong>
            </div>
            <div className={styles.resumenItem}>
              <span>Cobros realizados en esta sesión</span>
              <strong>{comprobantes.length}</strong>
            </div>
          </section>

          <section className={styles.tarjeta}>
            <h3>Buscar miembro</h3>
            <p className={styles.descripcion}>
              Busca un miembro por nombre o número para consultar
              sus pagos pendientes.
            </p>

            <div className={styles.campo}>
              <label htmlFor="busqueda">
                Nombre o número de miembro
              </label>
              <input
                id="busqueda"
                type="search"
                placeholder="Ej. María o M-000001"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setSeleccionado(null);
                  setError("");
                }}
              />
            </div>

            {busqueda.trim().length >= 2 && (
              <div className={styles.resultados}>
                <h4>Resultados de búsqueda</h4>
                {resultados.length === 0 ? (
                  <p className={styles.sinResultados}>
                    No se encontró ningún miembro.
                  </p>
                ) : (
                  <div className={styles.tablaContenedor}>
                    <table className={styles.tabla}>
                      <thead>
                        <tr>
                          <th>Número</th>
                          <th>Miembro</th>
                          <th>Concepto</th>
                          <th>Monto</th>
                          <th>Estado</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultados.map((pago) => (
                          <tr key={pago.id}>
                            <td>{pago.numero}</td>
                            <td>{pago.miembro}</td>
                            <td>{pago.concepto}</td>
                            <td>{moneda(pago.monto)}</td>
                            <td>
                              <span
                                className={
                                  pago.estado === "PENDIENTE"
                                    ? styles.pendiente
                                    : styles.pagado
                                }
                              >
                                {pago.estado}
                              </span>
                            </td>
                            <td>
                              {pago.estado === "PENDIENTE" ? (
                                <button
                                  type="button"
                                  className={styles.botonSeleccionar}
                                  onClick={() => seleccionarPago(pago)}
                                >
                                  Seleccionar
                                </button>
                              ) : (
                                "Sin cobros pendientes"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {resultados.length > 0 &&
                  resultados.every(
                    (pago) => pago.estado === "PAGADO"
                  ) && (
                    <p className={styles.aviso}>
                      El miembro no tiene pagos pendientes.
                      {" "}
                      <Link href="/admin/membresias">
                        Ir a membresías
                      </Link>
                    </p>
                  )}
              </div>
            )}
          </section>

          <section className={styles.tarjeta}>
            <h3>Detalle del cobro</h3>

            {seleccionado ? (
              <>
                <div className={styles.fila}>
                  <strong>Miembro</strong>
                  <span>{seleccionado.miembro}</span>
                </div>

                <div className={styles.fila}>
                  <strong>Número de miembro</strong>
                  <span>{seleccionado.numero}</span>
                </div>

                <div className={styles.fila}>
                  <strong>Concepto</strong>
                  <span>{seleccionado.concepto}</span>
                </div>

                <div className={styles.fila}>
                  <strong>Vencimiento</strong>
                  <span>
                    {fechaCorta(seleccionado.vencimiento)}
                  </span>
                </div>

                <div className={styles.fila}>
                  <strong>Total a pagar</strong>
                  <strong className={styles.monto}>
                    {moneda(seleccionado.monto)}
                  </strong>
                </div>

                <div className={styles.formularioPago}>
                  <div className={styles.campo}>
                    <label htmlFor="metodo">Método de pago</label>
                    <select
                      id="metodo"
                      value={metodo}
                      onChange={(e) => {
                        setMetodo(e.target.value as MetodoPago);
                        setEfectivo("");
                        setError("");
                      }}
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TARJETA">
                        Tarjeta (simulación)
                      </option>
                    </select>
                  </div>

                  {metodo === "EFECTIVO" && (
                    <div className={styles.campo}>
                      <label htmlFor="efectivo">
                        Efectivo recibido ($)
                      </label>
                      <input
                        id="efectivo"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={efectivo}
                        onChange={(e) => setEfectivo(e.target.value)}
                      />
                      <p className={styles.ayuda}>
                        Cambio: {moneda(cambio)}
                      </p>
                    </div>
                  )}

                  {metodo === "TARJETA" && (
                    <p className={styles.aviso}>
                      Este método es únicamente una simulación.
                      No se procesará ni almacenará ninguna tarjeta.
                    </p>
                  )}
                </div>

                {error && (
                  <div className={styles.error} role="alert">
                    {error}
                  </div>
                )}

                <div className={styles.acciones}>
                  <button
                    type="button"
                    className={styles.botonCancelar}
                    onClick={() => {
                      setSeleccionado(null);
                      setError("");
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={styles.botonPrincipal}
                    onClick={solicitarConfirmacion}
                  >
                    Confirmar cobro
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.estadoVacio}>
                Selecciona un pago pendiente para visualizar
                el detalle del cobro.
              </div>
            )}

            {mensaje && (
              <div className={styles.exito} role="status">
                {mensaje}
              </div>
            )}
          </section>

          <section className={styles.tarjeta}>
            <h3>Cobros realizados en esta sesión</h3>

            {comprobantes.length === 0 ? (
              <div className={styles.estadoVacio}>
                Todavía no se han realizado cobros
                en esta demostración.
              </div>
            ) : (
              <div className={styles.tablaContenedor}>
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th>Comprobante</th>
                      <th>Miembro</th>
                      <th>Concepto</th>
                      <th>Monto</th>
                      <th>Método</th>
                      <th>Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comprobantes.map((comprobante) => (
                      <tr key={comprobante.numero}>
                        <td>{comprobante.numero}</td>
                        <td>{comprobante.miembro}</td>
                        <td>{comprobante.concepto}</td>
                        <td>{moneda(comprobante.monto)}</td>
                        <td>{comprobante.metodo}</td>
                        <td>{fechaHora(comprobante.fecha)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </main>
      </div>

      {confirmando && seleccionado && (
        <div className={styles.modalFondo}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloConfirmacion"
          >
            <h3 id="tituloConfirmacion">
              Confirmar registro de pago
            </h3>

            <p>
              ¿Deseas confirmar el cobro de{" "}
              <strong>{moneda(seleccionado.monto)}</strong>
              {" "}correspondiente a{" "}
              <strong>{seleccionado.miembro}</strong>?
            </p>

            <div className={styles.fila}>
              <strong>Método de pago</strong>
              <span>{metodo}</span>
            </div>

            <div className={styles.acciones}>
              <button
                type="button"
                className={styles.botonCancelar}
                onClick={() => setConfirmando(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.botonPrincipal}
                onClick={registrarPago}
              >
                Sí, registrar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

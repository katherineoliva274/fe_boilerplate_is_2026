"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

type Concepto = "MEMBRESIA" | "SESION_ADICIONAL";
type EstadoPago = "PENDIENTE" | "PAGADO" | "ANULADO";

interface Pago {
  id: string;
  concept: Concepto;
  amountUsd: string;
  dueDate: string; 
  status: EstadoPago;
  paidAt?: string;
  receiptNumber?: string;
  cardLast4?: string;
  gatewayRef?: string;
}

interface AlmacenPagos {
  pagos: Pago[];
  siguienteComprobante: number;
}

interface Tarjeta {
  cardNumber: string; 
  holder: string;
  expiry: string; 
  cvv: string;
}

type Errores = Partial<Record<keyof Tarjeta, string>>;

type Resultado =
  | { tipo: "aprobado"; receiptNumber: string }
  | { tipo: "rechazado"; motivo: string }
  | { tipo: "error"; mensaje: string };

const CLAVE_PAGOS = "gkds_pagos_prototipo";

const TERMINACIONES_APROBADAS = ["4242", "1234"];
const MS_PASARELA = 2000;

const MENSAJE_SERVIDOR = "No se pudo procesar el pago. Intente de nuevo.";

const TARJETA_VACIA: Tarjeta = {
  cardNumber: "",
  holder: "",
  expiry: "",
  cvv: "",
};

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

function claveIso(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}
function mostrarFechaIso(texto: string): string {
  const [anio, mes, dia] = texto.split("-");
  return `${dia}/${mes}/${anio}`;
}

function mostrarMonto(monto: string): string {
  return `$${Number(monto).toFixed(2)}`;
}

function nombreConcepto(concepto: Concepto): string {
  return concepto === "MEMBRESIA" ? "Membresía" : "Sesión adicional";
}

function soloDigitos(texto: string, maximo: number): string {
  return texto.replace(/\D/g, "").slice(0, maximo);
}

function agruparTarjeta(digitos: string): string {
  return digitos.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatearVencimiento(texto: string): string {
  const digitos = soloDigitos(texto, 4);
  return digitos.length > 2
    ? `${digitos.slice(0, 2)}/${digitos.slice(2)}`
    : digitos;
}

function crearAlmacenInicial(ahora: Date): AlmacenPagos {
  const enDias = (n: number) =>
    claveIso(
      new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + n)
    );

  return {
    pagos: [
      { id: "pay-0", concept: "MEMBRESIA", amountUsd: "25.00", dueDate: enDias(-25), status: "PAGADO", paidAt: new Date(ahora.getTime() - 25 * 86400000).toISOString(), receiptNumber: "C-000001", cardLast4: "4242", gatewayRef: "SIM-0" },
      { id: "pay-1", concept: "MEMBRESIA", amountUsd: "25.00", dueDate: enDias(2), status: "PENDIENTE" },
      { id: "pay-2", concept: "SESION_ADICIONAL", amountUsd: "8.50", dueDate: enDias(5), status: "PENDIENTE" },
      { id: "pay-3", concept: "MEMBRESIA", amountUsd: "45.00", dueDate: enDias(9), status: "PENDIENTE" },
    ],
    siguienteComprobante: 2,
  };
}

function leerAlmacen(): AlmacenPagos | null {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_PAGOS);
    return crudo ? (JSON.parse(crudo) as AlmacenPagos) : null;
  } catch {
    return null;
  }
}
function guardarAlmacen(almacen: AlmacenPagos) {
  window.sessionStorage.setItem(CLAVE_PAGOS, JSON.stringify(almacen));
}

function validar(t: Tarjeta, ahora: Date): Errores {
  const errores: Errores = {};

  const digitos = soloDigitos(t.cardNumber, 16);
  if (!digitos) {
    errores.cardNumber = "Ingresa el número de tarjeta";
  } else if (digitos.length !== 16) {
    errores.cardNumber = "El número de tarjeta debe tener 16 dígitos";
  }

  const titular = t.holder.trim();
  if (!titular) {
    errores.holder = "Ingresa el nombre del titular";
  } else if (titular.length < 2 || titular.length > 60) {
    errores.holder = "El titular debe tener entre 2 y 60 caracteres";
  }

  if (!t.expiry) {
    errores.expiry = "Ingresa el vencimiento (MM/AA)";
  } else {
    const coincidencia = /^(\d{2})\/(\d{2})$/.exec(t.expiry);
    if (!coincidencia) {
      errores.expiry = "Usa el formato MM/AA";
    } else {
      const mes = Number(coincidencia[1]);
      const anio = 2000 + Number(coincidencia[2]);
      if (mes < 1 || mes > 12) {
        errores.expiry = "El mes debe estar entre 01 y 12";
      } else if (
        anio < ahora.getFullYear() ||
        (anio === ahora.getFullYear() && mes < ahora.getMonth() + 1)
      ) {
        errores.expiry = "La tarjeta está vencida";
      }
    }
  }

  if (!t.cvv) {
    errores.cvv = "Ingresa el código de seguridad";
  } else if (t.cvv.length !== 3) {
    errores.cvv = "El código de seguridad debe tener 3 dígitos";
  }

  return errores;
}
function motivoRechazo(terminacion: string): string {
  return terminacion === "0002" ? "Fondos insuficientes" : "Tarjeta no autorizada";
}

export default function PagarPage() {
  const parametros = useParams<{ paymentId: string }>();
  const router = useRouter();
  const paymentId = String(parametros?.paymentId ?? "");

  const [almacen, setAlmacen] = useState<AlmacenPagos | null>(null);
  const [cargado, setCargado] = useState(false);
  const [tarjeta, setTarjeta] = useState<Tarjeta>(TARJETA_VACIA);
  const [errores, setErrores] = useState<Errores>({});
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [notaPdf, setNotaPdf] = useState(false);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      let datos = leerAlmacen();
      if (!datos) {
        datos = crearAlmacenInicial(new Date());
        try {
          guardarAlmacen(datos);
        } catch {
        }
      }
      setAlmacen(datos);
      setCargado(true);
    }, 400);

    return () => clearTimeout(temporizador);
  }, []);

  const pago = almacen?.pagos.find((p) => p.id === paymentId) ?? null;
  const aprobado = resultado?.tipo === "aprobado";
  const opciones = (almacen?.pagos ?? []).filter(
    (p) => p.status === "PENDIENTE" || p.id === paymentId
  );
  const pagable = !!pago && pago.status === "PENDIENTE" && !aprobado;

  function cambiarCampo(campo: keyof Tarjeta, valor: string) {
    const limpio =
      campo === "cardNumber"
        ? agruparTarjeta(soloDigitos(valor, 16))
        : campo === "expiry"
          ? formatearVencimiento(valor)
          : campo === "cvv"
            ? soloDigitos(valor, 3)
            : valor;

    setTarjeta((actual) => ({ ...actual, [campo]: limpio }));
    setErrores((actual) => {
      const siguiente = { ...actual };
      delete siguiente[campo];
      return siguiente;
    });
  }

  function elegirPago(id: string) {
    if (procesando || id === paymentId) return;
    setTarjeta(TARJETA_VACIA);
    setErrores({});
    setResultado(null);
    setNotaPdf(false);
    router.push(`/pagos/${id}/pagar`);
  }
  async function pagar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (procesando || !pago || !pagable) return;

    setResultado(null);
    setNotaPdf(false);
    const encontrados = validar(tarjeta, new Date());
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setProcesando(true);
    let limpiarTodo = false;

    try {
      await new Promise((resolver) => setTimeout(resolver, MS_PASARELA));

      const actual = leerAlmacen();
      const vigente = actual?.pagos.find((p) => p.id === pago.id);
      if (!actual || !vigente) {
        setResultado({ tipo: "error", mensaje: MENSAJE_SERVIDOR });
        return;
      }
      if (vigente.status !== "PENDIENTE") {
        setResultado({
          tipo: "error",
          mensaje: "Este pago ya no está pendiente",
        });
        return;
      }

      const terminacion = soloDigitos(tarjeta.cardNumber, 16).slice(-4);
      if (!TERMINACIONES_APROBADAS.includes(terminacion)) {
        setResultado({ tipo: "rechazado", motivo: motivoRechazo(terminacion) });
        return;
      }

      const ahora = new Date();
      const numeroComprobante = `C-${String(actual.siguienteComprobante).padStart(6, "0")}`;
      const siguiente: AlmacenPagos = {
        pagos: actual.pagos.map((p) =>
          p.id === pago.id
            ? {
                ...p,
                status: "PAGADO",
                paidAt: ahora.toISOString(),
                receiptNumber: numeroComprobante,
                cardLast4: terminacion,
                gatewayRef: `SIM-${ahora.getTime()}`,
              }
            : p
        ),
        siguienteComprobante: actual.siguienteComprobante + 1,
      };

      guardarAlmacen(siguiente);
      setAlmacen(siguiente);
      setResultado({ tipo: "aprobado", receiptNumber: numeroComprobante });
      limpiarTodo = true;
    } catch {
      setResultado({ tipo: "error", mensaje: MENSAJE_SERVIDOR });
    } finally {

      setTarjeta((actual) =>
        limpiarTodo
          ? TARJETA_VACIA
          : { ...actual, cardNumber: "", cvv: "" }
      );
      setProcesando(false);
    }
  }

  const bloqueado = procesando || !pagable;

  const mensajeCampo = (clave: keyof Tarjeta) =>
    errores[clave] ? (
      <p className={styles.errorCampo} id={`error-${clave}`}>
        {errores[clave]}
      </p>
    ) : null;

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
            <h2>Pago con tarjeta</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          {!cargado ? (
            <section className={styles.tarjetaFormulario}>
              <p role="status" className={styles.estadoVacio}>
                Cargando pago...
              </p>
            </section>
          ) : !pago ? (
            <section className={styles.tarjetaFormulario}>
              <p role="status" className={styles.estadoVacio}>
                Pago no encontrado
              </p>
              <div className={styles.centrado}>
                <Link href="/pagos" className={styles.secundario}>
                  Volver a pagos
                </Link>
              </div>
            </section>
          ) : (
            <section className={styles.tarjetaFormulario}>
              <h3>Formulario</h3>

              {pago.status !== "PENDIENTE" && !aprobado && (
                <p role="alert" className={styles.advertencia}>
                  Este pago ya no está pendiente
                </p>
              )}

              <form className={styles.formulario} onSubmit={pagar} noValidate>
                <div className={styles.rejilla}>
                  <div className={styles.campo}>
                    <label htmlFor="cobro">Cobro pendiente</label>
                    <select
                      id="cobro"
                      value={pago.id}
                      disabled={procesando}
                      onChange={(e) => elegirPago(e.target.value)}
                    >
                      {opciones.map((p) => (
                        <option value={p.id} key={p.id}>
                          {nombreConcepto(p.concept)} · {mostrarMonto(p.amountUsd)} ·
                          vence {mostrarFechaIso(p.dueDate)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.campo}>
                    <span className={styles.etiquetaCampo}>Concepto y monto</span>
                    <div className={styles.lectura}>
                      <div>
                        <strong>{nombreConcepto(pago.concept)}</strong>
                        <small>Vence el {mostrarFechaIso(pago.dueDate)}</small>
                      </div>
                      <span className={styles.monto}>
                        {mostrarMonto(pago.amountUsd)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.campo}>
                    <label htmlFor="cardNumber">Número de tarjeta de prueba</label>
                    <input
                      id="cardNumber"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0000 0000 0000 0000"
                      value={tarjeta.cardNumber}
                      disabled={bloqueado}
                      aria-invalid={!!errores.cardNumber}
                      aria-describedby={
                        errores.cardNumber ? "error-cardNumber" : "ayuda-tarjeta"
                      }
                      onChange={(e) => cambiarCampo("cardNumber", e.target.value)}
                    />
                    {mensajeCampo("cardNumber")}
                    {!errores.cardNumber && (
                      <p className={styles.ayuda} id="ayuda-tarjeta">
                        Prueba: terminada en 4242 aprueba, 0002 rechaza.
                      </p>
                    )}
                  </div>

                  <div className={styles.campo}>
                    <label htmlFor="holder">Titular y vencimiento</label>
                    <div className={styles.par}>
                      <input
                        id="holder"
                        autoComplete="off"
                        placeholder="Nombre del titular"
                        maxLength={60}
                        value={tarjeta.holder}
                        disabled={bloqueado}
                        aria-invalid={!!errores.holder}
                        aria-describedby={errores.holder ? "error-holder" : undefined}
                        onChange={(e) => cambiarCampo("holder", e.target.value)}
                      />
                      <input
                        id="expiry"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="MM/AA"
                        aria-label="Vencimiento"
                        value={tarjeta.expiry}
                        disabled={bloqueado}
                        aria-invalid={!!errores.expiry}
                        aria-describedby={errores.expiry ? "error-expiry" : undefined}
                        onChange={(e) => cambiarCampo("expiry", e.target.value)}
                      />
                    </div>
                    {mensajeCampo("holder")}
                    {mensajeCampo("expiry")}
                  </div>

                  <div className={styles.campo}>
                    <label htmlFor="cvv">Código de seguridad</label>
                    <input
                      id="cvv"
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="•••"
                      value={tarjeta.cvv}
                      disabled={bloqueado}
                      aria-invalid={!!errores.cvv}
                      aria-describedby={errores.cvv ? "error-cvv" : undefined}
                      onChange={(e) => cambiarCampo("cvv", e.target.value)}
                    />
                    {mensajeCampo("cvv")}
                  </div>

                  <div className={styles.campo}>
                    <span className={styles.etiquetaCampo}>
                      Resultado de la pasarela
                    </span>
                    <div
                      role="status"
                      aria-live="polite"
                      className={`${styles.resultado} ${
                        aprobado
                          ? styles.resultadoOk
                          : resultado
                            ? styles.resultadoError
                            : ""
                      }`}
                    >
                      {procesando ? (
                        <span>Esperando respuesta de la pasarela…</span>
                      ) : resultado?.tipo === "aprobado" ? (
                        <>
                          <strong>Pago realizado</strong>
                          <span>Comprobante: {resultado.receiptNumber}</span>
                          <button
                            type="button"
                            className={styles.descargar}
                            onClick={() => setNotaPdf(true)}
                          >
                            Descargar PDF
                          </button>
                          {notaPdf && (
                            <small>
                              La descarga se conecta con H17 (prototipo).
                            </small>
                          )}
                        </>
                      ) : resultado?.tipo === "rechazado" ? (
                        <strong>Pago rechazado: {resultado.motivo}</strong>
                      ) : resultado?.tipo === "error" ? (
                        <strong>{resultado.mensaje}</strong>
                      ) : (
                        <span className={styles.suave}>Sin intentos de pago</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.accionesFormulario}>
                  {aprobado && (
                    <Link href="/pagos" className={styles.secundario}>
                      Volver a pagos
                    </Link>
                  )}
                  <button
                    type="submit"
                    className={styles.guardar}
                    disabled={bloqueado}
                  >
                    {procesando ? "Procesando…" : "Pagar"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

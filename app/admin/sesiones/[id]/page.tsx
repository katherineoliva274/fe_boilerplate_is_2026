"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

type EstadoSesion = "PROGRAMADA" | "EN_CURSO" | "COMPLETADA" | "CANCELADA";

interface SesionAdmin {
  id: string;
  templateId: string;
  name: string;
  trainerId: string;
  trainerName: string;
  roomId: string;
  roomName: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  capacity: number;
  confirmedReservations: number;
  status: EstadoSesion;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledReservations?: number;
}

// Mismo almacén temporal que usa /admin/clases mientras no exista el backend.
interface AlmacenAdmin {
  plantillas: unknown[];
  sesiones: SesionAdmin[];
}

const CLAVE_ADMIN = "gkds_admin_clases_prototipo";
const MAX_MOTIVO = 250;

const MENSAJE_NO_CANCELABLE = "No se puede cancelar esta sesión";
const MENSAJE_SERVIDOR = "No se pudieron guardar los cambios";

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

function mostrarHora(fecha: Date): string {
  return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

function mostrarFecha(fecha: Date): string {
  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

function leerAlmacen(): AlmacenAdmin | null {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_ADMIN);
    return crudo ? (JSON.parse(crudo) as AlmacenAdmin) : null;
  } catch {
    return null;
  }
}

// Puede lanzar error; quien la llama lo trata como fallo del servidor.
function guardarAlmacen(almacen: AlmacenAdmin) {
  window.sessionStorage.setItem(CLAVE_ADMIN, JSON.stringify(almacen));
}

function estadoEfectivo(sesion: SesionAdmin, ahora: Date): EstadoSesion {
  if (sesion.status !== "PROGRAMADA") return sesion.status;
  if (ahora >= new Date(sesion.endsAt)) return "COMPLETADA";
  if (ahora >= new Date(sesion.startsAt)) return "EN_CURSO";
  return "PROGRAMADA";
}

function etiquetaEstado(estado: EstadoSesion): string {
  return estado === "EN_CURSO" ? "EN CURSO" : estado;
}

function textoReservas(n: number): string {
  return n === 1 ? "1 reserva confirmada" : `${n} reservas confirmadas`;
}

export default function GestionSesionPage() {
  const parametros = useParams<{ id: string }>();
  const id = String(parametros?.id ?? "");

  const [almacen, setAlmacen] = useState<AlmacenAdmin | null>(null);
  const [cargado, setCargado] = useState(false);
  const [ahora, setAhora] = useState<Date | null>(null);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");
  const dialogoRef = useRef<HTMLDialogElement>(null);

  // Simula GET de la sesión.
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setAlmacen(leerAlmacen());
      setAhora(new Date());
      setCargado(true);
    }, 400);

    return () => clearTimeout(temporizador);
  }, []);

  const sesion = almacen?.sesiones.find((s) => s.id === id) ?? null;
  const estado = sesion && ahora ? estadoEfectivo(sesion, ahora) : null;
  const cancelable = estado === "PROGRAMADA";

  function abrirDialogo() {
    setError("");
    setExito("");
    dialogoRef.current?.showModal();
  }

  function cerrarDialogo() {
    if (procesando) return;
    dialogoRef.current?.close();
  }

  // Simula PATCH /api/class-sessions/:id/cancel con { reason }.
  async function confirmarCancelacion() {
    if (!sesion || !almacen || procesando) return;

    setProcesando(true);
    setError("");

    try {
      await new Promise((resolver) => setTimeout(resolver, 700));

      // El servidor vuelve a validar el estado actual de la sesión.
      const actual = leerAlmacen()?.sesiones.find((s) => s.id === sesion.id);
      if (!actual || estadoEfectivo(actual, new Date()) !== "PROGRAMADA") {
        dialogoRef.current?.close();
        setError(MENSAJE_NO_CANCELABLE);
        return;
      }

      const canceladas = actual.confirmedReservations;
      const siguiente: AlmacenAdmin = {
        ...almacen,
        sesiones: almacen.sesiones.map((s) =>
          s.id === sesion.id
            ? {
                ...s,
                status: "CANCELADA",
                cancelReason: motivo.trim() || undefined,
                cancelledAt: new Date().toISOString(),
                cancelledReservations: canceladas,
                confirmedReservations: 0,
              }
            : s
        ),
      };

      guardarAlmacen(siguiente);
      setAlmacen(siguiente);
      setMotivo("");
      dialogoRef.current?.close();
      setExito("Sesión cancelada");
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
            <h2>Gestión de sesión</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          {!cargado ? (
            <section className={styles.tarjeta}>
              <p role="status" className={styles.estadoVacio}>
                Cargando sesión...
              </p>
            </section>
          ) : !sesion || !ahora || !estado ? (
            <section className={styles.tarjeta}>
              <p role="status" className={styles.estadoVacio}>
                Sesión no encontrada
              </p>
              <div className={styles.centrado}>
                <Link href="/admin/clases" className={styles.secundario}>
                  Volver a clases
                </Link>
              </div>
            </section>
          ) : (
            <>
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
                <div className={styles.tarjetaEncabezado}>
                  <h3>Detalle de la sesión</h3>
                  <Link href="/admin/clases" className={styles.enlace}>
                    Volver a clases
                  </Link>
                </div>

                <dl className={styles.detalle}>
                  <div>
                    <dt>Clase</dt>
                    <dd>{sesion.name}</dd>
                  </div>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{mostrarFecha(new Date(sesion.startsAt))}</dd>
                  </div>
                  <div>
                    <dt>Horario</dt>
                    <dd>
                      {mostrarHora(new Date(sesion.startsAt))} –{" "}
                      {mostrarHora(new Date(sesion.endsAt))}
                    </dd>
                  </div>
                  <div>
                    <dt>Sala</dt>
                    <dd>{sesion.roomName}</dd>
                  </div>
                  <div>
                    <dt>Entrenador</dt>
                    <dd>{sesion.trainerName}</dd>
                  </div>
                  <div>
                    <dt>Cupo máximo</dt>
                    <dd>{sesion.capacity}</dd>
                  </div>
                  <div>
                    <dt>Reservas confirmadas</dt>
                    <dd>{sesion.confirmedReservations}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>
                      <span
                        className={`${styles.insignia} ${styles[`estado${estado}`]}`}
                      >
                        {etiquetaEstado(estado)}
                      </span>
                    </dd>
                  </div>
                </dl>
              </section>

              <section className={styles.tarjeta}>
                <h3>Cancelar sesión</h3>

                {estado === "CANCELADA" ? (
                  <div className={styles.resumenCancelacion}>
                    <p>
                      Esta sesión fue cancelada
                      {sesion.cancelledAt
                        ? ` el ${mostrarFecha(new Date(sesion.cancelledAt))} a las ${mostrarHora(new Date(sesion.cancelledAt))}`
                        : ""}
                      .
                    </p>
                    <p>
                      Reservas canceladas por el gimnasio:{" "}
                      <strong>{sesion.cancelledReservations ?? 0}</strong>
                    </p>
                    <p>
                      Motivo:{" "}
                      <strong>{sesion.cancelReason ?? "Sin motivo indicado"}</strong>
                    </p>
                  </div>
                ) : (
                  <form
                    className={styles.formulario}
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (cancelable) abrirDialogo();
                    }}
                  >
                    <div className={styles.campo}>
                      <label htmlFor="motivo">Motivo (opcional)</label>
                      <textarea
                        id="motivo"
                        rows={4}
                        maxLength={MAX_MOTIVO}
                        value={motivo}
                        disabled={!cancelable}
                        placeholder="Escribe el motivo de la cancelación..."
                        onChange={(e) => setMotivo(e.target.value)}
                      />
                      <span className={styles.contador}>
                        {motivo.length}/{MAX_MOTIVO}
                      </span>
                    </div>

                    {!cancelable && (
                      <p role="alert" className={styles.advertencia}>
                        {MENSAJE_NO_CANCELABLE}
                      </p>
                    )}

                    <div className={styles.acciones}>
                      <button
                        type="submit"
                        className={styles.peligro}
                        disabled={!cancelable}
                      >
                        Cancelar sesión
                      </button>
                    </div>
                  </form>
                )}
              </section>
            </>
          )}
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
        <h3 id="titulo-dialogo">¿Cancelar esta sesión?</h3>
        <p>
          Se cancelarán{" "}
          <strong>
            {textoReservas(sesion?.confirmedReservations ?? 0)}
          </strong>
          . Cada miembro afectado recibirá un aviso.
        </p>
        {motivo.trim() && (
          <p className={styles.motivoDialogo}>Motivo: {motivo.trim()}</p>
        )}

        {procesando && (
          <p role="status" className={styles.procesando}>
            Cancelando sesión...
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
            className={styles.peligro}
            onClick={confirmarCancelacion}
            disabled={procesando}
          >
            Sí, cancelar sesión
          </button>
        </div>
      </dialog>
    </div>
  );
}

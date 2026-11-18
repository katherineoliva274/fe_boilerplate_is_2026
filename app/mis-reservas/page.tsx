"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type EstadoReserva = "CONFIRMADA" | "CANCELADA" | "CANCELADA_POR_GIMNASIO";

interface Reserva {
  id: string;
  clase: string;
  entrenador: string;
  sala: string;
  inicio: Date;
  fin: Date;
  estado: EstadoReserva;
}

// Forma de las reservas que crea /clases mientras no exista el backend.
interface ReservaGuardada {
  id: string;
  sessionId: string;
  className: string;
  trainerName: string;
  roomName: string;
  startsAt: string;
  endsAt: string;
  status: EstadoReserva;
  createdAt: string;
}

interface PlantillaMock {
  dia: number; // días respecto a hoy (negativo = pasado)
  hora: string; // HH:mm
  clase: string;
  entrenador: string;
  sala: string;
  duracion: number;
  estado: EstadoReserva;
}

const CLAVE_RESERVAS = "gkds_reservas_prototipo";
const TAMANO_PAGINA = 10;
const HORAS_MINIMAS_CANCELACION = 12;
const CLAVE_CANCELACIONES_EJEMPLO = "gkds_cancelaciones_ejemplo_h6";

const ESTADOS: { valor: EstadoReserva; etiqueta: string }[] = [
  { valor: "CONFIRMADA", etiqueta: "CONFIRMADA" },
  { valor: "CANCELADA", etiqueta: "CANCELADA" },
  { valor: "CANCELADA_POR_GIMNASIO", etiqueta: "CANCELADA POR GIMNASIO" },
];

// Datos temporales para probar la pantalla (en el backend vendrán de
// GET /api/class-reservations/me).
const plantillas: PlantillaMock[] = [
  { dia: 4, hora: "09:00", clase: "Funcional", entrenador: "Laura Hernández", sala: "Sala funcional", duracion: 60, estado: "CONFIRMADA" },
  { dia: 2, hora: "07:00", clase: "Funcional", entrenador: "Laura Hernández", sala: "Sala funcional", duracion: 60, estado: "CANCELADA" },
  { dia: -1, hora: "18:30", clase: "Spinning", entrenador: "Diego Ramírez", sala: "Sala de spinning", duracion: 45, estado: "CONFIRMADA" },
  { dia: -2, hora: "19:00", clase: "Movilidad", entrenador: "Diego Ramírez", sala: "Sala funcional", duracion: 30, estado: "CANCELADA_POR_GIMNASIO" },
  { dia: -4, hora: "08:00", clase: "Spinning", entrenador: "Diego Ramírez", sala: "Sala de spinning", duracion: 45, estado: "CONFIRMADA" },
  { dia: -5, hora: "17:30", clase: "HIIT grupal", entrenador: "Laura Hernández", sala: "Sala de entrenamiento grupal", duracion: 60, estado: "CANCELADA" },
  { dia: -7, hora: "07:00", clase: "Funcional", entrenador: "Laura Hernández", sala: "Sala funcional", duracion: 60, estado: "CONFIRMADA" },
  { dia: -8, hora: "10:00", clase: "Movilidad", entrenador: "Diego Ramírez", sala: "Sala funcional", duracion: 30, estado: "CONFIRMADA" },
  { dia: -10, hora: "18:00", clase: "HIIT grupal", entrenador: "Laura Hernández", sala: "Sala de entrenamiento grupal", duracion: 60, estado: "CANCELADA_POR_GIMNASIO" },
  { dia: -12, hora: "08:00", clase: "Spinning", entrenador: "Diego Ramírez", sala: "Sala de spinning", duracion: 45, estado: "CONFIRMADA" },
  { dia: -14, hora: "07:00", clase: "Funcional", entrenador: "Laura Hernández", sala: "Sala funcional", duracion: 60, estado: "CONFIRMADA" },
  { dia: -15, hora: "19:00", clase: "Movilidad", entrenador: "Diego Ramírez", sala: "Sala funcional", duracion: 30, estado: "CANCELADA" },
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

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

function mostrarHora(fecha: Date): string {
  return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

function mostrarFecha(fecha: Date): string {
  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

function leerReservasGuardadas(): ReservaGuardada[] {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_RESERVAS);
    return crudo ? (JSON.parse(crudo) as ReservaGuardada[]) : [];
  } catch {
    return [];
  }
}

// Los datos de ejemplo se mantienen en esta sesión, incluso si recargamos la página.
function leerCancelacionesEjemplo(): string[] {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_CANCELACIONES_EJEMPLO);
    const datos: unknown = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(datos) ? datos.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

// Reservas de ejemplo + las que se crearon en /clases durante esta sesión.
function cargarReservas(hoy: Date): Reserva[] {
  const canceladas = new Set(leerCancelacionesEjemplo());
  const deEjemplo: Reserva[] = plantillas.map((p, i) => {
    const [hora, minuto] = p.hora.split(":").map(Number);
    const inicio = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() + p.dia,
      hora,
      minuto
    );
    return {
      id: `ejemplo-${i + 1}`,
      clase: p.clase,
      entrenador: p.entrenador,
      sala: p.sala,
      inicio,
      fin: new Date(inicio.getTime() + p.duracion * 60000),
      estado: canceladas.has(`ejemplo-${i + 1}`) ? "CANCELADA" : p.estado,
    };
  });

  const nuevas: Reserva[] = leerReservasGuardadas().map((r) => ({
    id: r.id,
    clase: r.className,
    entrenador: r.trainerName,
    sala: r.roomName,
    inicio: new Date(r.startsAt),
    fin: new Date(r.endsAt),
    estado: r.status,
  }));

  return [...deEjemplo, ...nuevas];
}

function puedeCancelar(reserva: Reserva, ahora: Date): boolean {
  const milisegundosRestantes = reserva.inicio.getTime() - ahora.getTime();
  return reserva.estado === "CONFIRMADA" &&
    milisegundosRestantes >= HORAS_MINIMAS_CANCELACION * 60 * 60 * 1000;
}

function etiquetaEstado(estado: EstadoReserva): string {
  return ESTADOS.find((e) => e.valor === estado)?.etiqueta ?? estado;
}

function claseEstado(estado: EstadoReserva): string {
  if (estado === "CONFIRMADA") return styles.confirmada;
  if (estado === "CANCELADA") return styles.cancelada;
  return styles.canceladaGimnasio;
}

export default function MisReservasPage() {
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [estado, setEstado] = useState<"" | EstadoReserva>("");
  const [pagina, setPagina] = useState(1);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [ahora, setAhora] = useState<Date | null>(null);

  // Simula la carga desde GET /api/class-reservations/me.
  useEffect(() => {
    const temporizador = setTimeout(() => {
      const fechaActual = new Date();
      setAhora(fechaActual);
      setReservas(cargarReservas(fechaActual));
    }, 400);

    // Actualizamos el reloj para evitar que una reserva vencida siga habilitada.
    const reloj = setInterval(() => setAhora(new Date()), 60_000);
    return () => {
      clearTimeout(temporizador);
      clearInterval(reloj);
    };
  }, []);

  // Fecha de inicio descendente (la más reciente primero).
  const filtradas = (reservas ?? [])
    .filter((r) => !estado || r.estado === estado)
    .sort((a, b) => b.inicio.getTime() - a.inicio.getTime());

  const total = filtradas.length;
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice(
    (paginaActual - 1) * TAMANO_PAGINA,
    paginaActual * TAMANO_PAGINA
  );

  function cambiarEstado(valor: string) {
    setEstado(valor as "" | EstadoReserva);
    setPagina(1);
  }

  function abrirCancelacion(reserva: Reserva) {
    setError("");
    setExito("");
    setAhora(new Date());
    setReservaSeleccionada(reserva);
  }

  function cerrarCancelacion() {
    if (procesando) return;
    setReservaSeleccionada(null);
    setError("");
  }

  async function confirmarCancelacion() {
    if (!reservaSeleccionada || procesando) return;
    const seleccion = reservaSeleccionada;
    setError("");
    setExito("");
    setProcesando(true);

    try {
      // Prototipo: H6 utilizará DELETE /api/class-reservations/:id al integrar el backend.
      await new Promise<void>((resolver) => setTimeout(resolver, 450));
      const fechaActual = new Date();
      setAhora(fechaActual);
      if (seleccion.estado !== "CONFIRMADA") {
        setError("La reserva ya está cancelada");
        return;
      }
      if (!puedeCancelar(seleccion, fechaActual)) {
        setError("La reserva solo puede cancelarse hasta 12 horas antes");
        return;
      }

      if (seleccion.id.startsWith("ejemplo-")) {
        const ids = new Set(leerCancelacionesEjemplo());
        ids.add(seleccion.id);
        window.sessionStorage.setItem(CLAVE_CANCELACIONES_EJEMPLO, JSON.stringify([...ids]));
      } else {
        const guardadas = leerReservasGuardadas();
        const indice = guardadas.findIndex((r) => r.id === seleccion.id);
        if (indice === -1) {
          setError("No fue posible cancelar la reserva");
          return;
        }
        if (guardadas[indice].status !== "CONFIRMADA") {
          setError("La reserva ya está cancelada");
          return;
        }
        const actualizadas = guardadas.map((r) =>
          r.id === seleccion.id ? { ...r, status: "CANCELADA" as EstadoReserva } : r
        );
        window.sessionStorage.setItem(CLAVE_RESERVAS, JSON.stringify(actualizadas));
      }

      setReservas((anteriores) =>
        anteriores?.map((r) =>
          r.id === seleccion.id ? { ...r, estado: "CANCELADA" } : r
        ) ?? null
      );
      setReservaSeleccionada(null);
      setExito("Reserva cancelada. El cupo ha sido liberado.");
    } catch {
      setError("No fue posible cancelar la reserva");
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
            <h2>Mis reservas</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          {exito && (
            <p role="status" className={styles.avisoExito}>{exito}</p>
          )}
          {error && !reservaSeleccionada && (
            <p role="alert" className={styles.avisoError}>{error}</p>
          )}

          <section className={styles.tarjeta}>
            <div className={styles.tarjetaEncabezado}>
              <h3>Historial de reservas</h3>
              <Link href="/clases" className={styles.enlace}>
                Volver a clases
              </Link>
            </div>

            <div className={styles.filtros}>
              <div className={styles.campo}>
                <label htmlFor="estado">Estado</label>
                <select
                  id="estado"
                  value={estado}
                  onChange={(e) => cambiarEstado(e.target.value)}
                >
                  <option value="">Todos</option>
                  {ESTADOS.map((e) => (
                    <option value={e.valor} key={e.valor}>
                      {e.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {reservas === null ? (
              <p role="status" className={styles.estadoVacio}>
                Cargando reservas...
              </p>
            ) : total === 0 ? (
              <p role="status" className={styles.estadoVacio}>
                Aún no tienes reservas
              </p>
            ) : (
              <>
                <div className={styles.tablaContenedor}>
                  <table className={styles.tabla}>
                    <thead>
                      <tr>
                        <th>Clase</th>
                        <th>Fecha</th>
                        <th>Horario</th>
                        <th>Entrenador</th>
                        <th>Sala</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibles.map((reserva) => (
                        <tr key={reserva.id}>
                          <td className={styles.clase}>{reserva.clase}</td>
                          <td>{mostrarFecha(reserva.inicio)}</td>
                          <td>
                            {mostrarHora(reserva.inicio)} –{" "}
                            {mostrarHora(reserva.fin)}
                          </td>
                          <td>{reserva.entrenador}</td>
                          <td>{reserva.sala}</td>
                          <td>
                            <span
                              className={`${styles.insignia} ${claseEstado(reserva.estado)}`}
                            >
                              {etiquetaEstado(reserva.estado)}
                            </span>
                          </td>
                          <td className={styles.accion}>
                            {ahora && puedeCancelar(reserva, ahora) ? (
                              <button
                                type="button"
                                className={styles.botonCancelar}
                                onClick={() => abrirCancelacion(reserva)}
                              >
                                Cancelar
                              </button>
                            ) : (
                              <span className={styles.sinAccion}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.paginacion}>
                  <span>
                    {total} {total === 1 ? "reserva" : "reservas"} · Página{" "}
                    {paginaActual} de {totalPaginas}
                  </span>
                  <div className={styles.paginacionBotones}>
                    <button
                      type="button"
                      className={styles.pagina}
                      onClick={() => setPagina(paginaActual - 1)}
                      disabled={paginaActual <= 1}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className={styles.pagina}
                      onClick={() => setPagina(paginaActual + 1)}
                      disabled={paginaActual >= totalPaginas}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          {reservaSeleccionada && (
            <div className={styles.modalFondo}>
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="tituloCancelarReserva"
                aria-describedby="descripcionCancelarReserva"
                className={styles.modal}
              >
                <h3 id="tituloCancelarReserva">Cancelar reserva</h3>
                <p id="descripcionCancelarReserva">
                  ¿Deseas cancelar tu reserva de <strong>{reservaSeleccionada.clase}</strong>
                  {" "}del {mostrarFecha(reservaSeleccionada.inicio)} a las {mostrarHora(reservaSeleccionada.inicio)}?
                </p>
                <p className={styles.avisoModal}>Solo puedes cancelarla hasta 12 horas antes de la sesión.</p>
                {error && <p role="alert" className={styles.avisoError}>{error}</p>}
                <div className={styles.modalBotones}>
                  <button
                    type="button"
                    className={styles.botonVolver}
                    onClick={cerrarCancelacion}
                    disabled={procesando}
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    className={styles.botonConfirmar}
                    onClick={confirmarCancelacion}
                    disabled={procesando}
                    autoFocus
                  >
                    {procesando ? "Cancelando..." : "Sí, cancelar"}
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

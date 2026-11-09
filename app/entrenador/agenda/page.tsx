
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type EstadoSesion = "CONFIRMADA" | "CANCELADA" | "COMPLETADA";
type Asistencia = "ASISTIO" | "NO_ASISTIO" | null;
type Vista = "dia" | "semana";

interface Sesion {
  id: number;
  memberNumber: string;
  memberName: string;
  startsAt: string;
  endsAt: string;
  status: EstadoSesion;
  attendance: Asistencia;
}

const ZONA = "America/El_Salvador";
const OFFSET = "-06:00";

const menu = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Membresías", ruta: "/mi-membresia" },
  { nombre: "Clases y reservas", ruta: "/clases" },
  { nombre: "Entrenadores", ruta: "/entrenadores" },
  { nombre: "Agenda del entrenador", ruta: "/entrenador/agenda" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Máquinas", ruta: "/maquinas" },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
  { nombre: "Reportes", ruta: "/reportes" },
];

function fechaLocal(fecha: Date): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);

  const parte = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? "";

  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const resultado = new Date(
    Date.UTC(anio, mes - 1, dia + dias)
  );
  return resultado.toISOString().slice(0, 10);
}

function inicioSemana(fecha: string): string {
  const diaSemana = new Date(
    `${fecha}T12:00:00Z`
  ).getUTCDay();

  const diferencia = (diaSemana + 6) % 7;

  return sumarDias(fecha, -diferencia);
}

function fechaSesion(fecha: string, hora: string) {
  return `${fecha}T${hora}:00${OFFSET}`;
}

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-SV", {
    timeZone: ZONA,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00${OFFSET}`));
}

function formatearHora(fecha: string) {
  return new Intl.DateTimeFormat("es-SV", {
    timeZone: ZONA,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(fecha));
}

function formatearDia(fecha: string) {
  return new Intl.DateTimeFormat("es-SV", {
    timeZone: ZONA,
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${fecha}T12:00:00${OFFSET}`));
}

function crearSesionesEjemplo(): Sesion[] {
  const hoy = fechaLocal(new Date());
  const ayer = sumarDias(hoy, -1);
  const manana = sumarDias(hoy, 1);
  const pasado = sumarDias(hoy, 2);

  const crear = (
    id: number,
    fecha: string,
    inicio: string,
    fin: string,
    memberNumber: string,
    memberName: string,
    status: EstadoSesion,
    attendance: Asistencia = null
  ): Sesion => ({
    id,
    memberNumber,
    memberName,
    startsAt: fechaSesion(fecha, inicio),
    endsAt: fechaSesion(fecha, fin),
    status,
    attendance,
  });

  return [
    crear(
      1, ayer, "08:00", "09:00",
      "M-000001", "María López", "CONFIRMADA"
    ),
    crear(
      2, ayer, "10:00", "11:00",
      "M-000002", "Carlos Martínez", "CANCELADA"
    ),
    crear(
      3, hoy, "07:00", "08:00",
      "M-000003", "Ana Rodríguez", "CONFIRMADA"
    ),
    crear(
      4, hoy, "09:00", "10:00",
      "M-000004", "José Hernández", "CONFIRMADA"
    ),
    crear(
      5, hoy, "15:00", "16:00",
      "M-000005", "Sofía Ramírez", "CONFIRMADA"
    ),
    crear(
      6, manana, "08:00", "09:00",
      "M-000001", "María López", "CONFIRMADA"
    ),
    crear(
      7, manana, "11:00", "12:00",
      "M-000006", "Daniel Pérez", "CANCELADA"
    ),
    crear(
      8, pasado, "14:00", "15:00",
      "M-000007", "Laura Gómez",
      "COMPLETADA", "ASISTIO"
    ),
  ];
}

export default function AgendaEntrenadorPage() {
  const [hoy] = useState(() => fechaLocal(new Date()));
  const [fecha, setFecha] = useState(hoy);
  const [vista, setVista] = useState<Vista>("dia");
  const [sesiones, setSesiones] = useState<Sesion[]>(
    crearSesionesEjemplo
  );

  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState<number | null>(null);
 const [horaActual, setHoraActual] = useState<number | null>(null);

useEffect(() => {
  const actualizarHora = () => {
    setHoraActual(Date.now());
  };

  const intervalo = setInterval(actualizarHora, 1000);

  return () => clearInterval(intervalo);
}, []);

  const semanaInicio = inicioSemana(fecha);
  const semanaFin = sumarDias(semanaInicio, 6);

  const sesionesVisibles = useMemo(() => {
    return sesiones
      .filter((sesion) => {
        const fechaDeSesion = fechaLocal(
          new Date(sesion.startsAt)
        );

        if (vista === "dia") {
          return fechaDeSesion === fecha;
        }

        return (
          fechaDeSesion >= semanaInicio &&
          fechaDeSesion <= semanaFin
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() -
          new Date(b.startsAt).getTime()
      );
  }, [sesiones, vista, fecha, semanaInicio, semanaFin]);

  const confirmadas = sesionesVisibles.filter(
    (sesion) => sesion.status === "CONFIRMADA"
  ).length;

  const canceladas = sesionesVisibles.filter(
    (sesion) => sesion.status === "CANCELADA"
  ).length;

  const completadas = sesionesVisibles.filter(
    (sesion) => sesion.status === "COMPLETADA"
  ).length;

  function registrarAsistencia(
    id: number,
    asistencia: Exclude<Asistencia, null>
  ) {
    const sesion = sesiones.find((s) => s.id === id);

    if (
  !sesion ||
  sesion.status !== "CONFIRMADA" ||
  new Date(sesion.startsAt).getTime() > (horaActual ?? 0)
) {
  return;
}

    setGuardando(id);

    // Simulación local, sin petición al backend.
    setSesiones((anteriores) =>
      anteriores.map((actual) =>
        actual.id === id
          ? {
              ...actual,
              status: "COMPLETADA",
              attendance: asistencia,
            }
          : actual
      )
    );

    setMensaje("Asistencia registrada");
    setGuardando(null);
  }

  function cambiarFecha(dias: number) {
    setFecha((actual) => {
      const avance = vista === "semana" ? dias * 7 : dias;
      return sumarDias(actual, avance);
    });
    setMensaje("");
  }

  return (
    <div className={styles.contenedor}>
      <header className={styles.encabezado}>
        <h1>GKDS/GYM</h1>
      </header>

      <div className={styles.estructura}>
        <aside className={styles.sidebar}>
          <p className={styles.menuTitulo}>MENÚ PRINCIPAL</p>

          <nav className={styles.navegacion}>
            {menu.map((opcion) => (
              <Link
                key={opcion.nombre}
                href={opcion.ruta}
                className={
                  opcion.nombre === "Agenda del entrenador"
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
            <div>
              <h2>Agenda del entrenador</h2>
              <p className={styles.subtitulo}>
                Consulta y administra tus sesiones personales.
              </p>
            </div>

            <span className={styles.etiqueta}>
              Prototipo
            </span>
          </div>

          <section className={styles.resumen}>
            <div className={styles.resumenItem}>
              <span>Sesiones confirmadas</span>
              <strong>{confirmadas}</strong>
            </div>

            <div className={styles.resumenItem}>
              <span>Sesiones completadas</span>
              <strong className={styles.verde}>
                {completadas}
              </strong>
            </div>

            <div className={styles.resumenItem}>
              <span>Sesiones canceladas</span>
              <strong className={styles.rojo}>
                {canceladas}
              </strong>
            </div>
          </section>

          <section className={styles.tarjeta}>
            <h3>Consultar agenda</h3>

            <div className={styles.controles}>
              <div className={styles.campo}>
                <label htmlFor="vista">Tipo de vista</label>
                <select
                  id="vista"
                  value={vista}
                  onChange={(e) => {
                    setVista(e.target.value as Vista);
                    setMensaje("");
                  }}
                >
                  <option value="dia">Vista diaria</option>
                  <option value="semana">Vista semanal</option>
                </select>
              </div>

              <div className={styles.campo}>
                <label htmlFor="fecha">Seleccionar fecha</label>
                <input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    setMensaje("");
                  }}
                />
              </div>

              <div className={styles.accionesFecha}>
                <button
                  type="button"
                  className={styles.botonSecundario}
                  onClick={() => cambiarFecha(-1)}
                >
                  Anterior
                </button>

                <button
                  type="button"
                  className={styles.botonSecundario}
                  onClick={() => {
                    setFecha(hoy);
                    setMensaje("");
                  }}
                >
                  Hoy
                </button>

                <button
                  type="button"
                  className={styles.botonSecundario}
                  onClick={() => cambiarFecha(1)}
                >
                  Siguiente
                </button>
              </div>
            </div>

            <div className={styles.periodo}>
              {vista === "dia"
                ? `Agenda del ${formatearFecha(fecha)}`
                : `Semana del ${formatearFecha(
                    semanaInicio
                  )} al ${formatearFecha(semanaFin)}`}
            </div>
          </section>

          <section className={styles.tarjeta}>
            <div className={styles.cabeceraTabla}>
              <h3>Sesiones programadas</h3>
              <span>
                {sesionesVisibles.length} sesión(es)
              </span>
            </div>

            {mensaje && (
              <div
                className={styles.exito}
                role="status"
              >
                {mensaje}
              </div>
            )}

            {sesionesVisibles.length === 0 ? (
              <div className={styles.estadoVacio}>
                No tienes sesiones en este periodo
              </div>
            ) : (
              <div className={styles.tablaContenedor}>
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Horario</th>
                      <th>Miembro</th>
                      <th>Número</th>
                      <th>Estado</th>
                      <th>Asistencia / Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sesionesVisibles.map((sesion) => {
                      const inicioPasado =
                      horaActual !== null &&
                      new Date(sesion.startsAt).getTime() <= horaActual;

                      const permiteAsistencia =
                        sesion.status === "CONFIRMADA" &&
                        inicioPasado;

                      return (
                        <tr key={sesion.id}>
                          <td>
                            {formatearDia(
                              fechaLocal(
                                new Date(sesion.startsAt)
                              )
                            )}
                          </td>

                          <td>
                            {formatearHora(sesion.startsAt)}
                            {" - "}
                            {formatearHora(sesion.endsAt)}
                          </td>

                          <td>{sesion.memberName}</td>
                          <td>{sesion.memberNumber}</td>

                          <td>
                            <span
                              className={
                                sesion.status === "CONFIRMADA"
                                  ? styles.confirmada
                                  : sesion.status === "CANCELADA"
                                  ? styles.cancelada
                                  : styles.completada
                              }
                            >
                              {sesion.status}
                            </span>
                          </td>

                          <td>
                            {permiteAsistencia ? (
                              <div className={styles.accionesFila}>
                                <button
                                  type="button"
                                  className={styles.botonAsistio}
                                  disabled={guardando !== null}
                                  onClick={() =>
                                    registrarAsistencia(
                                      sesion.id,
                                      "ASISTIO"
                                    )
                                  }
                                >
                                  Asistió
                                </button>

                                <button
                                  type="button"
                                  className={styles.botonNoAsistio}
                                  disabled={guardando !== null}
                                  onClick={() =>
                                    registrarAsistencia(
                                      sesion.id,
                                      "NO_ASISTIO"
                                    )
                                  }
                                >
                                  No asistió
                                </button>
                              </div>
                            ) : sesion.status === "COMPLETADA" ? (
                              <span className={styles.asistenciaTexto}>
                                {sesion.attendance === "ASISTIO"
                                  ? "Asistió"
                                  : sesion.attendance === "NO_ASISTIO"
                                  ? "No asistió"
                                  : "Registrada"}
                              </span>
                            ) : sesion.status === "CANCELADA" ? (
                              <span className={styles.textoSecundario}>
                                Sesión cancelada
                              </span>
                            ) : (
                              <span className={styles.textoSecundario}>
                                Pendiente de inicio
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className={styles.nota}>
            PROTOTIPO VISUAL · La agenda y los registros
            de asistencia son temporales. No están
            conectados al backend.
          </p>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type EstadoSesion = "PROGRAMADA" | "EN_CURSO" | "COMPLETADA" | "CANCELADA";

interface Sesion {
  id: string;
  clase: string;
  entrenador: string;
  sala: string;
  inicio: Date;
  duracion: number;
  capacidad: number;
  reservados: number;
  estado: EstadoSesion;
}

interface PlantillaMock {
  dia: number;
  hora: string;
  clase: string;
  entrenador: string;
  sala: string;
  duracion: number;
  capacidad: number;
  reservados: number;
}

const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const entrenadores = ["Laura Hernández", "Diego Ramírez"];
const salas = [
  "Sala funcional",
  "Sala de spinning",
  "Sala de entrenamiento grupal",
];


const plantillas: PlantillaMock[] = [
  { dia: 0, hora: "06:00", clase: "Funcional", entrenador: "Laura Hernández", sala: "Sala funcional", duracion: 60, capacidad: 15, reservados: 9 },
  { dia: 0, hora: "23:30", clase: "Spinning nocturno", entrenador: "Diego Ramírez", sala: "Sala de spinning", duracion: 45, capacidad: 12, reservados: 5 },
  { dia: 1, hora: "08:00", clase: "Spinning", entrenador: "Diego Ramírez", sala: "Sala de spinning", duracion: 45, capacidad: 12, reservados: 12 },
  { dia: 1, hora: "18:00", clase: "HIIT grupal", entrenador: "Laura Hernández", sala: "Sala de entrenamiento grupal", duracion: 60, capacidad: 20, reservados: 11 },
  { dia: 2, hora: "07:00", clase: "Funcional", entrenador: "Laura Hernández", sala: "Sala funcional", duracion: 60, capacidad: 15, reservados: 4 },
  { dia: 2, hora: "19:00", clase: "Movilidad", entrenador: "Diego Ramírez", sala: "Sala funcional", duracion: 30, capacidad: 10, reservados: 10 },
  { dia: 3, hora: "08:00", clase: "Spinning", entrenador: "Diego Ramírez", sala: "Sala de spinning", duracion: 45, capacidad: 12, reservados: 7 },
  { dia: 3, hora: "17:30", clase: "HIIT grupal", entrenador: "Laura Hernández", sala: "Sala de entrenamiento grupal", duracion: 60, capacidad: 20, reservados: 20 },
  { dia: 4, hora: "07:00", clase: "Funcional", entrenador: "Laura Hernández", sala: "Sala funcional", duracion: 60, capacidad: 15, reservados: 2 },
  { dia: 4, hora: "18:30", clase: "Spinning", entrenador: "Diego Ramírez", sala: "Sala de spinning", duracion: 45, capacidad: 12, reservados: 8 },
  { dia: 5, hora: "09:00", clase: "HIIT grupal", entrenador: "Laura Hernández", sala: "Sala de entrenamiento grupal", duracion: 75, capacidad: 20, reservados: 15 },
  { dia: 6, hora: "10:00", clase: "Movilidad", entrenador: "Diego Ramírez", sala: "Sala funcional", duracion: 30, capacidad: 10, reservados: 3 },
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

function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function obtenerDias(hoy: Date): Date[] {
  return Array.from(
    { length: 7 },
    (_, i) => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i)
  );
}

function crearSesiones(hoy: Date): Sesion[] {
  return plantillas.map((p, i) => {
    const [hora, minuto] = p.hora.split(":").map(Number);
    return {
      id: `sesion-${i + 1}`,
      clase: p.clase,
      entrenador: p.entrenador,
      sala: p.sala,
      inicio: new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate() + p.dia,
        hora,
        minuto
      ),
      duracion: p.duracion,
      capacidad: p.capacidad,
      reservados: p.reservados,
      estado: "PROGRAMADA",
    };
  });
}


function cuposLibres(sesion: Sesion): number {
  return Math.max(0, sesion.capacidad - sesion.reservados);
}

type Disponibilidad = "DISPONIBLE" | "LLENA" | "CERRADA";

function obtenerDisponibilidad(sesion: Sesion, ahora: Date): Disponibilidad {
  if (sesion.estado !== "PROGRAMADA" || sesion.inicio <= ahora) {
    return "CERRADA";
  }
  return cuposLibres(sesion) === 0 ? "LLENA" : "DISPONIBLE";
}

function etiquetaCerrada(sesion: Sesion): string {
  if (sesion.estado === "CANCELADA") return "Cancelada";
  if (sesion.estado === "COMPLETADA") return "Completada";
  return "Iniciada";
}

export default function ClasesSemanaPage() {
  const [sesiones, setSesiones] = useState<Sesion[] | null>(null);
  const [hoy, setHoy] = useState<Date | null>(null);
  const [nombre, setNombre] = useState("");
  const [entrenador, setEntrenador] = useState("");
  const [sala, setSala] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const temporizador = setTimeout(() => {
      const ahora = new Date();
      setHoy(ahora);
      setSesiones(crearSesiones(ahora));
    }, 400);

    return () => clearTimeout(temporizador);
  }, []);

  const dias = hoy ? obtenerDias(hoy) : [];

  const texto = nombre.trim().toLowerCase();
  const filtradas = (sesiones ?? [])
    .filter(
      (s) =>
        (!texto || s.clase.toLowerCase().includes(texto)) &&
        (!entrenador || s.entrenador === entrenador) &&
        (!sala || s.sala === sala)
    )
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

  function limpiarFiltros() {
    setNombre("");
    setEntrenador("");
    setSala("");
    setMensaje("");
  }

  function reservar(sesion: Sesion) {
    setMensaje(
      `Reserva de «${sesion.clase}» el ${mostrarFecha(sesion.inicio)} a las ${mostrarHora(sesion.inicio)}: pendiente de conexión con el backend (H5).`
    );
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
            <h2>Clases de la semana</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          <section className={styles.tarjeta}>
            <div className={styles.tarjetaEncabezado}>
              <h3>Vista semanal</h3>
              {hoy && (
                <span className={styles.rango}>
                  {mostrarFecha(dias[0])} – {mostrarFecha(dias[6])}
                </span>
              )}
            </div>

            <div className={styles.filtros}>
              <div className={styles.campo}>
                <label htmlFor="nombre">Clase</label>
                <input
                  id="nombre"
                  value={nombre}
                  maxLength={80}
                  placeholder="Buscar por nombre"
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setMensaje("");
                  }}
                />
              </div>

              <div className={styles.campo}>
                <label htmlFor="entrenador">Entrenador</label>
                <select
                  id="entrenador"
                  value={entrenador}
                  onChange={(e) => {
                    setEntrenador(e.target.value);
                    setMensaje("");
                  }}
                >
                  <option value="">Todos</option>
                  {entrenadores.map((e) => (
                    <option value={e} key={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.campo}>
                <label htmlFor="sala">Sala</label>
                <select
                  id="sala"
                  value={sala}
                  onChange={(e) => {
                    setSala(e.target.value);
                    setMensaje("");
                  }}
                >
                  <option value="">Todas</option>
                  {salas.map((s) => (
                    <option value={s} key={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className={styles.limpiar}
                onClick={limpiarFiltros}
              >
                Limpiar
              </button>
            </div>

            {mensaje && (
              <div role="status" className={styles.exito}>
                {mensaje}
              </div>
            )}

            {sesiones === null || hoy === null ? (
              <p role="status" className={styles.estado}>
                Cargando sesiones...
              </p>
            ) : filtradas.length === 0 ? (
              <p role="status" className={styles.estado}>
                No hay sesiones disponibles para estos filtros
              </p>
            ) : (
              <div className={styles.semana}>
                {dias.map((dia, indice) => {
                  const delDia = filtradas.filter((s) =>
                    mismoDia(s.inicio, dia)
                  );

                  return (
                    <div className={styles.dia} key={indice}>
                      <div className={styles.diaEncabezado}>
                        <strong>{DIAS_SEMANA[dia.getDay()]}</strong>
                        <span>
                          {indice === 0
                            ? "Hoy"
                            : `${dosDigitos(dia.getDate())}/${dosDigitos(dia.getMonth() + 1)}`}
                        </span>
                      </div>

                      {delDia.length === 0 ? (
                        <p className={styles.sinSesiones}>Sin sesiones</p>
                      ) : (
                        delDia.map((sesion) => {
                          const disponibilidad = obtenerDisponibilidad(
                            sesion,
                            hoy
                          );
                          const libres = cuposLibres(sesion);

                          const claseBloque =
                            disponibilidad === "DISPONIBLE"
                              ? styles.disponible
                              : disponibilidad === "LLENA"
                                ? styles.llena
                                : styles.cerrada;

                          return (
                            <article
                              className={`${styles.sesion} ${claseBloque}`}
                              key={sesion.id}
                            >
                              <div className={styles.sesionHora}>
                                <strong>{mostrarHora(sesion.inicio)}</strong>
                                <span>{sesion.duracion} min</span>
                              </div>
                              <p className={styles.sesionClase}>
                                {sesion.clase}
                              </p>
                              <p className={styles.sesionDetalle}>
                                {sesion.entrenador}
                              </p>
                              <p className={styles.sesionDetalle}>
                                {sesion.sala}
                              </p>
                              <p className={styles.sesionDetalle}>
                                Cupo máx.: {sesion.capacidad}
                              </p>
                              <p className={styles.sesionDetalle}>
                                Libres: {libres}
                              </p>

                              {disponibilidad === "DISPONIBLE" && (
                                <button
                                  type="button"
                                  className={styles.reservar}
                                  onClick={() => reservar(sesion)}
                                >
                                  Reservar
                                </button>
                              )}
                              {disponibilidad === "LLENA" && (
                                <span className={styles.insignia}>Llena</span>
                              )}
                              {disponibilidad === "CERRADA" && (
                                <span className={styles.insignia}>
                                  {etiquetaCerrada(sesion)}
                                </span>
                              )}
                            </article>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

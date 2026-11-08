"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface Miembro {
  id: string;
  name: string;
  membershipActive: boolean;
}

interface Ejercicio {
  id: string;
  name: string;
  muscleGroup: string;
}

interface FilaEjercicio {
  clave: number;
  exerciseId: string;
  weekday: string;
  sets: string;
  reps: string;
  position: string;
}

interface Rutina {
  id: string;
  memberId: string;
  name: string;
  goal: string;
  version: number;
  status: "VIGENTE" | "REEMPLAZADA";
  assignedAt: string;
  startsOn: string;
  endsOn: string;
  exerciseCount: number;
}

interface AlmacenRutinas {
  rutinas: Rutina[];
}

interface Errores {
  member?: string;
  name?: string;
  goal?: string;
  startsOn?: string;
  endsOn?: string;
  exercises?: string;
  filas: Record<number, Partial<Record<"exerciseId" | "weekday" | "sets" | "reps" | "position", string>>>;
}

const CLAVE_RUTINAS = "gkds_rutinas_prototipo";
const MIEMBRO_CON_ERROR = "mem-5";

const MENSAJE_SERVIDOR = "No se pudo asignar la rutina";
const MENSAJE_SIN_MEMBRESIA = "El miembro no tiene membresía vigente";

const miembros: Miembro[] = [
  { id: "mem-1", name: "Ana Martínez", membershipActive: true },
  { id: "mem-2", name: "Luis Hernández", membershipActive: true },
  { id: "mem-3", name: "María López", membershipActive: true },
  { id: "mem-4", name: "Carlos Ramírez", membershipActive: false },
  { id: MIEMBRO_CON_ERROR, name: "Sofía Castillo", membershipActive: true },
];

const ejercicios: Ejercicio[] = [
  { id: "ex-1", name: "Sentadilla con barra", muscleGroup: "Piernas" },
  { id: "ex-2", name: "Press de banca", muscleGroup: "Pecho" },
  { id: "ex-3", name: "Peso muerto", muscleGroup: "Espalda" },
  { id: "ex-4", name: "Dominadas", muscleGroup: "Espalda" },
  { id: "ex-5", name: "Press militar", muscleGroup: "Hombros" },
  { id: "ex-6", name: "Curl de bíceps", muscleGroup: "Brazos" },
  { id: "ex-7", name: "Fondos en paralelas", muscleGroup: "Brazos" },
  { id: "ex-8", name: "Zancadas", muscleGroup: "Piernas" },
  { id: "ex-9", name: "Plancha abdominal", muscleGroup: "Core" },
  { id: "ex-10", name: "Remo con mancuerna", muscleGroup: "Espalda" },
];

const dias = [
  { valor: "1", nombre: "Lunes" },
  { valor: "2", nombre: "Martes" },
  { valor: "3", nombre: "Miércoles" },
  { valor: "4", nombre: "Jueves" },
  { valor: "5", nombre: "Viernes" },
  { valor: "6", nombre: "Sábado" },
  { valor: "7", nombre: "Domingo" },
];

const menu = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Membresías", ruta: "/admin/membresias" },
  { nombre: "Clases y reservas", ruta: "/clases" },
  { nombre: "Entrenadores", ruta: "/entrenador/rutinas/nueva" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Máquinas", ruta: "/maquinas" },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
  { nombre: "Reportes", ruta: "/reportes" },
];

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

function mostrarFecha(iso: string): string {
  const f = new Date(iso);
  return `${dosDigitos(f.getDate())}/${dosDigitos(f.getMonth() + 1)}/${f.getFullYear()}`;
}

function mostrarFechaIso(texto: string): string {
  const [anio, mes, dia] = texto.split("-");
  return `${dia}/${mes}/${anio}`;
}

function crearFila(clave: number, posicion: number): FilaEjercicio {
  return {
    clave,
    exerciseId: "",
    weekday: "1",
    sets: "3",
    reps: "10",
    position: String(posicion),
  };
}

function enteroEnRango(valor: string, min: number, max: number): boolean {
  if (!/^\d+$/.test(valor.trim())) return false;
  const n = Number(valor);
  return n >= min && n <= max;
}

function leerAlmacen(): AlmacenRutinas {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_RUTINAS);
    return crudo ? (JSON.parse(crudo) as AlmacenRutinas) : { rutinas: [] };
  } catch {
    return { rutinas: [] };
  }
}

function guardarAlmacen(almacen: AlmacenRutinas) {
  window.sessionStorage.setItem(CLAVE_RUTINAS, JSON.stringify(almacen));
}

export default function AsignarRutinaPage() {
  const [cargado, setCargado] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [filas, setFilas] = useState<FilaEjercicio[]>([crearFila(1, 1)]);
  const [siguienteClave, setSiguienteClave] = useState(2);
  const [errores, setErrores] = useState<Errores>({ filas: {} });
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState<Rutina | null>(null);
  const [error, setError] = useState("");
  const [vigente, setVigente] = useState<Rutina | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => setCargado(true), 400);
    return () => clearTimeout(temporizador);
  }, []);

  function cambiarMiembro(id: string) {
    setMemberId(id);
    const actual = leerAlmacen().rutinas.find(
      (r) => r.memberId === id && r.status === "VIGENTE"
    );
    setVigente(actual ?? null);
  }

  function actualizarFila(clave: number, campo: keyof FilaEjercicio, valor: string) {
    setFilas((anteriores) =>
      anteriores.map((f) => (f.clave === clave ? { ...f, [campo]: valor } : f))
    );
  }

  function agregarFila() {
    if (filas.length >= 50) return;
    setFilas((anteriores) => [
      ...anteriores,
      crearFila(siguienteClave, anteriores.length + 1),
    ]);
    setSiguienteClave((n) => n + 1);
  }

  function quitarFila(clave: number) {
    setFilas((anteriores) =>
      anteriores.length > 1 ? anteriores.filter((f) => f.clave !== clave) : anteriores
    );
  }

  function validar(): Errores {
    const e: Errores = { filas: {} };
    const nombreLimpio = nombre.trim();
    const objetivoLimpio = objetivo.trim();

    if (!memberId) e.member = "Seleccione un miembro";

    if (nombreLimpio.length < 3 || nombreLimpio.length > 80) {
      e.name = "El nombre debe tener entre 3 y 80 caracteres";
    }

    if (objetivoLimpio.length < 3 || objetivoLimpio.length > 250) {
      e.goal = "El objetivo debe tener entre 3 y 250 caracteres";
    }

    if (!inicio) e.startsOn = "Ingrese la fecha de inicio";
    if (!fin) e.endsOn = "Ingrese la fecha de fin";
    if (inicio && fin && inicio > fin) {
      e.endsOn = "La fecha de fin no puede ser anterior al inicio";
    }

    if (filas.length === 0) {
      e.exercises = "Agregue al menos un ejercicio";
    }

    const usados = new Map<string, number>();
    for (const f of filas) {
      const fe: Errores["filas"][number] = {};
      if (!f.exerciseId) fe.exerciseId = "Seleccione un ejercicio";
      if (!enteroEnRango(f.weekday, 1, 7)) fe.weekday = "Día de 1 a 7";
      if (!enteroEnRango(f.sets, 1, 10)) fe.sets = "Series de 1 a 10";
      if (!enteroEnRango(f.reps, 1, 100)) fe.reps = "Repeticiones de 1 a 100";
      if (!enteroEnRango(f.position, 1, 50)) {
        fe.position = "Posición de 1 a 50";
      } else if (enteroEnRango(f.weekday, 1, 7)) {
        const combinacion = `${Number(f.weekday)}-${Number(f.position)}`;
        if (usados.has(combinacion)) {
          fe.position = "Ya existe un ejercicio en ese día y posición";
        } else {
          usados.set(combinacion, f.clave);
        }
      }
      if (Object.keys(fe).length > 0) e.filas[f.clave] = fe;
    }

    return e;
  }

  function hayErrores(e: Errores): boolean {
    return (
      Boolean(e.member || e.name || e.goal || e.startsOn || e.endsOn || e.exercises) ||
      Object.keys(e.filas).length > 0
    );
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault();
    if (guardando) return;

    setExito(null);
    setError("");

    const resultado = validar();
    setErrores(resultado);
    if (hayErrores(resultado)) return;

    setGuardando(true);

    try {
      await new Promise((resolver) => setTimeout(resolver, 700));

      const miembro = miembros.find((m) => m.id === memberId);
      if (!miembro) throw new Error("Miembro no asignado");
      if (!miembro.membershipActive) {
        setError(MENSAJE_SIN_MEMBRESIA);
        return;
      }
      if (miembro.id === MIEMBRO_CON_ERROR) {
        throw new Error("Fallo simulado del servidor");
      }

      const almacen = leerAlmacen();
      const versiones = almacen.rutinas.filter((r) => r.memberId === memberId);
      const nueva: Rutina = {
        id: `rut-${Date.now()}`,
        memberId,
        name: nombre.trim(),
        goal: objetivo.trim(),
        version: versiones.length + 1,
        status: "VIGENTE",
        assignedAt: new Date().toISOString(),
        startsOn: inicio,
        endsOn: fin,
        exerciseCount: filas.length,
      };

      const siguiente: AlmacenRutinas = {
        rutinas: [
          ...almacen.rutinas.map((r) =>
            r.memberId === memberId && r.status === "VIGENTE"
              ? { ...r, status: "REEMPLAZADA" as const }
              : r
          ),
          nueva,
        ],
      };

      guardarAlmacen(siguiente);
      setExito(nueva);
      setVigente(nueva);
      setNombre("");
      setObjetivo("");
      setInicio("");
      setFin("");
      setFilas([crearFila(siguienteClave, 1)]);
      setSiguienteClave((n) => n + 1);
      setMemberId("");
      setVigente(null);
      setErrores({ filas: {} });
    } catch {
      setError(MENSAJE_SERVIDOR);
    } finally {
      setGuardando(false);
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
                  opcion.nombre === "Entrenadores"
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
            <h2>Asignar rutina</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          <section className={styles.tarjetaFormulario}>
            <h3>Formulario</h3>

            {!cargado ? (
              <p role="status" className={styles.estado}>
                Cargando miembros y ejercicios...
              </p>
            ) : miembros.length === 0 ? (
              <p role="status" className={styles.estado}>
                No tienes miembros asignados
              </p>
            ) : (
              <form className={styles.formulario} onSubmit={guardar} noValidate>
                {exito && (
                  <div role="status" className={styles.exito}>
                    <strong>Rutina asignada</strong>
                    <span>
                      {exito.name} · versión {exito.version} · VIGENTE · asignada el{" "}
                      {mostrarFecha(exito.assignedAt)} · fin{" "}
                      {mostrarFechaIso(exito.endsOn)} · {exito.exerciseCount}{" "}
                      {exito.exerciseCount === 1 ? "ejercicio" : "ejercicios"}
                    </span>
                  </div>
                )}
                {error && (
                  <p role="alert" className={styles.error}>
                    {error}
                  </p>
                )}

                <div className={styles.rejilla}>
                  <div className={styles.campo}>
                    <label htmlFor="member">Miembro asignado</label>
                    <select
                      id="member"
                      value={memberId}
                      aria-invalid={errores.member ? true : undefined}
                      onChange={(e) => cambiarMiembro(e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {miembros.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    {errores.member && (
                      <p role="alert" className={styles.errorCampo}>
                        {errores.member}
                      </p>
                    )}
                    {vigente && (
                      <p className={styles.ayuda}>
                        Tiene la rutina «{vigente.name}» (versión {vigente.version}) vigente.
                        Se reemplazará y se conservará en el historial.
                      </p>
                    )}
                  </div>

                  <div className={styles.campo}>
                    <label htmlFor="name">Nombre de rutina</label>
                    <input
                      id="name"
                      type="text"
                      value={nombre}
                      maxLength={80}
                      placeholder="Escribir..."
                      aria-invalid={errores.name ? true : undefined}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                    {errores.name && (
                      <p role="alert" className={styles.errorCampo}>
                        {errores.name}
                      </p>
                    )}
                  </div>

                  <div className={styles.campo}>
                    <label htmlFor="goal">Objetivo</label>
                    <textarea
                      id="goal"
                      rows={3}
                      value={objetivo}
                      maxLength={250}
                      placeholder="Escribir..."
                      aria-invalid={errores.goal ? true : undefined}
                      onChange={(e) => setObjetivo(e.target.value)}
                    />
                    {errores.goal && (
                      <p role="alert" className={styles.errorCampo}>
                        {errores.goal}
                      </p>
                    )}
                  </div>

                  <div className={styles.campo}>
                    <span className={styles.etiquetaCampo}>Fecha inicio / fin</span>
                    <div className={styles.par}>
                      <div className={styles.subcampo}>
                        <input
                          id="startsOn"
                          type="date"
                          aria-label="Fecha de inicio"
                          value={inicio}
                          aria-invalid={errores.startsOn ? true : undefined}
                          onChange={(e) => setInicio(e.target.value)}
                        />
                        {errores.startsOn && (
                          <p role="alert" className={styles.errorCampo}>
                            {errores.startsOn}
                          </p>
                        )}
                      </div>
                      <div className={styles.subcampo}>
                        <input
                          id="endsOn"
                          type="date"
                          aria-label="Fecha de fin"
                          value={fin}
                          aria-invalid={errores.endsOn ? true : undefined}
                          onChange={(e) => setFin(e.target.value)}
                        />
                        {errores.endsOn && (
                          <p role="alert" className={styles.errorCampo}>
                            {errores.endsOn}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.ejercicios}>
                  <div className={styles.ejerciciosEncabezado}>
                    <h4>Ejercicios por día</h4>
                    <button
                      type="button"
                      className={styles.secundario}
                      onClick={agregarFila}
                      disabled={filas.length >= 50}
                    >
                      Agregar ejercicio
                    </button>
                  </div>

                  {errores.exercises && (
                    <p role="alert" className={styles.errorCampo}>
                      {errores.exercises}
                    </p>
                  )}

                  <ul className={styles.listaEjercicios}>
                    {filas.map((f, indice) => {
                      const fe = errores.filas[f.clave] ?? {};
                      return (
                        <li key={f.clave} className={styles.filaEjercicio}>
                          <div className={styles.campo}>
                            <label htmlFor={`ex-${f.clave}`}>Ejercicio {indice + 1}</label>
                            <select
                              id={`ex-${f.clave}`}
                              value={f.exerciseId}
                              aria-invalid={fe.exerciseId ? true : undefined}
                              onChange={(e) =>
                                actualizarFila(f.clave, "exerciseId", e.target.value)
                              }
                            >
                              <option value="">Seleccionar...</option>
                              {ejercicios.map((ex) => (
                                <option key={ex.id} value={ex.id}>
                                  {ex.name} ({ex.muscleGroup})
                                </option>
                              ))}
                            </select>
                            {fe.exerciseId && (
                              <p role="alert" className={styles.errorCampo}>
                                {fe.exerciseId}
                              </p>
                            )}
                          </div>

                          <div className={styles.campo}>
                            <label htmlFor={`wd-${f.clave}`}>Día</label>
                            <select
                              id={`wd-${f.clave}`}
                              value={f.weekday}
                              aria-invalid={fe.weekday ? true : undefined}
                              onChange={(e) =>
                                actualizarFila(f.clave, "weekday", e.target.value)
                              }
                            >
                              {dias.map((d) => (
                                <option key={d.valor} value={d.valor}>
                                  {d.valor} · {d.nombre}
                                </option>
                              ))}
                            </select>
                            {fe.weekday && (
                              <p role="alert" className={styles.errorCampo}>
                                {fe.weekday}
                              </p>
                            )}
                          </div>

                          <div className={styles.campo}>
                            <label htmlFor={`se-${f.clave}`}>Series</label>
                            <input
                              id={`se-${f.clave}`}
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={10}
                              value={f.sets}
                              aria-invalid={fe.sets ? true : undefined}
                              onChange={(e) =>
                                actualizarFila(f.clave, "sets", e.target.value)
                              }
                            />
                            {fe.sets && (
                              <p role="alert" className={styles.errorCampo}>
                                {fe.sets}
                              </p>
                            )}
                          </div>

                          <div className={styles.campo}>
                            <label htmlFor={`re-${f.clave}`}>Repeticiones</label>
                            <input
                              id={`re-${f.clave}`}
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={100}
                              value={f.reps}
                              aria-invalid={fe.reps ? true : undefined}
                              onChange={(e) =>
                                actualizarFila(f.clave, "reps", e.target.value)
                              }
                            />
                            {fe.reps && (
                              <p role="alert" className={styles.errorCampo}>
                                {fe.reps}
                              </p>
                            )}
                          </div>

                          <div className={styles.campo}>
                            <label htmlFor={`po-${f.clave}`}>Posición</label>
                            <input
                              id={`po-${f.clave}`}
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={50}
                              value={f.position}
                              aria-invalid={fe.position ? true : undefined}
                              onChange={(e) =>
                                actualizarFila(f.clave, "position", e.target.value)
                              }
                            />
                            {fe.position && (
                              <p role="alert" className={styles.errorCampo}>
                                {fe.position}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            className={styles.quitar}
                            onClick={() => quitarFila(f.clave)}
                            disabled={filas.length === 1}
                            aria-label={`Quitar ejercicio ${indice + 1}`}
                          >
                            Quitar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className={styles.accionesFormulario}>
                  <button type="submit" className={styles.guardar} disabled={guardando}>
                    {guardando ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

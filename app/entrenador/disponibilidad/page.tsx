"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type EstadoEspacio = "LIBRE" | "RESERVADO";

interface Espacio {
  id: string;
  date: string;
  startTime: string;
  status: EstadoEspacio;
}

interface AlmacenEspacios {
  espacios: Espacio[];
}

const CLAVE_ESPACIOS = "gkds_disponibilidad_prototipo";
const DIAS_MAXIMOS = 15;
const DURACION_MINUTOS = 60;
const HORAS = Array.from({ length: 15 }, (_, i) => `${String(i + 6).padStart(2, "0")}:00`);

const MENSAJE_PASADO = "El horario debe ser posterior a la hora actual";
const MENSAJE_FECHA = "La fecha debe estar entre hoy y 15 días después";
const MENSAJE_DUPLICADO = "Ya tienes un espacio en ese horario";
const MENSAJE_RESERVADO = "El espacio tiene una sesión confirmada";
const MENSAJE_SERVIDOR = "No se pudo guardar el espacio. Reintenta";
const MENSAJE_ELIMINAR = "No se pudo eliminar el espacio. Reintenta";

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

function enDias(base: Date, n: number): string {
  return claveIso(new Date(base.getFullYear(), base.getMonth(), base.getDate() + n));
}

function mostrarFechaIso(texto: string): string {
  const [anio, mes, dia] = texto.split("-");
  return `${dia}/${mes}/${anio}`;
}

function horaFin(inicio: string): string {
  const [h, m] = inicio.split(":").map(Number);
  const total = h * 60 + m + DURACION_MINUTOS;
  return `${dosDigitos(Math.floor(total / 60))}:${dosDigitos(total % 60)}`;
}

function inicioComoFecha(fecha: string, hora: string): Date {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  return new Date(anio, mes - 1, dia, h, m);
}

function ordenar(espacios: Espacio[]): Espacio[] {
  return [...espacios].sort((a, b) =>
    `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
  );
}

function crearAlmacenInicial(ahora: Date): AlmacenEspacios {
  return {
    espacios: [
      { id: "esp-1", date: enDias(ahora, 1), startTime: "09:00", status: "LIBRE" },
      { id: "esp-2", date: enDias(ahora, 1), startTime: "10:00", status: "RESERVADO" },
      { id: "esp-3", date: enDias(ahora, 2), startTime: "16:00", status: "LIBRE" },
      { id: "esp-4", date: enDias(ahora, 4), startTime: "07:00", status: "RESERVADO" },
      { id: "esp-5", date: enDias(ahora, 5), startTime: "18:00", status: "LIBRE" },
    ],
  };
}

function leerAlmacen(): AlmacenEspacios | null {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_ESPACIOS);
    return crudo ? (JSON.parse(crudo) as AlmacenEspacios) : null;
  } catch {
    return null;
  }
}

function guardarAlmacen(almacen: AlmacenEspacios) {
  window.sessionStorage.setItem(CLAVE_ESPACIOS, JSON.stringify(almacen));
}

export default function DisponibilidadPage() {
  const [almacen, setAlmacen] = useState<AlmacenEspacios | null>(null);
  const [hoy, setHoy] = useState("");
  const [maximo, setMaximo] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [errorFecha, setErrorFecha] = useState("");
  const [errorHora, setErrorHora] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");
  const [aEliminar, setAEliminar] = useState<Espacio | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const dialogoRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      const ahora = new Date();
      let datos = leerAlmacen();
      if (!datos) {
        datos = crearAlmacenInicial(ahora);
        try {
          guardarAlmacen(datos);
        } catch {}
      }
      setHoy(claveIso(ahora));
      setMaximo(enDias(ahora, DIAS_MAXIMOS));
      setAlmacen(datos);
    }, 400);

    return () => clearTimeout(temporizador);
  }, []);

  function limpiarFormulario() {
    setFecha("");
    setHora("");
    setEditandoId(null);
    setErrorFecha("");
    setErrorHora("");
  }

  function empezarEdicion(espacio: Espacio) {
    setEditandoId(espacio.id);
    setFecha(espacio.date);
    setHora(espacio.startTime);
    setErrorFecha("");
    setErrorHora("");
    setExito("");
    setError("");
    document.getElementById("date")?.focus();
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando || !almacen) return;

    setExito("");
    setError("");

    let invalido = false;
    setErrorFecha("");
    setErrorHora("");

    if (!fecha) {
      setErrorFecha("Seleccione una fecha");
      invalido = true;
    } else if (fecha < hoy || fecha > maximo) {
      setErrorFecha(MENSAJE_FECHA);
      invalido = true;
    }

    if (!hora) {
      setErrorHora("Seleccione una hora de inicio");
      invalido = true;
    } else if (!invalido && inicioComoFecha(fecha, hora) <= new Date()) {
      setErrorHora(MENSAJE_PASADO);
      invalido = true;
    }

    if (invalido) return;

    setGuardando(true);

    try {
      await new Promise((resolver) => setTimeout(resolver, 700));

      if (fecha === maximo && hora === "20:00") {
        throw new Error("Fallo simulado del servidor");
      }

      const actual = leerAlmacen() ?? almacen;
      const propio = editandoId
        ? actual.espacios.find((s) => s.id === editandoId)
        : null;

      if (editandoId && (!propio || propio.status === "RESERVADO")) {
        setError(MENSAJE_RESERVADO);
        setAlmacen(actual);
        return;
      }

      const duplicado = actual.espacios.some(
        (s) => s.id !== editandoId && s.date === fecha && s.startTime === hora
      );
      if (duplicado) {
        setError(MENSAJE_DUPLICADO);
        return;
      }

      const siguiente: AlmacenEspacios = editandoId
        ? {
            espacios: actual.espacios.map((s) =>
              s.id === editandoId ? { ...s, date: fecha, startTime: hora } : s
            ),
          }
        : {
            espacios: [
              ...actual.espacios,
              { id: `esp-${Date.now()}`, date: fecha, startTime: hora, status: "LIBRE" },
            ],
          };

      guardarAlmacen(siguiente);
      setAlmacen(siguiente);
      limpiarFormulario();
      setExito("Espacio guardado");
    } catch {
      setError(MENSAJE_SERVIDOR);
    } finally {
      setGuardando(false);
    }
  }

  function pedirEliminar(espacio: Espacio) {
    setExito("");
    setError("");
    setAEliminar(espacio);
    dialogoRef.current?.showModal();
  }

  function cerrarDialogo() {
    if (eliminando) return;
    dialogoRef.current?.close();
  }

  async function confirmarEliminar() {
    if (!aEliminar || !almacen || eliminando) return;

    setEliminando(true);

    try {
      await new Promise((resolver) => setTimeout(resolver, 600));

      const actual = leerAlmacen() ?? almacen;
      const vigente = actual.espacios.find((s) => s.id === aEliminar.id);

      if (vigente && vigente.status === "RESERVADO") {
        dialogoRef.current?.close();
        setAlmacen(actual);
        setError(MENSAJE_RESERVADO);
        return;
      }

      const siguiente: AlmacenEspacios = {
        espacios: actual.espacios.filter((s) => s.id !== aEliminar.id),
      };
      guardarAlmacen(siguiente);
      setAlmacen(siguiente);
      if (editandoId === aEliminar.id) limpiarFormulario();
      dialogoRef.current?.close();
      setExito("Espacio eliminado");
    } catch {
      dialogoRef.current?.close();
      setError(MENSAJE_ELIMINAR);
    } finally {
      setEliminando(false);
    }
  }

  const espacios = ordenar(almacen?.espacios ?? []);

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
            <h2>Mi disponibilidad</h2>
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

          <section className={styles.tarjetaFormulario}>
            <h3>{editandoId ? "Editar espacio" : "Formulario"}</h3>

            <form className={styles.formulario} onSubmit={guardar} noValidate>
              <div className={styles.rejilla}>
                <div className={styles.campo}>
                  <label htmlFor="date">Fecha del horario</label>
                  <input
                    id="date"
                    type="date"
                    value={fecha}
                    min={hoy || undefined}
                    max={maximo || undefined}
                    aria-invalid={errorFecha ? true : undefined}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                  {errorFecha && (
                    <p role="alert" className={styles.errorCampo}>
                      {errorFecha}
                    </p>
                  )}
                </div>

                <div className={styles.campo}>
                  <label htmlFor="startTime">Hora de inicio</label>
                  <select
                    id="startTime"
                    value={hora}
                    aria-invalid={errorHora ? true : undefined}
                    onChange={(e) => setHora(e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {HORAS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  {errorHora && (
                    <p role="alert" className={styles.errorCampo}>
                      {errorHora}
                    </p>
                  )}
                </div>

                <div className={styles.campo}>
                  <label htmlFor="duration">Duración</label>
                  <input
                    id="duration"
                    type="text"
                    value={`${DURACION_MINUTOS} minutos`}
                    readOnly
                  />
                </div>
              </div>

              <div className={styles.accionesFormulario}>
                {editandoId && (
                  <button
                    type="button"
                    className={styles.secundario}
                    onClick={limpiarFormulario}
                    disabled={guardando}
                  >
                    Cancelar edición
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.guardar}
                  disabled={guardando || !almacen}
                >
                  {guardando
                    ? "Guardando..."
                    : editandoId
                      ? "Guardar cambios"
                      : "Guardar espacio"}
                </button>
              </div>
            </form>
          </section>

          <section className={styles.tarjeta}>
            <h3>Mi disponibilidad</h3>

            {!almacen ? (
              <p role="status" className={styles.estado}>
                Cargando disponibilidad...
              </p>
            ) : espacios.length === 0 ? (
              <p role="status" className={styles.estado}>
                Aún no has definido horarios
              </p>
            ) : (
              <div className={styles.tablaContenedor}>
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora de inicio</th>
                      <th>Hora de fin</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {espacios.map((espacio) => (
                      <tr key={espacio.id}>
                        <td className={styles.destacado}>
                          {mostrarFechaIso(espacio.date)}
                        </td>
                        <td>{espacio.startTime}</td>
                        <td>{horaFin(espacio.startTime)}</td>
                        <td>
                          <span
                            className={`${styles.insignia} ${styles[`estado${espacio.status}`]}`}
                          >
                            {espacio.status}
                          </span>
                        </td>
                        <td>
                          {espacio.status === "LIBRE" && (
                            <div className={styles.accionesFila}>
                              <button
                                type="button"
                                className={styles.enlaceBoton}
                                onClick={() => empezarEdicion(espacio)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className={styles.eliminar}
                                onClick={() => pedirEliminar(espacio)}
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      <dialog
        ref={dialogoRef}
        className={styles.dialogo}
        aria-labelledby="titulo-dialogo"
        onCancel={(e) => {
          if (eliminando) e.preventDefault();
        }}
        onClose={() => setAEliminar(null)}
      >
        <h3 id="titulo-dialogo">¿Eliminar este espacio?</h3>
        {aEliminar && (
          <p>
            <strong>{mostrarFechaIso(aEliminar.date)}</strong> de{" "}
            <strong>{aEliminar.startTime}</strong> a{" "}
            <strong>{horaFin(aEliminar.startTime)}</strong>
          </p>
        )}

        {eliminando && (
          <p role="status" className={styles.procesando}>
            Eliminando espacio...
          </p>
        )}

        <div className={styles.accionesDialogo}>
          <button
            type="button"
            className={styles.secundario}
            onClick={cerrarDialogo}
            disabled={eliminando}
          >
            Volver
          </button>
          <button
            type="button"
            className={styles.peligro}
            onClick={confirmarEliminar}
            disabled={eliminando}
          >
            Eliminar
          </button>
        </div>
      </dialog>
    </div>
  );
}


"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type EstadoMaquina =
  | "DISPONIBLE"
  | "EN_MANTENIMIENTO"
  | "FUERA_SERVICIO";

interface Maquina {
  id: number;
  nombre: string;
  ubicacion: string;
}

interface Mantenimiento {
  id: number;
  maquinaId: number;
  estado: EstadoMaquina;
  motivo: string;
  fechaInicio: string;
  fechaFin: string;
  responsable: string;
}

type Formulario = Omit<Mantenimiento, "id">;

const maquinas: Maquina[] = [
  { id: 1, nombre: "Caminadora", ubicacion: "Cardio" },
  { id: 2, nombre: "Bicicleta estática", ubicacion: "Cardio" },
  { id: 3, nombre: "Prensa de piernas", ubicacion: "Musculación" },
  { id: 4, nombre: "Máquina de poleas", ubicacion: "Musculación" },
  { id: 5, nombre: "Elíptica", ubicacion: "Cardio" },
];

const mantenimientosIniciales: Mantenimiento[] = [
  {
    id: 1,
    maquinaId: 2,
    estado: "EN_MANTENIMIENTO",
    motivo: "Revisión de resistencia y pedales",
    fechaInicio: "2026-11-05",
    fechaFin: "",
    responsable: "Personal de mantenimiento",
  },
  {
    id: 2,
    maquinaId: 3,
    estado: "FUERA_SERVICIO",
    motivo: "Falla en el sistema de carga",
    fechaInicio: "2026-11-04",
    fechaFin: "",
    responsable: "Personal de mantenimiento",
  },
];

const formularioVacio: Formulario = {
  maquinaId: 0,
  estado: "EN_MANTENIMIENTO",
  motivo: "",
  fechaInicio: "",
  fechaFin: "",
  responsable: "",
};

const menu = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Membresías", ruta: "/admin/membresias" },
  { nombre: "Clases y reservas", ruta: "/clases" },
  { nombre: "Entrenadores", ruta: "/entrenadores" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Máquinas", ruta: "/admin/mantenimiento" },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
  { nombre: "Reportes", ruta: "/reportes" },
];

function nombreEstado(estado: EstadoMaquina) {
  switch (estado) {
    case "DISPONIBLE":
      return "Disponible";
    case "EN_MANTENIMIENTO":
      return "En mantenimiento";
    case "FUERA_SERVICIO":
      return "Fuera de servicio";
  }
}

function mostrarFecha(fecha: string) {
  if (!fecha) return "Pendiente";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export default function MantenimientoPage() {
  const [registros, setRegistros] = useState(
    mantenimientosIniciales
  );
  const [formulario, setFormulario] =
    useState<Formulario>(formularioVacio);
  const [editandoId, setEditandoId] =
    useState<number | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [filtro, setFiltro] = useState("");

  function cambiarCampo<K extends keyof Formulario>(
    campo: K,
    valor: Formulario[K]
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
    setError("");
    setMensaje("");
  }

  function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setMensaje("");

    if (
      !formulario.maquinaId ||
      !formulario.motivo.trim() ||
      !formulario.fechaInicio ||
      !formulario.responsable.trim()
    ) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    if (formulario.motivo.trim().length < 10) {
      setError("El motivo debe tener al menos 10 caracteres.");
      return;
    }

    if (
      formulario.fechaFin &&
      formulario.fechaFin < formulario.fechaInicio
    ) {
      setError(
        "La fecha de finalización no puede ser anterior al inicio."
      );
      return;
    }

    if (
      formulario.estado === "DISPONIBLE" &&
      !formulario.fechaFin
    ) {
      setError(
        "Indica la fecha de finalización para marcar la máquina como disponible."
      );
      return;
    }

    const datos = {
      ...formulario,
      motivo: formulario.motivo.trim(),
      responsable: formulario.responsable.trim(),
    };

    if (editandoId !== null) {
      setRegistros((anteriores) =>
        anteriores.map((registro) =>
          registro.id === editandoId
            ? { ...registro, ...datos }
            : registro
        )
      );

      setMensaje(
        "Mantenimiento actualizado en la demostración."
      );
    } else {
      const nuevoRegistro: Mantenimiento = {
        ...datos,
        id: Math.max(0, ...registros.map((r) => r.id)) + 1,
      };

      setRegistros((anteriores) => [
        nuevoRegistro,
        ...anteriores,
      ]);

      setMensaje(
        "Mantenimiento registrado en la demostración."
      );
    }

    setFormulario({ ...formularioVacio });
    setEditandoId(null);
  }

  function editar(registro: Mantenimiento) {
    setFormulario({
      maquinaId: registro.maquinaId,
      estado: registro.estado,
      motivo: registro.motivo,
      fechaInicio: registro.fechaInicio,
      fechaFin: registro.fechaFin,
      responsable: registro.responsable,
    });

    setEditandoId(registro.id);
    setError("");
    setMensaje("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    setFormulario({ ...formularioVacio });
    setEditandoId(null);
    setError("");
    setMensaje("");
  }

  const registrosFiltrados = registros.filter((registro) => {
    const maquina = maquinas.find(
      (m) => m.id === registro.maquinaId
    );

    return (maquina?.nombre ?? "")
      .toLowerCase()
      .includes(filtro.toLowerCase());
  });

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
                  opcion.nombre === "Máquinas"
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
            <h2>Mantenimiento de máquinas</h2>
            <span className={styles.etiqueta}>Prototipo</span>
          </div>

          <section className={styles.tarjeta}>
            <h3>
              {editandoId !== null
                ? "Actualizar mantenimiento"
                : "Registrar mantenimiento"}
            </h3>

            <form onSubmit={guardar}>
              <div className={styles.formulario}>
                <div className={styles.campo}>
                  <label htmlFor="maquina">Máquina</label>
                  <select
                    id="maquina"
                    value={formulario.maquinaId}
                    onChange={(e) =>
                      cambiarCampo(
                        "maquinaId",
                        Number(e.target.value)
                      )
                    }
                  >
                    <option value={0}>
                      Seleccionar máquina
                    </option>
                    {maquinas.map((maquina) => (
                      <option
                        key={maquina.id}
                        value={maquina.id}
                      >
                        {maquina.nombre} - {maquina.ubicacion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.campo}>
                  <label htmlFor="estado">
                    Estado de la máquina
                  </label>
                  <select
                    id="estado"
                    value={formulario.estado}
                    onChange={(e) =>
                      cambiarCampo(
                        "estado",
                        e.target.value as EstadoMaquina
                      )
                    }
                  >
                    <option value="EN_MANTENIMIENTO">
                      En mantenimiento
                    </option>
                    <option value="DISPONIBLE">
                      Disponible
                    </option>
                    <option value="FUERA_SERVICIO">
                      Fuera de servicio
                    </option>
                  </select>
                </div>

                <div className={styles.campo}>
                  <label htmlFor="motivo">
                    Motivo del mantenimiento
                  </label>
                  <textarea
                    id="motivo"
                    rows={3}
                    maxLength={255}
                    placeholder="Describa el motivo"
                    value={formulario.motivo}
                    onChange={(e) =>
                      cambiarCampo("motivo", e.target.value)
                    }
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="responsable">
                    Usuario responsable
                  </label>
                  <input
                    id="responsable"
                    type="text"
                    maxLength={80}
                    placeholder="Nombre del responsable"
                    value={formulario.responsable}
                    onChange={(e) =>
                      cambiarCampo(
                        "responsable",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="inicio">
                    Fecha de inicio
                  </label>
                  <input
                    id="inicio"
                    type="date"
                    value={formulario.fechaInicio}
                    onChange={(e) =>
                      cambiarCampo(
                        "fechaInicio",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="fin">
                    Fecha de finalización
                  </label>
                  <input
                    id="fin"
                    type="date"
                    min={formulario.fechaInicio || undefined}
                    value={formulario.fechaFin}
                    onChange={(e) =>
                      cambiarCampo(
                        "fechaFin",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              {error && (
                <div className={styles.error} role="alert">
                  {error}
                </div>
              )}

              {mensaje && (
                <div className={styles.exito} role="status">
                  {mensaje}
                </div>
              )}

              <div className={styles.acciones}>
                {editandoId !== null && (
                  <button
                    type="button"
                    className={styles.botonSecundario}
                    onClick={cancelarEdicion}
                  >
                    Cancelar edición
                  </button>
                )}

                <button
                  type="submit"
                  className={styles.botonPrincipal}
                >
                  {editandoId !== null
                    ? "Guardar cambios"
                    : "Registrar mantenimiento"}
                </button>
              </div>
            </form>
          </section>

          <section className={styles.tarjeta}>
            <div className={styles.historialTitulo}>
              <h3>Historial de mantenimientos</h3>

              <input
                type="search"
                placeholder="Buscar máquina"
                aria-label="Buscar máquina"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>

            <div className={styles.tablaContenedor}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Máquina</th>
                    <th>Estado</th>
                    <th>Motivo</th>
                    <th>Inicio</th>
                    <th>Finalización</th>
                    <th>Responsable</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.map((registro) => {
                    const maquina = maquinas.find(
                      (m) => m.id === registro.maquinaId
                    );

                    return (
                      <tr key={registro.id}>
                        <td>{maquina?.nombre ?? "Desconocida"}</td>
                        <td>
                          <span
                            className={
                              registro.estado === "DISPONIBLE"
                                ? styles.disponible
                                : registro.estado ===
                                    "EN_MANTENIMIENTO"
                                  ? styles.mantenimiento
                                  : styles.fueraServicio
                            }
                          >
                            {nombreEstado(registro.estado)}
                          </span>
                        </td>
                        <td>{registro.motivo}</td>
                        <td>
                          {mostrarFecha(registro.fechaInicio)}
                        </td>
                        <td>
                          {mostrarFecha(registro.fechaFin)}
                        </td>
                        <td>{registro.responsable}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.botonEditar}
                            onClick={() => editar(registro)}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {registrosFiltrados.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className={styles.sinResultados}
                      >
                        No se encontraron mantenimientos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        
        </main>
      </div>
    </div>
  );
}

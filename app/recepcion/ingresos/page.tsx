
"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type EstadoMembresia =
  | "VIGENTE"
  | "VENCIDA"
  | "SIN_MEMBRESIA";

interface Miembro {
  id: string;
  numero: string;
  nombre: string;
  estado: EstadoMembresia;
  vencimiento: string | null;
}

interface Ingreso {
  id: number;
  miembroId: string;
  numero: string;
  nombre: string;
  fechaHora: string;
}

const miembrosEjemplo: Miembro[] = [
  {
    id: "1",
    numero: "M-000001",
    nombre: "María López",
    estado: "VIGENTE",
    vencimiento: "2026-11-30",
  },
  {
    id: "2",
    numero: "M-000002",
    nombre: "Carlos Martínez",
    estado: "VENCIDA",
    vencimiento: "2026-10-15",
  },
  {
    id: "3",
    numero: "M-000003",
    nombre: "Ana Rodríguez",
    estado: "SIN_MEMBRESIA",
    vencimiento: null,
  },
  {
    id: "4",
    numero: "M-000004",
    nombre: "José Hernández",
    estado: "VIGENTE",
    vencimiento: "2026-12-15",
  },
  {
    id: "5",
    numero: "M-000005",
    nombre: "Sofía Ramírez",
    estado: "VIGENTE",
    vencimiento: "2026-12-20",
  },
];

const menu = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Membresías", ruta: "/admin/membresias" },
  { nombre: "Clases y reservas", ruta: "/clases" },
  { nombre: "Entrenadores", ruta: "/entrenadores" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Máquinas", ruta: "/maquinas" },
  { nombre: "Control de ingresos", ruta: "/recepcion/ingresos" },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
  { nombre: "Reportes", ruta: "/reportes" },
];

function formatearFecha(fecha: string | null) {
  if (!fecha) return "No aplica";

  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(fecha: string) {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/El_Salvador",
  }).format(new Date(fecha));
}

function obtenerFechaLocal() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/El_Salvador",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function RegistroIngresosPage() {
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] =
    useState<Miembro | null>(null);

  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);

  const termino = busqueda.trim().toLowerCase();

  const resultados =
    termino.length >= 2
      ? miembrosEjemplo
          .filter(
            (miembro) =>
              miembro.nombre.toLowerCase().includes(termino) ||
              miembro.numero.toLowerCase() === termino
          )
          .slice(0, 20)
      : [];

  function seleccionarMiembro(miembro: Miembro) {
    setSeleccionado(miembro);
    setMensaje("");
    setError("");
  }

  function registrarIngreso() {
    if (!seleccionado) {
      setError("Debes seleccionar un miembro.");
      return;
    }

    setProcesando(true);
    setError("");
    setMensaje("");

    // Demostración local. No envía datos al backend.
    const fechaActual = obtenerFechaLocal();

    const ingresoExistente = ingresos.some(
      (ingreso) =>
        ingreso.miembroId === seleccionado.id &&
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/El_Salvador",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(ingreso.fechaHora)) === fechaActual
    );

    if (ingresoExistente) {
      setError(
        "Este miembro ya tiene un ingreso registrado hoy en la demostración."
      );
      setProcesando(false);
      return;
    }

    // La validación de membresía y confirmación
    // de ingreso especial se desarrollarán en H14.
    const nuevoIngreso: Ingreso = {
      id: Date.now(),
      miembroId: seleccionado.id,
      numero: seleccionado.numero,
      nombre: seleccionado.nombre,
      fechaHora: new Date().toISOString(),
    };

    setIngresos((anteriores) => [
      nuevoIngreso,
      ...anteriores,
    ]);

    setMensaje(
      `Ingreso de ${seleccionado.nombre} registrado en la demostración.`
    );

    setSeleccionado(null);
    setProcesando(false);
  }

  return (
    <div className={styles.contenedor}>
      <header className={styles.encabezado}>
        <h1>GKDS/GYM</h1>
      </header>

      <div className={styles.estructura}>
        <aside className={styles.sidebar}>
          <p className={styles.menuTitulo}>
            MENÚ PRINCIPAL
          </p>

          <nav className={styles.navegacion}>
            {menu.map((opcion) => (
              <Link
                key={opcion.nombre}
                href={opcion.ruta}
                className={
                  opcion.nombre === "Control de ingresos"
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
            <h2>Registro de ingreso de miembros</h2>
            <span className={styles.etiqueta}>
              Prototipo
            </span>
          </div>

          <section className={styles.tarjeta}>
            <h3>Buscar miembro</h3>

            <p className={styles.descripcion}>
              Ingresa el nombre o número de miembro
              para registrar su entrada al gimnasio.
            </p>

            <div className={styles.campoBusqueda}>
              <label htmlFor="busqueda">
                Nombre o número de miembro
              </label>

              <input
                id="busqueda"
                type="search"
                placeholder="Ej. M-000001 o María"
                minLength={2}
                maxLength={80}
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setSeleccionado(null);
                  setError("");
                  setMensaje("");
                }}
              />

              {termino.length > 0 && termino.length < 2 && (
                <p className={styles.ayuda}>
                  Escribe al menos dos caracteres para buscar.
                </p>
              )}
            </div>

            {termino.length >= 2 && (
              <div className={styles.resultados}>
                <h4>Resultados de búsqueda</h4>

                {resultados.length > 0 ? (
                  <div className={styles.tablaContenedor}>
                    <table className={styles.tabla}>
                      <thead>
                        <tr>
                          <th>Número</th>
                          <th>Nombre</th>
                          <th>Estado</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultados.map((miembro) => (
                          <tr key={miembro.id}>
                            <td>{miembro.numero}</td>
                            <td>{miembro.nombre}</td>
                            <td>
                              <span
                                className={
                                  miembro.estado === "VIGENTE"
                                    ? styles.vigente
                                    : styles.vencida
                                }
                              >
                                {miembro.estado === "SIN_MEMBRESIA"
                                  ? "Sin membresía"
                                  : miembro.estado}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={styles.botonSeleccionar}
                                onClick={() =>
                                  seleccionarMiembro(miembro)
                                }
                              >
                                Seleccionar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={styles.sinResultados}>
                    No se encontró ningún miembro.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className={styles.tarjeta}>
            <h3>Información del miembro</h3>

            {seleccionado ? (
              <>
                <div className={styles.informacion}>
                  <div className={styles.fila}>
                    <strong>Número de miembro</strong>
                    <span>{seleccionado.numero}</span>
                  </div>

                  <div className={styles.fila}>
                    <strong>Nombre completo</strong>
                    <span>{seleccionado.nombre}</span>
                  </div>

                  <div className={styles.fila}>
                    <strong>Estado de membresía</strong>
                    <span
                      className={
                        seleccionado.estado === "VIGENTE"
                          ? styles.textoVigente
                          : styles.textoVencido
                      }
                    >
                      {seleccionado.estado === "SIN_MEMBRESIA"
                        ? "SIN MEMBRESÍA"
                        : seleccionado.estado}
                    </span>
                  </div>

                  <div className={styles.fila}>
                    <strong>Fecha de vencimiento</strong>
                    <span>
                      {formatearFecha(
                        seleccionado.vencimiento
                      )}
                    </span>
                  </div>
                </div>

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
                    disabled={procesando}
                    onClick={registrarIngreso}
                  >
                    {procesando
                      ? "Registrando..."
                      : "Registrar ingreso"}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.estadoVacio}>
                Selecciona un miembro de los resultados
                para visualizar su información.
              </div>
            )}

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
          </section>

          <section className={styles.tarjeta}>
            <h3>Ingresos registrados en esta sesión</h3>

            {ingresos.length === 0 ? (
              <div className={styles.estadoVacio}>
                Todavía no se han registrado ingresos
                en esta demostración.
              </div>
            ) : (
              <div className={styles.tablaContenedor}>
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Miembro</th>
                      <th>Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresos.map((ingreso) => (
                      <tr key={ingreso.id}>
                        <td>{ingreso.numero}</td>
                        <td>{ingreso.nombre}</td>
                        <td>
                          {formatearFechaHora(
                            ingreso.fechaHora
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className={styles.nota}>
            PROTOTIPO VISUAL · Los ingresos son
            temporales y no se guardan en la base de datos.
          </p>
        </main>
      </div>
    </div>
  );
}

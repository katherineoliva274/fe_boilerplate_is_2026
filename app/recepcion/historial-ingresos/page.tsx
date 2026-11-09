
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type EstadoMembresia =
  | "VIGENTE"
  | "VENCIDA"
  | "SIN_MEMBRESIA";

interface Ingreso {
  id: number;
  numero: string;
  nombre: string;
  fechaHora: string;
  estado: EstadoMembresia;
  confirmacionEspecial: boolean;
  responsable: string;
}

const ingresosEjemplo: Ingreso[] = [
  {
    id: 1,
    numero: "M-000001",
    nombre: "María López",
    fechaHora: "2026-11-07T08:15:00-06:00",
    estado: "VIGENTE",
    confirmacionEspecial: false,
    responsable: "Recepción",
  },
  {
    id: 2,
    numero: "M-000002",
    nombre: "Carlos Martínez",
    fechaHora: "2026-11-07T09:30:00-06:00",
    estado: "VENCIDA",
    confirmacionEspecial: true,
    responsable: "Recepción",
  },
  {
    id: 3,
    numero: "M-000003",
    nombre: "Ana Rodríguez",
    fechaHora: "2026-11-07T10:45:00-06:00",
    estado: "SIN_MEMBRESIA",
    confirmacionEspecial: true,
    responsable: "Recepción",
  },
  {
    id: 4,
    numero: "M-000004",
    nombre: "José Hernández",
    fechaHora: "2026-11-06T07:50:00-06:00",
    estado: "VIGENTE",
    confirmacionEspecial: false,
    responsable: "Recepción",
  },
  {
    id: 5,
    numero: "M-000005",
    nombre: "Sofía Ramírez",
    fechaHora: "2026-11-06T16:20:00-06:00",
    estado: "VIGENTE",
    confirmacionEspecial: false,
    responsable: "Recepción",
  },
  {
    id: 6,
    numero: "M-000001",
    nombre: "María López",
    fechaHora: "2026-11-05T08:10:00-06:00",
    estado: "VIGENTE",
    confirmacionEspecial: false,
    responsable: "Recepción",
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
  {
    nombre: "Historial de ingresos",
    ruta: "/recepcion/historial-ingresos",
  },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
  { nombre: "Reportes", ruta: "/reportes" },
];

function fechaLocalISO(fecha: string) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/El_Salvador",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(fecha));

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
}

function formatearFechaHora(fecha: string) {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/El_Salvador",
  }).format(new Date(fecha));
}

function nombreEstado(estado: EstadoMembresia) {
  switch (estado) {
    case "VIGENTE":
      return "Vigente";
    case "VENCIDA":
      return "Vencida";
    case "SIN_MEMBRESIA":
      return "Sin membresía";
  }
}

export default function HistorialIngresosPage() {
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [detalle, setDetalle] = useState<Ingreso | null>(null);

  const fechasInvalidas =
    Boolean(fechaInicio && fechaFin) &&
    fechaInicio > fechaFin;

  const registrosFiltrados = useMemo(() => {
    if (fechasInvalidas) return [];

    const termino = busqueda.trim().toLowerCase();

    return ingresosEjemplo
      .filter((ingreso) => {
        const coincideBusqueda =
          ingreso.nombre.toLowerCase().includes(termino) ||
          ingreso.numero.toLowerCase().includes(termino);

        const fechaIngreso = fechaLocalISO(ingreso.fechaHora);

        const coincideInicio =
          !fechaInicio || fechaIngreso >= fechaInicio;

        const coincideFin =
          !fechaFin || fechaIngreso <= fechaFin;

        const coincideEstado =
          estado === "TODOS" || ingreso.estado === estado;

        return (
          coincideBusqueda &&
          coincideInicio &&
          coincideFin &&
          coincideEstado
        );
      })
      .sort(
        (a, b) =>
          new Date(b.fechaHora).getTime() -
          new Date(a.fechaHora).getTime()
      );
  }, [busqueda, fechaInicio, fechaFin, estado, fechasInvalidas]);

  const ingresosEspeciales = registrosFiltrados.filter(
    (ingreso) => ingreso.confirmacionEspecial
  ).length;

  function limpiarFiltros() {
    setBusqueda("");
    setFechaInicio("");
    setFechaFin("");
    setEstado("TODOS");
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
                  opcion.nombre === "Historial de ingresos"
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
            <h2>Historial de ingresos</h2>
            <span className={styles.etiqueta}>Prototipo</span>
          </div>

          <section className={styles.resumen}>
            <div className={styles.resumenItem}>
              <span>Ingresos registrados</span>
              <strong>{ingresosEjemplo.length}</strong>
            </div>

            <div className={styles.resumenItem}>
              <span>Resultados de la consulta</span>
              <strong>{registrosFiltrados.length}</strong>
            </div>

            <div className={styles.resumenItem}>
              <span>Ingresos especiales encontrados</span>
              <strong className={styles.naranja}>
                {ingresosEspeciales}
              </strong>
            </div>
          </section>

          <section className={styles.tarjeta}>
            <h3>Consultar ingresos</h3>

            <p className={styles.descripcion}>
              Utiliza los filtros para consultar los ingresos
              registrados de los miembros del gimnasio.
            </p>

            <div className={styles.filtros}>
              <div className={styles.campo}>
                <label htmlFor="busqueda">
                  Nombre o número de miembro
                </label>
                <input
                  id="busqueda"
                  type="search"
                  placeholder="Buscar miembro"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <div className={styles.campo}>
                <label htmlFor="inicio">Fecha desde</label>
                <input
                  id="inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              <div className={styles.campo}>
                <label htmlFor="fin">Fecha hasta</label>
                <input
                  id="fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>

              <div className={styles.campo}>
                <label htmlFor="estado">Estado de membresía</label>
                <select
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <option value="TODOS">Todos los estados</option>
                  <option value="VIGENTE">Vigente</option>
                  <option value="VENCIDA">Vencida</option>
                  <option value="SIN_MEMBRESIA">
                    Sin membresía
                  </option>
                </select>
              </div>
            </div>

            {fechasInvalidas && (
              <div className={styles.error} role="alert">
                La fecha inicial no puede ser posterior
                a la fecha final.
              </div>
            )}

            <div className={styles.acciones}>
              <button
                type="button"
                className={styles.botonSecundario}
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            </div>
          </section>

          <section className={styles.tarjeta}>
            <div className={styles.cabeceraTabla}>
              <h3>Registros de ingresos</h3>
              <span>
                {registrosFiltrados.length} resultado(s)
              </span>
            </div>

            {registrosFiltrados.length === 0 ? (
              <div className={styles.sinResultados}>
                No se encontraron ingresos para los filtros
                seleccionados.
              </div>
            ) : (
              <div className={styles.tablaContenedor}>
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Miembro</th>
                      <th>Fecha y hora</th>
                      <th>Estado de membresía</th>
                      <th>Tipo de ingreso</th>
                      <th>Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {registrosFiltrados.map((ingreso) => (
                      <tr key={ingreso.id}>
                        <td>{ingreso.numero}</td>
                        <td>{ingreso.nombre}</td>
                        <td>
                          {formatearFechaHora(ingreso.fechaHora)}
                        </td>
                        <td>
                          <span
                            className={
                              ingreso.estado === "VIGENTE"
                                ? styles.vigente
                                : styles.vencida
                            }
                          >
                            {nombreEstado(ingreso.estado)}
                          </span>
                        </td>
                        <td>
                          {ingreso.confirmacionEspecial
                            ? "Especial"
                            : "Normal"}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.botonDetalles}
                            onClick={() => setDetalle(ingreso)}
                          >
                            Ver detalle
                          </button>
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

      {detalle && (
        <div className={styles.modalFondo}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloDetalle"
          >
            <h3 id="tituloDetalle">Detalle del ingreso</h3>

            <div className={styles.fila}>
              <strong>Número de miembro</strong>
              <span>{detalle.numero}</span>
            </div>

            <div className={styles.fila}>
              <strong>Nombre</strong>
              <span>{detalle.nombre}</span>
            </div>

            <div className={styles.fila}>
              <strong>Fecha y hora</strong>
              <span>
                {formatearFechaHora(detalle.fechaHora)}
              </span>
            </div>

            <div className={styles.fila}>
              <strong>Estado de membresía</strong>
              <span>{nombreEstado(detalle.estado)}</span>
            </div>

            <div className={styles.fila}>
              <strong>Tipo de ingreso</strong>
              <span>
                {detalle.confirmacionEspecial
                  ? "Confirmación especial"
                  : "Ingreso normal"}
              </span>
            </div>

            <div className={styles.fila}>
              <strong>Responsable</strong>
              <span>{detalle.responsable}</span>
            </div>

            <div className={styles.acciones}>
              <button
                type="button"
                className={styles.botonPrincipal}
                onClick={() => setDetalle(null)}
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

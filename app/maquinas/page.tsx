"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Estado = "DISPONIBLE" | "EN_MANTENIMIENTO" | "FUERA_SERVICIO";

interface Maquina {
  id: number;
  nombre: string;
  codigo: string;
  ubicacion: string;
  estado: Estado;
  descripcion: string;
  observacion: string;
}

const maquinasEjemplo: Maquina[] = [
  {
    id: 1,
    nombre: "Caminadora",
    codigo: "MAQ-001",
    ubicacion: "Área de cardio",
    estado: "DISPONIBLE",
    descripcion: "Equipo para caminar y correr.",
    observacion: "Disponible para uso de miembros.",
  },
  {
    id: 2,
    nombre: "Bicicleta estática",
    codigo: "MAQ-002",
    ubicacion: "Área de cardio",
    estado: "EN_MANTENIMIENTO",
    descripcion: "Equipo para entrenamiento cardiovascular.",
    observacion: "Revisión de resistencia y pedales.",
  },
  {
    id: 3,
    nombre: "Prensa de piernas",
    codigo: "MAQ-003",
    ubicacion: "Área de musculación",
    estado: "FUERA_SERVICIO",
    descripcion: "Equipo para entrenamiento de piernas.",
    observacion: "Falla en el sistema de carga.",
  },
  {
    id: 4,
    nombre: "Máquina de poleas",
    codigo: "MAQ-004",
    ubicacion: "Área de musculación",
    estado: "DISPONIBLE",
    descripcion: "Equipo para ejercicios de fuerza.",
    observacion: "Disponible para uso de miembros.",
  },
  {
    id: 5,
    nombre: "Elíptica",
    codigo: "MAQ-005",
    ubicacion: "Área de cardio",
    estado: "DISPONIBLE",
    descripcion: "Equipo cardiovascular de bajo impacto.",
    observacion: "Disponible para uso de miembros.",
  },
  {
    id: 6,
    nombre: "Máquina de remo",
    codigo: "MAQ-006",
    ubicacion: "Área de cardio",
    estado: "EN_MANTENIMIENTO",
    descripcion: "Equipo para entrenamiento de remo.",
    observacion: "Revisión del sistema de resistencia.",
  },
];

function nombreEstado(estado: Estado): string {
  switch (estado) {
    case "DISPONIBLE":
      return "Disponible";
    case "EN_MANTENIMIENTO":
      return "En mantenimiento";
    case "FUERA_SERVICIO":
      return "Fuera de servicio";
  }
}

export default function MaquinasPage() {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [ubicacion, setUbicacion] = useState("TODAS");
  const [maquinaSeleccionada, setMaquinaSeleccionada] =
    useState<Maquina | null>(null);

  const ubicaciones = [
    ...new Set(maquinasEjemplo.map((maquina) => maquina.ubicacion)),
  ];

  const maquinasFiltradas = useMemo(() => {
    return maquinasEjemplo.filter((maquina) => {
      const texto = busqueda.trim().toLowerCase();

      const coincideBusqueda =
        maquina.nombre.toLowerCase().includes(texto) ||
        maquina.codigo.toLowerCase().includes(texto);

      const coincideEstado =
        estado === "TODOS" || maquina.estado === estado;

      const coincideUbicacion =
        ubicacion === "TODAS" || maquina.ubicacion === ubicacion;

      return (
        coincideBusqueda && coincideEstado && coincideUbicacion
      );
    });
  }, [busqueda, estado, ubicacion]);

  const disponibles = maquinasEjemplo.filter(
    (maquina) => maquina.estado === "DISPONIBLE"
  ).length;

  const mantenimiento = maquinasEjemplo.filter(
    (maquina) => maquina.estado === "EN_MANTENIMIENTO"
  ).length;

  const fueraServicio = maquinasEjemplo.filter(
    (maquina) => maquina.estado === "FUERA_SERVICIO"
  ).length;

  function limpiarFiltros() {
    setBusqueda("");
    setEstado("TODOS");
    setUbicacion("TODAS");
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
  <Link className={styles.menuItem} href="/">
    Inicio
  </Link>

  <Link className={styles.menuItem} href="/mi-membresia">
    Membresías
  </Link>

  <Link className={styles.menuItem} href="/clases">
    Clases y reservas
  </Link>

  <Link className={styles.menuItem} href="/entrenadores">
    Entrenadores
  </Link>

  <Link className={styles.menuItem} href="/pagos">
    Pagos
  </Link>

  <Link className={styles.menuActivo} href="/maquinas" aria-current="page">
    Máquinas
  </Link>

  <Link className={styles.menuItem} href="/notificaciones">
    Notificaciones
  </Link>

  <Link className={styles.menuItem} href="/reportes">
    Reportes
  </Link>
</nav>

        </aside>

        <main className={styles.contenido}>
          <div className={styles.tituloSeccion}>
            <h2>Disponibilidad de máquinas</h2>
            <span className={styles.etiqueta}>Prototipo</span>
          </div>

          <section className={styles.resumen}>
            <div className={styles.resumenItem}>
              <span>Total de máquinas</span>
              <strong>{maquinasEjemplo.length}</strong>
            </div>
            <div className={styles.resumenItem}>
              <span>Disponibles</span>
              <strong className={styles.verde}>{disponibles}</strong>
            </div>
            <div className={styles.resumenItem}>
              <span>En mantenimiento</span>
              <strong className={styles.amarillo}>{mantenimiento}</strong>
            </div>
            <div className={styles.resumenItem}>
              <span>Fuera de servicio</span>
              <strong className={styles.rojo}>{fueraServicio}</strong>
            </div>
          </section>

          <section className={styles.tarjeta}>
            <h3>Consulta de máquinas</h3>

            <div className={styles.filtros}>
              <div className={styles.campo}>
                <label htmlFor="busqueda">Buscar máquina</label>
                <input
                  id="busqueda"
                  type="search"
                  placeholder="Nombre o código"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <div className={styles.campo}>
                <label htmlFor="estado">Estado</label>
                <select
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <option value="TODOS">Todos los estados</option>
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="EN_MANTENIMIENTO">
                    En mantenimiento
                  </option>
                  <option value="FUERA_SERVICIO">
                    Fuera de servicio
                  </option>
                </select>
              </div>

              <div className={styles.campo}>
                <label htmlFor="ubicacion">Ubicación</label>
                <select
                  id="ubicacion"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                >
                  <option value="TODAS">Todas las áreas</option>
                  {ubicaciones.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className={styles.botonLimpiar}
                onClick={limpiarFiltros}
              >
                Limpiar
              </button>
            </div>
          </section>

          <div className={styles.resultados}>
            <h3>Máquinas del gimnasio</h3>
            <span>
              {maquinasFiltradas.length} resultado(s)
            </span>
          </div>

          <section className={styles.cuadricula}>
            {maquinasFiltradas.map((maquina) => (
              <article className={styles.tarjetaMaquina} key={maquina.id}>
                <div className={styles.iconoMaquina} aria-hidden="true">
                  <svg
                    viewBox="0 0 64 64"
                    width="54"
                    height="54"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="18" y="15" width="28" height="30" rx="3" />
                    <path d="M25 24h14M25 31h14M15 49h34M22 45v4M42 45v4" />
                    <path d="M12 20h6M46 20h6" />
                  </svg>
                </div>

                <h4>{maquina.nombre}</h4>
                <p className={styles.codigo}>{maquina.codigo}</p>
                <p className={styles.ubicacion}>{maquina.ubicacion}</p>

                <span
                  className={
                    maquina.estado === "DISPONIBLE"
                      ? styles.disponible
                      : maquina.estado === "EN_MANTENIMIENTO"
                        ? styles.enMantenimiento
                        : styles.fueraServicio
                  }
                >
                  {nombreEstado(maquina.estado)}
                </span>

                <button
                  type="button"
                  className={styles.botonDetalles}
                  onClick={() => setMaquinaSeleccionada(maquina)}
                >
                  Ver detalles
                </button>
              </article>
            ))}
          </section>

          {maquinasFiltradas.length === 0 && (
            <div className={styles.sinResultados}>
              <h3>No se encontraron máquinas</h3>
              <p>Prueba con otros filtros de búsqueda.</p>
              <button type="button" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            </div>
          )}

          <p className={styles.nota}>
            PROTOTIPO VISUAL · Disponibilidad con datos temporales.
          </p>
        </main>
      </div>

      {maquinaSeleccionada && (
        <div
          className={styles.modalFondo}
          onClick={() => setMaquinaSeleccionada(null)}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloDetalleMaquina"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalCabecera}>
              <h3 id="tituloDetalleMaquina">
                Detalle de máquina
              </h3>
              <button
                type="button"
                aria-label="Cerrar detalles"
                onClick={() => setMaquinaSeleccionada(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.detalleFila}>
              <strong>Máquina</strong>
              <span>{maquinaSeleccionada.nombre}</span>
            </div>

            <div className={styles.detalleFila}>
              <strong>Código</strong>
              <span>{maquinaSeleccionada.codigo}</span>
            </div>

            <div className={styles.detalleFila}>
              <strong>Ubicación</strong>
              <span>{maquinaSeleccionada.ubicacion}</span>
            </div>

            <div className={styles.detalleFila}>
              <strong>Estado</strong>
              <span>{nombreEstado(maquinaSeleccionada.estado)}</span>
            </div>

            <div className={styles.detalleFila}>
              <strong>Descripción</strong>
              <span>{maquinaSeleccionada.descripcion}</span>
            </div>

            <div className={styles.detalleFila}>
              <strong>Observaciones</strong>
              <span>{maquinaSeleccionada.observacion}</span>
            </div>

            <div className={styles.modalAcciones}>
              <button
                type="button"
                className={styles.botonCerrar}
                onClick={() => setMaquinaSeleccionada(null)}
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

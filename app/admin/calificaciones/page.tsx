"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Agrupacion = "class" | "trainer";
type Orden = "asc" | "desc";
type Caso = "normal" | "vacio" | "error" | "denegado";

interface Promedio {
  entityId: string;
  name: string;
  reviewCount: number;
  averageRating: number | null;
}

const TAMANO_PAGINA = 10;

const MENSAJE_SERVIDOR = "No se pudo cargar los promedios. Reintenta";
const MENSAJE_DENEGADO = "No tienes permiso para acceder";
const MENSAJE_VACIO = "Aún no hay calificaciones registradas";
const MENSAJE_SIN_RESULTADOS = "No hay resultados para este filtro";

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

const porClase: Promedio[] = [
  { entityId: "c-1", name: "Funcional", reviewCount: 48, averageRating: 4.6 },
  { entityId: "c-2", name: "Spinning", reviewCount: 62, averageRating: 4.4 },
  { entityId: "c-3", name: "HIIT grupal", reviewCount: 35, averageRating: 4.8 },
  { entityId: "c-4", name: "Movilidad", reviewCount: 21, averageRating: 3.9 },
  { entityId: "c-5", name: "Yoga", reviewCount: 40, averageRating: 4.7 },
  { entityId: "c-6", name: "Pilates", reviewCount: 28, averageRating: 4.2 },
  { entityId: "c-7", name: "Zumba", reviewCount: 33, averageRating: 4.5 },
  { entityId: "c-8", name: "Boxeo funcional", reviewCount: 17, averageRating: 3.6 },
  { entityId: "c-9", name: "Stretching", reviewCount: 12, averageRating: 4.1 },
  { entityId: "c-10", name: "CrossFit", reviewCount: 9, averageRating: 4.9 },
  { entityId: "c-11", name: "Cardio dance", reviewCount: 0, averageRating: null },
  { entityId: "c-12", name: "Aqua fit", reviewCount: 0, averageRating: null },
];

const porEntrenador: Promedio[] = [
  { entityId: "t-1", name: "Laura Hernández", reviewCount: 72, averageRating: 4.7 },
  { entityId: "t-2", name: "Diego Ramírez", reviewCount: 65, averageRating: 4.3 },
  { entityId: "t-3", name: "Roberto Alvarado", reviewCount: 38, averageRating: 4.5 },
  { entityId: "t-4", name: "Marta Flores", reviewCount: 24, averageRating: 3.8 },
  { entityId: "t-5", name: "Andrés Cruz", reviewCount: 15, averageRating: 4.9 },
  { entityId: "t-6", name: "Paola Mejía", reviewCount: 30, averageRating: 4.1 },
  { entityId: "t-7", name: "Kevin Salazar", reviewCount: 0, averageRating: null },
];

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function ordenarPromedios(lista: Promedio[], orden: Orden): Promedio[] {
  return [...lista].sort((a, b) => {
    if (a.averageRating === null && b.averageRating === null) {
      return a.name.localeCompare(b.name);
    }
    if (a.averageRating === null) return 1;
    if (b.averageRating === null) return -1;
    const diferencia =
      orden === "asc"
        ? a.averageRating - b.averageRating
        : b.averageRating - a.averageRating;
    return diferencia !== 0 ? diferencia : a.name.localeCompare(b.name);
  });
}

export default function PromediosCalificacionesPage() {
  const [caso, setCaso] = useState<Caso | null>(null);
  const [agrupacion, setAgrupacion] = useState<Agrupacion>("class");
  const [datos, setDatos] = useState<Promedio[] | null>(null);
  const [fallo, setFallo] = useState(false);
  const [orden, setOrden] = useState<Orden>("desc");
  const [texto, setTexto] = useState("");
  const [filtro, setFiltro] = useState("");
  const [pagina, setPagina] = useState(1);

  function cargar(destino: Agrupacion, casoActual: Caso) {
    setDatos(null);
    setFallo(false);

    setTimeout(() => {
      if (casoActual === "error") {
        setFallo(true);
        return;
      }
      if (casoActual === "vacio") {
        setDatos([]);
        return;
      }
      setDatos(destino === "class" ? porClase : porEntrenador);
    }, 500);
  }

  useEffect(() => {
    const temporizador = setTimeout(() => {
      const parametro = new URLSearchParams(window.location.search).get("caso");
      const detectado = (
        ["vacio", "error", "denegado"].includes(parametro ?? "")
          ? parametro
          : "normal"
      ) as Caso;
      setCaso(detectado);
      if (detectado !== "denegado") cargar("class", detectado);
    }, 0);

    return () => clearTimeout(temporizador);
  }, []);

  function cambiarPestana(destino: Agrupacion) {
    if (destino === agrupacion || !caso) return;
    setAgrupacion(destino);
    setTexto("");
    setFiltro("");
    setPagina(1);
    cargar(destino, caso);
  }

  function aplicarFiltros(e: React.FormEvent) {
    e.preventDefault();
    setFiltro(texto);
    setPagina(1);
  }

  function alternarOrden() {
    setOrden((actual) => (actual === "desc" ? "asc" : "desc"));
    setPagina(1);
  }

  function reintentar() {
    if (caso) cargar(agrupacion, caso === "error" ? "normal" : caso);
  }

  const filtrados = ordenarPromedios(
    (datos ?? []).filter((p) =>
      normalizar(p.name).includes(normalizar(filtro))
    ),
    orden
  );
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice(
    (paginaActual - 1) * TAMANO_PAGINA,
    paginaActual * TAMANO_PAGINA
  );
  const etiquetaEntidad = agrupacion === "class" ? "Clase" : "Entrenador";
  const cargando = caso === null || (caso !== "denegado" && datos === null && !fallo);

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
            <h2>Promedios de calificaciones</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          <section className={styles.tarjeta}>
            {caso === "denegado" ? (
              <p role="alert" className={styles.error}>
                {MENSAJE_DENEGADO}
              </p>
            ) : (
              <>
                <h3>Consulta y filtros</h3>

                <div className={styles.pestanas} role="tablist" aria-label="Agrupación">
                  <button
                    type="button"
                    role="tab"
                    id="pestana-class"
                    aria-selected={agrupacion === "class"}
                    aria-controls="panel-promedios"
                    className={
                      agrupacion === "class" ? styles.pestanaActiva : styles.pestana
                    }
                    onClick={() => cambiarPestana("class")}
                  >
                    Por clase
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="pestana-trainer"
                    aria-selected={agrupacion === "trainer"}
                    aria-controls="panel-promedios"
                    className={
                      agrupacion === "trainer" ? styles.pestanaActiva : styles.pestana
                    }
                    onClick={() => cambiarPestana("trainer")}
                  >
                    Por entrenador
                  </button>
                </div>

                <form className={styles.filtros} onSubmit={aplicarFiltros}>
                  <label htmlFor="busqueda" className={styles.soloLectores}>
                    Buscar por nombre
                  </label>
                  <input
                    id="busqueda"
                    type="search"
                    value={texto}
                    placeholder="Buscar por nombre..."
                    onChange={(e) => setTexto(e.target.value)}
                  />
                  <button type="submit" className={styles.guardar} disabled={cargando}>
                    Aplicar filtros
                  </button>
                </form>

                <div
                  id="panel-promedios"
                  role="tabpanel"
                  aria-labelledby={`pestana-${agrupacion}`}
                >
                  {cargando ? (
                    <p role="status" className={styles.estado}>
                      Cargando promedios...
                    </p>
                  ) : fallo ? (
                    <div className={styles.bloqueError}>
                      <p role="alert" className={styles.error}>
                        {MENSAJE_SERVIDOR}
                      </p>
                      <button
                        type="button"
                        className={styles.secundario}
                        onClick={reintentar}
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : (datos ?? []).length === 0 ? (
                    <p role="status" className={styles.estado}>
                      {MENSAJE_VACIO}
                    </p>
                  ) : filtrados.length === 0 ? (
                    <p role="status" className={styles.estado}>
                      {MENSAJE_SIN_RESULTADOS}
                    </p>
                  ) : (
                    <>
                      <div className={styles.tablaContenedor}>
                        <table className={styles.tabla}>
                          <thead>
                            <tr>
                              <th>{etiquetaEntidad}</th>
                              <th>Número de reseñas</th>
                              <th
                                aria-sort={
                                  orden === "asc" ? "ascending" : "descending"
                                }
                              >
                                <button
                                  type="button"
                                  className={styles.ordenar}
                                  onClick={alternarOrden}
                                >
                                  Promedio
                                  <span aria-hidden="true">
                                    {orden === "asc" ? " ▲" : " ▼"}
                                  </span>
                                  <span className={styles.soloLectores}>
                                    {orden === "asc"
                                      ? ", orden ascendente"
                                      : ", orden descendente"}
                                  </span>
                                </button>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibles.map((fila) => (
                              <tr key={fila.entityId}>
                                <td className={styles.destacado}>{fila.name}</td>
                                <td>{fila.reviewCount}</td>
                                <td>
                                  {fila.averageRating === null ? (
                                    <span className={styles.sinCalificaciones}>
                                      Sin calificaciones
                                    </span>
                                  ) : (
                                    <span className={styles.promedio}>
                                      <span aria-hidden="true">★</span>{" "}
                                      {fila.averageRating.toFixed(1)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className={styles.pie}>
                        <span>
                          Mostrando {visibles.length} de {filtrados.length}{" "}
                          {filtrados.length === 1 ? "registro" : "registros"}
                        </span>
                        {totalPaginas > 1 && (
                          <nav
                            className={styles.paginacion}
                            aria-label="Paginación de promedios"
                          >
                            <button
                              type="button"
                              className={styles.pagina}
                              disabled={paginaActual === 1}
                              onClick={() => setPagina(paginaActual - 1)}
                              aria-label="Página anterior"
                            >
                              ‹
                            </button>
                            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                              (n) => (
                                <button
                                  type="button"
                                  key={n}
                                  className={
                                    n === paginaActual
                                      ? styles.paginaActiva
                                      : styles.pagina
                                  }
                                  aria-current={n === paginaActual ? "page" : undefined}
                                  onClick={() => setPagina(n)}
                                >
                                  {n}
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              className={styles.pagina}
                              disabled={paginaActual === totalPaginas}
                              onClick={() => setPagina(paginaActual + 1)}
                              aria-label="Página siguiente"
                            >
                              ›
                            </button>
                          </nav>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

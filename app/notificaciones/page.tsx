"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Modulo = "MEMBRESIAS" | "RESERVAS" | "SESIONES_PERSONALES" | "PAGOS";
type EstadoNotificacion = "NO_LEIDA" | "LEIDA";
type Caso = "normal" | "vacio" | "error" | "denegado";

interface Notificacion {
  id: string;
  title: string;
  message: string;
  originModule: Modulo;
  status: EstadoNotificacion;
  createdAt: string;
  readAt?: string;
}

interface AlmacenNotificaciones {
  notificaciones: Notificacion[];
}

const CLAVE_NOTIFICACIONES = "gkds_notificaciones_prototipo";
const TAMANO_PAGINA = 20;
const MS_CARGA = 450;

const MENSAJE_VACIO = "No tienes notificaciones";
const MENSAJE_SERVIDOR = "No se pudieron cargar las notificaciones.";
const MENSAJE_DENEGADO = "No tienes permiso para acceder";
const MENSAJE_MARCAR = "No se pudo marcar la notificación como leída";

const modulos: { valor: Modulo; nombre: string }[] = [
  { valor: "MEMBRESIAS", nombre: "Membresías" },
  { valor: "RESERVAS", nombre: "Reservas" },
  { valor: "SESIONES_PERSONALES", nombre: "Sesiones personales" },
  { valor: "PAGOS", nombre: "Pagos" },
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

function mostrarFechaHora(iso: string): string {
  const f = new Date(iso);
  return `${dosDigitos(f.getDate())}/${dosDigitos(f.getMonth() + 1)}/${f.getFullYear()} ${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`;
}

function nombreModulo(modulo: Modulo): string {
  return modulos.find((m) => m.valor === modulo)?.nombre ?? modulo;
}

function crearAlmacenInicial(ahora: Date): AlmacenNotificaciones {
  const hace = (horas: number) =>
    new Date(ahora.getTime() - horas * 3600000).toISOString();
  const plantillas: [string, string, Modulo, boolean][] = [
    ["Tu membresía vence pronto", "Tu plan Mensual Premium vence el 22/11/2026. Renuévalo para no perder el acceso.", "MEMBRESIAS", false],
    ["Clase cancelada", "La clase Spinning del 17/11/2026 a las 18:00 fue cancelada. Motivo: Entrenador no disponible", "RESERVAS", false],
    ["Reserva confirmada", "Tu reserva en la clase Funcional del 18/11/2026 a las 07:00 quedó confirmada.", "RESERVAS", false],
    ["Pago registrado", "Registramos tu pago de $25.00. Comprobante C-000002.", "PAGOS", false],
    ["Sesión personal confirmada", "Tu sesión personal con Laura Hernández del 19/11/2026 a las 16:00 quedó confirmada.", "SESIONES_PERSONALES", false],
    ["Reserva cancelada", "Cancelaste tu reserva en la clase Spinning del 12/11/2026 a las 07:00. El cupo fue liberado.", "RESERVAS", true],
    ["Reserva confirmada", "Tu reserva en la clase HIIT grupal del 13/11/2026 a las 18:00 quedó confirmada.", "RESERVAS", true],
    ["Tu membresía vence pronto", "Tu plan Plan de clases (8 sesiones) vence el 10/11/2026. Renuévalo para no perder el acceso.", "MEMBRESIAS", true],
    ["Pago registrado", "Registramos tu pago de $8.50. Comprobante C-000001.", "PAGOS", true],
    ["Clase cancelada", "La clase Yoga del 08/11/2026 a las 09:00 fue cancelada.", "RESERVAS", true],
  ];

  const lista: Notificacion[] = [];
  for (let i = 0; i < 25; i++) {
    const [title, message, originModule, leida] = plantillas[i % plantillas.length];
    const creada = hace(2 + i * 9);
    lista.push({
      id: `not-${i + 1}`,
      title,
      message,
      originModule,
      status: i < 5 ? "NO_LEIDA" : leida || i >= 10 ? "LEIDA" : "NO_LEIDA",
      createdAt: creada,
      readAt: undefined,
    });
  }

  return { notificaciones: lista };
}

function leerAlmacen(): AlmacenNotificaciones | null {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_NOTIFICACIONES);
    return crudo ? (JSON.parse(crudo) as AlmacenNotificaciones) : null;
  } catch {
    return null;
  }
}

function guardarAlmacen(almacen: AlmacenNotificaciones) {
  window.sessionStorage.setItem(CLAVE_NOTIFICACIONES, JSON.stringify(almacen));
}

function contarNoLeidas(almacen: AlmacenNotificaciones): number {
  return almacen.notificaciones.filter((n) => n.status === "NO_LEIDA").length;
}

function consultar(
  almacen: AlmacenNotificaciones,
  modulo: string,
  soloNoLeidas: boolean
): Notificacion[] {
  return almacen.notificaciones
    .filter((n) => (modulo === "todos" ? true : n.originModule === modulo))
    .filter((n) => (soloNoLeidas ? n.status === "NO_LEIDA" : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export default function MisNotificacionesPage() {
  const [caso, setCaso] = useState<Caso | null>(null);
  const [lista, setLista] = useState<Notificacion[] | null>(null);
  const [noLeidas, setNoLeidas] = useState(0);
  const [fallo, setFallo] = useState(false);
  const [modulo, setModulo] = useState("todos");
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [marcando, setMarcando] = useState<string | null>(null);
  const [errorMarcar, setErrorMarcar] = useState("");

  function cargar(casoActual: Caso, moduloActual: string, noLeidasActual: boolean) {
    setLista(null);
    setFallo(false);
    setErrorMarcar("");

    setTimeout(() => {
      if (casoActual === "error") {
        setFallo(true);
        return;
      }

      let datos = leerAlmacen();
      if (!datos) {
        datos = casoActual === "vacio"
          ? { notificaciones: [] }
          : crearAlmacenInicial(new Date());
        try {
          guardarAlmacen(datos);
        } catch {}
      }

      setNoLeidas(contarNoLeidas(datos));
      setLista(consultar(datos, moduloActual, noLeidasActual));
      setPagina(1);
    }, MS_CARGA);
  }

  useEffect(() => {
    const temporizador = setTimeout(() => {
      const parametro = new URLSearchParams(window.location.search).get("caso");
      const detectado = (
        ["vacio", "error", "denegado"].includes(parametro ?? "") ? parametro : "normal"
      ) as Caso;
      setCaso(detectado);
      if (detectado !== "denegado") cargar(detectado, "todos", false);
    }, 0);

    return () => clearTimeout(temporizador);
  }, []);

  function aplicarFiltros(e: React.FormEvent) {
    e.preventDefault();
    if (caso) cargar(caso, modulo, soloNoLeidas);
  }

  function reintentar() {
    cargar("normal", modulo, soloNoLeidas);
  }

  async function marcarLeida(id: string) {
    if (marcando) return;

    setMarcando(id);
    setErrorMarcar("");

    try {
      await new Promise((resolver) => setTimeout(resolver, 400));

      const actual = leerAlmacen();
      if (!actual) throw new Error("Sin datos");

      const objetivo = actual.notificaciones.find((n) => n.id === id);
      if (!objetivo) throw new Error("No encontrada");

      const ahora = new Date().toISOString();
      const siguiente: AlmacenNotificaciones = {
        notificaciones: actual.notificaciones.map((n) =>
          n.id === id && n.status === "NO_LEIDA"
            ? { ...n, status: "LEIDA" as const, readAt: ahora }
            : n
        ),
      };

      guardarAlmacen(siguiente);
      setNoLeidas(contarNoLeidas(siguiente));
      setLista((anterior) =>
        anterior
          ? anterior.map((n) =>
              n.id === id && n.status === "NO_LEIDA"
                ? { ...n, status: "LEIDA" as const, readAt: ahora }
                : n
            )
          : anterior
      );
    } catch {
      setErrorMarcar(MENSAJE_MARCAR);
    } finally {
      setMarcando(null);
    }
  }

  const cargando = caso === null || (caso !== "denegado" && lista === null && !fallo);
  const total = lista?.length ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = (lista ?? []).slice(
    (paginaActual - 1) * TAMANO_PAGINA,
    paginaActual * TAMANO_PAGINA
  );

  return (
    <div className={styles.contenedor}>
      <header className={styles.encabezado}>
        <h1>
          GKDS <span>FITNESS</span>
        </h1>
        <Link
          href="/notificaciones"
          className={styles.campana}
          aria-label={
            noLeidas > 0
              ? `Notificaciones, ${noLeidas} sin leer`
              : "Notificaciones, sin pendientes"
          }
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path
              d="M12 3a6 6 0 0 0-6 6v3.6l-1.7 3.4a1 1 0 0 0 .9 1.5h13.6a1 1 0 0 0 .9-1.5L18 12.6V9a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0z"
              fill="currentColor"
            />
          </svg>
          {noLeidas > 0 && (
            <span className={styles.contador} aria-hidden="true">
              {noLeidas > 99 ? "99+" : noLeidas}
            </span>
          )}
        </Link>
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
                  opcion.nombre === "Notificaciones"
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
            <h2>Mis notificaciones</h2>
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

                <form className={styles.filtros} onSubmit={aplicarFiltros}>
                  <div className={styles.campo}>
                    <label htmlFor="module">Módulo de origen</label>
                    <select
                      id="module"
                      value={modulo}
                      onChange={(e) => setModulo(e.target.value)}
                    >
                      <option value="todos">Todos</option>
                      {modulos.map((m) => (
                        <option key={m.valor} value={m.valor}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className={styles.casilla} htmlFor="unread">
                    <input
                      id="unread"
                      type="checkbox"
                      checked={soloNoLeidas}
                      onChange={(e) => setSoloNoLeidas(e.target.checked)}
                    />
                    Solo no leídas
                  </label>

                  <button type="submit" className={styles.guardar} disabled={cargando}>
                    Aplicar filtros
                  </button>
                </form>

                {errorMarcar && (
                  <p role="alert" className={styles.errorMarcar}>
                    {errorMarcar}
                  </p>
                )}

                {cargando ? (
                  <p role="status" className={styles.estado}>
                    Cargando notificaciones...
                  </p>
                ) : fallo ? (
                  <div className={styles.bloqueError}>
                    <p role="alert" className={styles.error}>
                      {MENSAJE_SERVIDOR}
                    </p>
                    <button type="button" className={styles.secundario} onClick={reintentar}>
                      Reintentar
                    </button>
                  </div>
                ) : total === 0 ? (
                  <p role="status" className={styles.estado}>
                    {MENSAJE_VACIO}
                  </p>
                ) : (
                  <>
                    <div className={styles.tablaContenedor}>
                      <table className={styles.tabla}>
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Título</th>
                            <th>Mensaje</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibles.map((n) => (
                            <tr
                              key={n.id}
                              className={n.status === "NO_LEIDA" ? styles.filaNueva : undefined}
                            >
                              <td>{nombreModulo(n.originModule)}</td>
                              <td className={styles.destacado}>{n.title}</td>
                              <td className={styles.mensaje}>{n.message}</td>
                              <td className={styles.fecha}>{mostrarFechaHora(n.createdAt)}</td>
                              <td>
                                {n.status === "NO_LEIDA" ? (
                                  <span className={styles.nueva}>Nueva</span>
                                ) : (
                                  <span className={styles.leida}>Leída</span>
                                )}
                              </td>
                              <td>
                                {n.status === "NO_LEIDA" && (
                                  <button
                                    type="button"
                                    className={styles.marcar}
                                    onClick={() => marcarLeida(n.id)}
                                    disabled={marcando !== null}
                                  >
                                    {marcando === n.id ? "Marcando..." : "Marcar como leída"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className={styles.pie}>
                      <span>
                        Mostrando {visibles.length} de {total}{" "}
                        {total === 1 ? "notificación" : "notificaciones"}
                      </span>
                      {totalPaginas > 1 && (
                        <nav
                          className={styles.paginacion}
                          aria-label="Paginación de notificaciones"
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
                          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                            <button
                              type="button"
                              key={n}
                              className={n === paginaActual ? styles.paginaActiva : styles.pagina}
                              aria-current={n === paginaActual ? "page" : undefined}
                              onClick={() => setPagina(n)}
                            >
                              {n}
                            </button>
                          ))}
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
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

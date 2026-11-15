"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

type EstadoReserva = "CONFIRMADA" | "CANCELADA" | "CANCELADA_POR_GIMNASIO";
type Asistencia = "PENDIENTE" | "ASISTIO" | "NO_ASISTIO";
type EstadoSesion = "PROGRAMADA" | "EN_CURSO" | "COMPLETADA" | "CANCELADA";

type Inscrito = {
  id: string;
  nombre: string;
  numeroMiembro: string;
  reserva: EstadoReserva;
  asistencia: Asistencia;
};

type Sesion = {
  id: string;
  clase: string;
  entrenador: string;
  sala: string;
  inicio: string;
  fin: string;
  cupoMaximo: number;
  estado: EstadoSesion;
  inscritos: Inscrito[];
  cerradaEn?: string;
};

const TAMANO_PAGINA = 10;
const CLAVE = "gkds_h8_asistencia_prototipo";
const NOMBRES = [
  "Ana Martínez", "Carlos López", "Daniela Rivera", "Diego Hernández",
  "Elena Flores", "Gabriel Torres", "Isabel Ramírez", "Javier Castro",
  "Karla Méndez", "Luis González", "María Pérez", "Natalia Rodríguez",
  "Oscar Molina", "Paola Reyes", "Rafael Romero",
];

function formatoFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-SV", { timeZone: "America/El_Salvador", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}
function formatoHora(iso: string): string {
  return new Intl.DateTimeFormat("es-SV", { timeZone: "America/El_Salvador", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}
function fechaRelativa(dias: number, hora: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, 0, 0, 0);
  return d.toISOString();
}
function sesionDePrueba(id: string): Sesion {
  // IDs de prueba: 'h8-en-curso' permite registrar; 'h8-futura' es solo lectura;
  // 'h8-completada' demuestra el bloqueo al cerrar la lista.
  const futura = id === "h8-futura";
  const completada = id === "h8-completada";
  const inicio = futura ? fechaRelativa(1, 9) : fechaRelativa(-1, 9);
  const fin = futura ? fechaRelativa(1, 10) : fechaRelativa(-1, 10);
  return {
    id,
    clase: "Funcional",
    entrenador: "Laura Hernández",
    sala: "Sala funcional",
    inicio,
    fin,
    cupoMaximo: 20,
    estado: futura ? "PROGRAMADA" : completada ? "COMPLETADA" : "EN_CURSO",
    inscritos: NOMBRES.map((nombre, index) => ({
      id: `res-${index + 1}`,
      nombre,
      numeroMiembro: `GKDS-${String(index + 1).padStart(4, "0")}`,
      reserva: index === 13 ? "CANCELADA" : index === 14 ? "CANCELADA_POR_GIMNASIO" : "CONFIRMADA",
      asistencia: completada && index < 13 ? (index % 3 === 0 ? "NO_ASISTIO" : "ASISTIO") : "PENDIENTE",
    })),
  };
}
function leerSesion(id: string): Sesion | null {
  try {
    const data = window.sessionStorage.getItem(`${CLAVE}:${id}`);
    if (!data) return null;
    const parsed = JSON.parse(data) as Sesion;
    return parsed.id === id && Array.isArray(parsed.inscritos) ? parsed : null;
  } catch {
    return null;
  }
}
function persistirSesion(sesion: Sesion): void {
  window.sessionStorage.setItem(`${CLAVE}:${sesion.id}`, JSON.stringify(sesion));
}

export default function AsistenciaSesionPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [marcas, setMarcas] = useState<Record<string, Asistencia>>({});
  const [guardando, setGuardando] = useState(false);
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSesion(leerSesion(id) ?? sesionDePrueba(id));
      setCargando(false);
      setMarcas({});
      setPagina(1);
      setMensaje("");
      setError("");
    }, 350);
    return () => window.clearTimeout(t);
  }, [id]);

  const asistentes = useMemo(() => [...(sesion?.inscritos ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")), [sesion]);
  const confirmadas = asistentes.filter((a) => a.reserva === "CONFIRMADA");
  const totalPaginas = Math.max(1, Math.ceil(asistentes.length / TAMANO_PAGINA));
  const visibles = asistentes.slice((pagina - 1) * TAMANO_PAGINA, pagina * TAMANO_PAGINA);
  const iniciada = sesion ? Date.now() >= new Date(sesion.inicio).getTime() : false;
  const editable = Boolean(sesion && iniciada && sesion.estado !== "CANCELADA" && sesion.estado !== "COMPLETADA");
  const pendientes = confirmadas.filter((a) => a.asistencia === "PENDIENTE").length;
  const cambios = Object.keys(marcas).length;

  function elegirMarca(idReserva: string, valor: Asistencia) {
    if (!editable || !sesion) return;
    const anterior = sesion.inscritos.find((r) => r.id === idReserva);
    if (!anterior || anterior.reserva !== "CONFIRMADA") return;
    setMensaje("");
    setError("");
    setMarcas((prev) => {
      const siguiente = { ...prev };
      if (anterior.asistencia === valor) delete siguiente[idReserva];
      else siguiente[idReserva] = valor;
      return siguiente;
    });
  }

  function guardar() {
    if (!sesion || !editable) { setError("No se puede registrar asistencia en esta sesión"); return; }
    if (!cambios) { setError("Selecciona al menos una asistencia para guardar"); return; }
    setGuardando(true);
    setError("");
    window.setTimeout(() => {
      const actualizada: Sesion = {
        ...sesion,
        inscritos: sesion.inscritos.map((r) => r.reserva === "CONFIRMADA" && marcas[r.id] ? { ...r, asistencia: marcas[r.id] } : r),
      };
      try {
        persistirSesion(actualizada);
        setSesion(actualizada);
        setMarcas({});
        setMensaje("Asistencia guardada");
      } catch {
        setError("No se pudo guardar la asistencia");
      } finally {
        setGuardando(false);
      }
    }, 350);
  }

  function cerrarLista() {
    if (!sesion || !editable || Date.now() < new Date(sesion.fin).getTime()) {
      setConfirmarCierre(false);
      setError("No se puede cerrar la lista antes de finalizar la sesión");
      return;
    }
    if (cambios) {
      setConfirmarCierre(false);
      setError("Guarda primero las asistencias pendientes de confirmar");
      return;
    }
    const actualizada: Sesion = {
      ...sesion,
      estado: "COMPLETADA",
      cerradaEn: new Date().toISOString(),
      inscritos: sesion.inscritos.map((r) => r.reserva === "CONFIRMADA" && r.asistencia === "PENDIENTE" ? { ...r, asistencia: "NO_ASISTIO" } : r),
    };
    try {
      persistirSesion(actualizada);
      setSesion(actualizada);
      setMarcas({});
      setConfirmarCierre(false);
      setError("");
      setMensaje("Sesión completada");
    } catch {
      setConfirmarCierre(false);
      setError("No se pudo cerrar la lista");
    }
  }

  return (
    <div className={styles.contenedor}>
      <header className={styles.encabezado}><h1>GKDS <span>FITNESS</span></h1></header>
      <div className={styles.estructura}>
        <aside className={styles.sidebar}>
          <p className={styles.menuTitulo}>MENÚ PRINCIPAL</p>
          <nav className={styles.navegacion} aria-label="Menú principal">
            <Link href="/" className={styles.menuItem}>Inicio</Link>
            <Link href="/entrenador/agenda" className={styles.menuActivo}>Agenda</Link>
            <Link href="/entrenador/disponibilidad" className={styles.menuItem}>Mi disponibilidad</Link>
            <Link href="/entrenador/rutinas" className={styles.menuItem}>Rutinas</Link>
          </nav>
        </aside>
        <main className={styles.contenido}>
          <div className={styles.tituloSeccion}><h2>Registro de asistencia</h2><span className={styles.etiqueta}>PROTOTIPO</span></div>
          <section className={styles.tarjeta}>
            <div className={styles.tarjetaEncabezado}><h3>Inscritos en la sesión</h3><Link href="/entrenador/agenda" className={styles.enlace}>Volver a agenda</Link></div>
            {cargando || !sesion ? <p className={styles.estadoVacio} role="status">Cargando asistentes...</p> : <>
              <div className={styles.detalles}>
                <div><span>Clase</span><strong>{sesion.clase}</strong></div>
                <div><span>Fecha</span><strong>{formatoFecha(sesion.inicio)}</strong></div>
                <div><span>Horario</span><strong>{formatoHora(sesion.inicio)} – {formatoHora(sesion.fin)}</strong></div>
                <div><span>Cupo máximo</span><strong>{sesion.cupoMaximo}</strong></div>
                <div><span>Reservas confirmadas</span><strong>{confirmadas.length}</strong></div>
                <div><span>Estado de sesión</span><strong>{sesion.estado.replaceAll("_", " ")}</strong></div>
              </div>
              {!iniciada && <p role="status" className={styles.aviso}>La asistencia se habilita al iniciar la sesión</p>}
              {sesion.estado === "COMPLETADA" && <p role="status" className={styles.aviso}>Esta sesión está completada. La asistencia es de solo lectura.</p>}
              {sesion.estado === "CANCELADA" && <p role="status" className={styles.error}>No se puede registrar asistencia en esta sesión</p>}
              {mensaje && <p role="status" className={styles.exito}>{mensaje}</p>}
              {error && <p role="alert" className={styles.error}>{error}</p>}
              {asistentes.length === 0 ? <p className={styles.estadoVacio}>No hay miembros inscritos</p> : <>
                <div className={styles.tablaContenedor}>
                  <table className={styles.tabla}>
                    <thead><tr><th>Miembro</th><th>Número</th><th>Reserva</th><th>Asistencia</th></tr></thead>
                    <tbody>{visibles.map((r) => {
                      const permitida = editable && r.reserva === "CONFIRMADA" && !guardando;
                      const valor = marcas[r.id] ?? r.asistencia;
                      return <tr key={r.id}>
                        <td className={styles.nombre}>{r.nombre}</td><td>{r.numeroMiembro}</td>
                        <td><span className={`${styles.insignia} ${r.reserva === "CONFIRMADA" ? styles.confirmada : styles.cancelada}`}>{r.reserva.replaceAll("_", " ")}</span></td>
                        <td>{r.reserva !== "CONFIRMADA" ? <span className={styles.noAplica}>No aplica</span> :
                          <div className={styles.controles}>
                            <button type="button" disabled={!permitida} className={`${styles.opcion} ${valor === "ASISTIO" ? styles.opcionElegida : ""}`} onClick={() => elegirMarca(r.id, "ASISTIO")}>Asistió</button>
                            <button type="button" disabled={!permitida} className={`${styles.opcion} ${valor === "NO_ASISTIO" ? styles.opcionAusente : ""}`} onClick={() => elegirMarca(r.id, "NO_ASISTIO")}>No asistió</button>
                            {valor === "PENDIENTE" && <small>Pendiente</small>}
                          </div>}
                        </td>
                      </tr>;
                    })}</tbody>
                  </table>
                </div>
                <div className={styles.paginacion}><span>{asistentes.length} miembros · Página {pagina} de {totalPaginas}</span><div className={styles.paginacionBotones}>
                  <button type="button" className={styles.pagina} disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
                  <button type="button" className={styles.pagina} disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
                </div></div>
              </>}
              <div className={styles.acciones}>
                <span>{pendientes} asistencias pendientes · {cambios} cambios sin guardar</span>
                <div><button type="button" className={styles.botonGuardar} disabled={!editable || !cambios || guardando} onClick={guardar}>{guardando ? "Guardando..." : "Guardar asistencia"}</button>
                <button type="button" className={styles.botonCerrar} disabled={!editable || guardando} onClick={() => { setError(""); setConfirmarCierre(true); }}>Cerrar lista</button></div>
              </div>
              
            </>}
          </section>
        </main>
      </div>
      {confirmarCierre && sesion && <div className={styles.modalFondo} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmarCierre(false); }}>
        <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-cierre">
          <h3 id="titulo-cierre">Cerrar lista de asistencia</h3>
          <p>¿Deseas cerrar la lista de <strong>{sesion.clase}</strong>? Las reservas confirmadas que sigan pendientes se registrarán como <strong>No asistió</strong>.</p>
          <p className={styles.avisoModal}>Una sesión completada no admite cambios posteriores.</p>
          <div className={styles.modalBotones}>
            <button type="button" className={styles.botonVolver} onClick={() => setConfirmarCierre(false)}>Volver</button>
            <button type="button" className={styles.botonConfirmar} onClick={cerrarLista}>Sí, cerrar lista</button>
          </div>
        </section>
      </div>}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type TipoSesion = "CLASE_GRUPAL" | "SESION_PERSONAL";
type SesionElegible = {
  id: string;
  nombre: string;
  entrenador: string;
  fecha: string;
  hora: string;
  tipo: TipoSesion;
  estado: "COMPLETADA";
  asistencia: "ASISTIO";
};
type Calificacion = { sessionId: string; rating: number; comment: string; createdAt: string };

const STORAGE_KEY = "gkds_h29_calificaciones_prototipo";
const SESIONES_PRUEBA: SesionElegible[] = [
  { id: "h29-clase-001", nombre: "Entrenamiento funcional", entrenador: "Laura Hernández", fecha: "2026-11-12", hora: "09:00", tipo: "CLASE_GRUPAL", estado: "COMPLETADA", asistencia: "ASISTIO" },
  { id: "h29-personal-002", nombre: "Sesión personal de fuerza", entrenador: "Diego Ramírez", fecha: "2026-11-10", hora: "16:00", tipo: "SESION_PERSONAL", estado: "COMPLETADA", asistencia: "ASISTIO" },
  { id: "h29-clase-003", nombre: "Spinning", entrenador: "Laura Hernández", fecha: "2026-11-07", hora: "07:30", tipo: "CLASE_GRUPAL", estado: "COMPLETADA", asistencia: "ASISTIO" },
];

function fechaVisible(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function leerCalificaciones(): Calificacion[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Calificacion => {
      if (!item || typeof item !== "object") return false;
      const dato = item as Partial<Calificacion>;
      return typeof dato.sessionId === "string" && typeof dato.rating === "number" && dato.rating >= 1 && dato.rating <= 5 && typeof dato.comment === "string";
    });
  } catch {
    return [];
  }
}

export default function CalificarSesionesPage() {
  const [calificaciones, setCalificaciones] = useState<Calificacion[] | null>(null);
  const [seleccion, setSeleccion] = useState<SesionElegible | null>(null);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState<"PENDIENTES" | "TODAS">("PENDIENTES");

  useEffect(() => {
    setCalificaciones(leerCalificaciones());
  }, []);

  const calificadas = useMemo(() => new Set((calificaciones ?? []).map((c) => c.sessionId)), [calificaciones]);
  const pendientes = SESIONES_PRUEBA.filter((s) => !calificadas.has(s.id));
  const sesiones = filtro === "PENDIENTES" ? pendientes : SESIONES_PRUEBA;

  function abrir(sesion: SesionElegible) {
    if (calificadas.has(sesion.id)) return;
    setSeleccion(sesion);
    setEstrellas(0);
    setComentario("");
    setError("");
    setExito("");
  }
  function cerrar() {
    if (guardando) return;
    setSeleccion(null);
    setError("");
  }
  function guardar() {
    if (!seleccion || guardando) return;
    if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
      setError("Selecciona una calificación de 1 a 5 estrellas.");
      return;
    }
    if (comentario.length > 500) {
      setError("El comentario no puede superar 500 caracteres.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const actuales = leerCalificaciones();
      if (actuales.some((c) => c.sessionId === seleccion.id)) {
        setCalificaciones(actuales);
        setError("Esta sesión ya fue calificada y no puede volver a calificarse.");
        return;
      }
      const siguientes: Calificacion[] = [...actuales, {
        sessionId: seleccion.id,
        rating: estrellas,
        comment: comentario.trim(),
        createdAt: new Date().toISOString(),
      }];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(siguientes));
      setCalificaciones(siguientes);
      setSeleccion(null);
      setExito("Calificación registrada");
    } catch {
      setError("No se pudo guardar la calificación. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}><Link href="/">GKDS <span>FITNESS</span></Link></header>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <p>MENÚ PRINCIPAL</p>
          <nav aria-label="Menú principal">
            <Link href="/">Inicio</Link>
            <Link href="/mi-membresia">Mi membresía</Link>
            <Link href="/clases">Clases y reservas</Link>
            <Link href="/mis-sesiones">Mis sesiones</Link>
            <Link className={styles.active} href="/mis-sesiones/calificar" aria-current="page">Calificar sesiones</Link>
            <Link href="/entrenadores">Entrenadores</Link>
            <Link href="/mi-progreso">Mi progreso</Link>
          </nav>
        </aside>
        <main className={styles.main}>
          <div className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>TU EXPERIENCIA IMPORTA</p>
              <h1>Calificar mis sesiones</h1>
              <p>Comparte tu experiencia después de participar en una clase o entrenamiento personal.</p>
            </div>
            <span className={styles.prototype}>PROTOTIPO</span>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summary}><span>Pendientes por calificar</span><strong>{calificaciones === null ? "—" : pendientes.length}</strong><small>Sesiones completadas con asistencia</small></div>
            <div className={`${styles.summary} ${styles.summaryPrimary}`}><span>Calificaciones enviadas</span><strong>{calificaciones === null ? "—" : SESIONES_PRUEBA.length - pendientes.length}</strong><small>Ya registradas en este prototipo</small></div>
          </div>

          <section className={styles.card}>
            <div className={styles.cardTitle}>
              <div><h2>Mis sesiones evaluables</h2><p>Solo puedes calificar sesiones completadas a las que asististe.</p></div>
              <label className={styles.filterLabel}>Mostrar
                <select value={filtro} onChange={(e) => setFiltro(e.target.value as "PENDIENTES" | "TODAS")}>
                  <option value="PENDIENTES">Pendientes de calificar</option>
                  <option value="TODAS">Todas las sesiones</option>
                </select>
              </label>
            </div>
            {exito && <p className={styles.success} role="status">✓ {exito}</p>}
            {calificaciones === null ? <p className={styles.empty} role="status">Cargando sesiones...</p> : sesiones.length === 0 ? (
              <div className={styles.emptyState}><div className={styles.emptyIcon} aria-hidden="true">★</div><h3>No tienes sesiones pendientes de calificar</h3><p>Cuando completes una sesión y registres asistencia, aparecerá aquí.</p></div>
            ) : (
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>Sesión</th><th>Entrenador</th><th>Fecha y hora</th><th>Asistencia</th><th>Estado</th><th>Acción</th></tr></thead>
                  <tbody>{sesiones.map((sesion) => {
                    const yaCalificada = calificadas.has(sesion.id);
                    return <tr key={sesion.id}>
                      <td><strong className={styles.name}>{sesion.nombre}</strong><span className={styles.subtle}>{sesion.tipo === "CLASE_GRUPAL" ? "Clase grupal" : "Sesión personal"}</span></td>
                      <td>{sesion.entrenador}</td>
                      <td>{fechaVisible(sesion.fecha)}<span className={styles.subtle}>{sesion.hora}</span></td>
                      <td><span className={styles.attended}>ASISTIÓ</span></td>
                      <td><span className={styles.completed}>COMPLETADA</span></td>
                      <td>{yaCalificada ? <span className={styles.rated}>✓ Calificada</span> : <button className={styles.primary} type="button" onClick={() => abrir(sesion)}>Calificar</button>}</td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {seleccion && (
        <div className={styles.modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description">
            <div className={styles.modalHead}>
              <div><p className={styles.eyebrow}>EVALÚA TU EXPERIENCIA</p><h2 id="modal-title">Calificar sesión</h2></div>
              <button className={styles.close} type="button" onClick={cerrar} disabled={guardando} aria-label="Cerrar diálogo">×</button>
            </div>
            <p id="modal-description" className={styles.modalDescription}><strong>{seleccion.nombre}</strong> · {seleccion.entrenador}<span>{fechaVisible(seleccion.fecha)} a las {seleccion.hora}</span></p>
            <div className={styles.ratingBlock}>
              <p className={styles.fieldLabel}>¿Cómo calificarías esta sesión? <span>*</span></p>
              <div className={styles.stars} role="group" aria-label="Calificación de 1 a 5 estrellas">
                {[1, 2, 3, 4, 5].map((numero) => <button type="button" key={numero} aria-label={`${numero} ${numero === 1 ? "estrella" : "estrellas"}`} aria-pressed={estrellas === numero} className={numero <= estrellas ? styles.starActive : styles.star} onClick={() => { setEstrellas(numero); setError(""); }} disabled={guardando}>★</button>)}
              </div>
              <p className={styles.ratingHelper}>{estrellas ? `${estrellas} de 5 estrellas` : "Selecciona entre 1 y 5 estrellas"}</p>
            </div>
            <label className={styles.fieldLabel} htmlFor="comentario">Comentario <span className={styles.optional}>(opcional)</span></label>
            <textarea id="comentario" value={comentario} onChange={(e) => setComentario(e.target.value.slice(0, 500))} placeholder="¿Qué te gustó de la sesión?" maxLength={500} rows={4} disabled={guardando} />
            <p className={styles.counter}>{comentario.length}/500 caracteres</p>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <p className={styles.notice}>Una vez enviada, la calificación no podrá modificarse ni enviarse nuevamente.</p>
            <div className={styles.modalButtons}>
              <button className={styles.secondary} type="button" onClick={cerrar} disabled={guardando}>Volver</button>
              <button className={styles.primary} type="button" onClick={guardar} disabled={guardando || estrellas === 0}>{guardando ? "Guardando..." : "Enviar calificación"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

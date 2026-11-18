"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type EstadoSesion = "CONFIRMADA" | "CANCELADA" | "COMPLETADA";
type EstadoPago = "PENDIENTE" | "PAGADO" | "ANULADO";
type PersonalSession = {
  id: string;
  slotId?: string;
  trainerId?: string;
  trainerName: string;
  startsAt: string;
  endsAt: string;
  status: EstadoSesion;
  cancelledAt?: string;
  payment: { id?: string; concept?: string; amountUsd: number; status: EstadoPago };
};

const STORAGE_KEY = "gkds_h10_sesiones_prototipo";
const PLAZO_CANCELACION_MS = 12 * 60 * 60 * 1000;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-SV", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function readSessions(): PersonalSession[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const data: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? (data as PersonalSession[]) : [];
  } catch {
    return [];
  }
}
function puedeCancelar(sesion: PersonalSession, ahora: number): boolean {
  return sesion.status === "CONFIRMADA" &&
    new Date(sesion.startsAt).getTime() - ahora >= PLAZO_CANCELACION_MS;
}

export default function MisSesionesPage() {
  const [sessions, setSessions] = useState<PersonalSession[] | null>(null);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSessions(readSessions().sort((a, b) =>
        new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()));
      setNow(Date.now());
    }, 350);
    const clock = setInterval(() => setNow(Date.now()), 30_000);
    return () => { clearTimeout(handle); clearInterval(clock); };
  }, []);

  const totalPages = Math.max(1, Math.ceil((sessions?.length ?? 0) / 10));
  const currentPage = Math.min(page, totalPages);
  const selected = sessions?.find((s) => s.id === selectedId) ?? null;

  function cerrarDialogo() {
    if (!busy) setSelectedId(null);
  }

  function confirmarCancelacion() {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    setMessage("");

    setTimeout(() => {
      try {
        const current = readSessions();
        const target = current.find((s) => s.id === selected.id);
        if (!target) throw new Error("No fue posible cancelar la sesión");
        if (target.status !== "CONFIRMADA") throw new Error("La sesión ya no puede cancelarse");
        if (!puedeCancelar(target, Date.now())) {
          throw new Error("La sesión solo puede cancelarse hasta 12 horas antes");
        }
        const updated = current.map((s) =>
          s.id === target.id
            ? {
                ...s,
                status: "CANCELADA" as const,
                cancelledAt: new Date().toISOString(),
                payment: {
                  ...s.payment,
                  status: s.payment.status === "PENDIENTE" ? ("ANULADO" as const) : s.payment.status,
                },
              }
            : s
        );
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setSessions(updated.sort((a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()));
        setSelectedId(null);
        setMessage("Sesión cancelada");
      } catch (err) {
        setError(err instanceof Error ? err.message : "No fue posible cancelar la sesión");
        setSelectedId(null);
      } finally {
        setBusy(false);
      }
    }, 450);
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}><h1>GKDS <span>FITNESS</span></h1></header>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <p>MENÚ PRINCIPAL</p>
          <nav>
            <Link href="/">Inicio</Link>
            <Link href="/entrenadores">Entrenadores</Link>
            <Link className={styles.active} href="/mis-sesiones">Mis sesiones</Link>
            <Link href="/clases">Clases y reservas</Link>
            <Link href="/mi-membresia">Mi membresía</Link>
          </nav>
        </aside>
        <main className={styles.main}>
          <div className={styles.pageTitle}><h2>Mis sesiones personales</h2><span>PROTOTIPO</span></div>
          <section className={styles.card}>
            <div className={styles.cardTop}>
              <h3>Historial de sesiones</h3>
              <Link href="/entrenadores">Agendar nueva sesión</Link>
            </div>
            {message && <div className={styles.success} role="status">{message}</div>}
            {error && <div className={styles.error} role="alert">{error}</div>}
            {sessions === null ? (
              <p className={styles.empty}>Cargando mis sesiones...</p>
            ) : sessions.length === 0 ? (
              <p className={styles.empty}>Aún no tienes sesiones personales. <Link href="/entrenadores">Consultar entrenadores</Link></p>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table>
                    <thead><tr><th>Entrenador</th><th>Fecha</th><th>Horario</th><th>Estado</th><th>Cobro</th><th>Acción</th></tr></thead>
                    <tbody>
                      {sessions.slice((currentPage - 1) * 10, currentPage * 10).map((s) => (
                        <tr key={s.id}>
                          <td className={styles.strong}>{s.trainerName}</td>
                          <td>{formatDate(s.startsAt)}</td>
                          <td>{formatTime(s.startsAt)} – {formatTime(s.endsAt)}</td>
                          <td><span className={`${styles.pill} ${s.status === "CANCELADA" ? styles.cancelled : s.status === "COMPLETADA" ? styles.completed : ""}`}>{s.status}</span></td>
                          <td>
                            <span className={s.payment.status === "PENDIENTE" ? styles.pending : styles.paymentNeutral}>
                              {s.payment.status} · ${s.payment.amountUsd.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            {now !== null && puedeCancelar(s, now) ? (
                              <button type="button" className={styles.cancelButton} disabled={busy} onClick={() => { setSelectedId(s.id); setError(""); setMessage(""); }}>Cancelar</button>
                            ) : <span className={styles.noAction}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={styles.pagination}>
                  <span>{sessions.length} sesiones · Página {currentPage} de {totalPages}</span>
                  <div>
                    <button type="button" disabled={currentPage <= 1} onClick={() => setPage((n) => n - 1)}>Anterior</button>
                    <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((n) => n + 1)}>Siguiente</button>
                  </div>
                </div>
              </>
            )}
            <p className={styles.info}>Los datos son temporales. La cancelación y la anulación del cobro pendiente se simulan en este navegador. El backend realizará la operación real.</p>
          </section>
        </main>
      </div>
      {selected && (
        <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) cerrarDialogo(); }}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="cancel-title" aria-describedby="cancel-desc">
            <h3 id="cancel-title">Cancelar sesión personal</h3>
            <p id="cancel-desc">¿Cancelar esta sesión?</p>
            <dl>
              <div><dt>Entrenador</dt><dd>{selected.trainerName}</dd></div>
              <div><dt>Fecha</dt><dd>{formatDate(selected.startsAt)}</dd></div>
              <div><dt>Horario</dt><dd>{formatTime(selected.startsAt)} – {formatTime(selected.endsAt)}</dd></div>
            </dl>
            <p className={styles.note}>Solo puedes cancelar hasta 12 horas antes del inicio. Si el cobro está pendiente, pasará a ANULADO.</p>
            <div className={styles.dialogActions}>
              <button type="button" disabled={busy} onClick={cerrarDialogo}>Volver</button>
              <button type="button" className={styles.confirmCancel} disabled={busy} onClick={confirmarCancelacion}>{busy ? "Cancelando..." : "Sí, cancelar"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Slot = { id: string; trainerId: string; startsAt: string; endsAt: string };
type PersonalSession = { id: string; slotId: string; trainerId: string; trainerName: string; startsAt: string; endsAt: string; status: "CONFIRMADA"; payment: { id: string; amountUsd: number; concept: "SESION_PERSONAL"; status: "PENDIENTE" } };
const STORAGE_KEY = "gkds_h10_sesiones_prototipo";
const COST = 10;
const trainers = [
  { id: "ent-1", name: "Laura Hernández", specialty: "Entrenamiento funcional" },
  { id: "ent-2", name: "Diego Ramírez", specialty: "Fuerza y acondicionamiento" },
  { id: "ent-3", name: "Sofía Martínez", specialty: "Movilidad y resistencia" },
];
function formatDate(iso: string) { return new Date(iso).toLocaleDateString("es-SV", { day: "2-digit", month: "2-digit", year: "numeric" }); }
function formatTime(iso: string) { return new Date(iso).toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit", hour12: false }); }
function readSessions(): PersonalSession[] { try { const v = sessionStorage.getItem(STORAGE_KEY); return v ? JSON.parse(v) as PersonalSession[] : []; } catch { return []; } }
function makeSlots(): Slot[] {
  const result: Slot[] = [];
  for (let day = 1; day <= 15; day++) {
    for (let t = 0; t < trainers.length; t++) {
      for (const hour of [8 + t, 14 + t]) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() + day);
        start.setHours(hour);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        result.push({ id: `${trainers[t].id}-${day}-${hour}`, trainerId: trainers[t].id, startsAt: start.toISOString(), endsAt: end.toISOString() });
      }
    }
  }
  return result;
}
export default function EntrenadoresPage() {
  const [trainerId, setTrainerId] = useState(trainers[0].id);
  const [sessions, setSessions] = useState<PersonalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const slots = useMemo(() => makeSlots(), []);
  useEffect(() => { const timeout = setTimeout(() => { setSessions(readSessions()); setLoading(false); }, 350); return () => clearTimeout(timeout); }, []);
  const available = slots.filter(s => s.trainerId === trainerId && new Date(s.startsAt).getTime() > Date.now() && !sessions.some(r => r.slotId === s.id && r.status === "CONFIRMADA"));
  const totalPages = Math.max(1, Math.ceil(available.length / 6));
  const shown = available.slice((Math.min(page, totalPages) - 1) * 6, Math.min(page, totalPages) * 6);
  const trainer = trainers.find(t => t.id === trainerId)!;

  function confirmBooking() {
    if (!selected || busy) return;
    setBusy(true); setError(""); setMessage("");
    setTimeout(() => {
      try {
        const current = readSessions();
        const start = new Date(selected.startsAt).getTime();
        const end = new Date(selected.endsAt).getTime();
        if (start <= Date.now()) throw new Error("Este horario ya no está disponible.");
        if (current.some(r => r.slotId === selected.id && r.status === "CONFIRMADA"))
  throw new Error("Ya tienes una reserva para este horario.");
       if (current.some(r =>
  r.status === "CONFIRMADA" &&
  new Date(r.startsAt).getTime() < end &&
  new Date(r.endsAt).getTime() > start
)) {
  throw new Error("Ya tienes una sesión en ese horario.");
}
        const booking: PersonalSession = {
          id: `h10-${Date.now()}`, slotId: selected.id, trainerId: selected.trainerId,
          trainerName: trainers.find(t => t.id === selected.trainerId)?.name ?? "Entrenador",
          startsAt: selected.startsAt, endsAt: selected.endsAt, status: "CONFIRMADA",
          payment: { id: `pay-${Date.now()}`, amountUsd: COST, concept: "SESION_PERSONAL", status: "PENDIENTE" },
        };
        const updated = [...current, booking];
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setSessions(updated);
        setSelected(null);
        setMessage("Sesión agendada. Se generó un cobro pendiente de $10.00.");
      } catch (e) { setError(e instanceof Error ? e.message : "No fue posible agendar. Reintenta."); }
      finally { setBusy(false); }
    }, 450);
  }
  return (
    <div className={styles.layout}>
      <header className={styles.header}><h1>GKDS <span>FITNESS</span></h1></header>
      <div className={styles.body}>
        <aside className={styles.sidebar}><p>MENÚ PRINCIPAL</p><nav><Link href="/">Inicio</Link><Link className={styles.active} href="/entrenadores">Entrenadores</Link><Link href="/mis-sesiones">Mis sesiones</Link><Link href="/clases">Clases y reservas</Link><Link href="/mi-membresia">Mi membresía</Link></nav></aside>
        <main className={styles.main}>
          <div className={styles.pageTitle}><h2>Agendar sesión personal</h2><span>PROTOTIPO</span></div>
          <section className={styles.card}>
            <div className={styles.cardTop}><h3>Entrenadores y horarios disponibles</h3><Link href="/mis-sesiones">Ver mis sesiones</Link></div>
            <label className={styles.field}>Seleccionar entrenador<select value={trainerId} onChange={e => { setTrainerId(e.target.value); setPage(1); setError(""); setMessage(""); }}>
              {trainers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.specialty}</option>)}
            </select></label>
            <div className={styles.info}>Entrenador seleccionado: <strong>{trainer.name}</strong>. Costo de la sesión: <strong>$10.00 USD</strong>. Horarios disponibles para los próximos 15 días.</div>
            {message && <div className={styles.success} role="status">{message}</div>}
            {error && <div className={styles.error} role="alert">{error}</div>}
            {loading ? <p className={styles.empty}>Cargando horarios...</p> : available.length === 0 ? <p className={styles.empty}>No hay horarios disponibles para este entrenador.</p> : <>
              <div className={styles.tableWrap}><table><thead><tr><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
                {shown.map(s => <tr key={s.id}><td>{formatDate(s.startsAt)}</td><td>{formatTime(s.startsAt)}</td><td>{formatTime(s.endsAt)}</td><td><span className={styles.pill}>LIBRE</span></td><td><button className={styles.primary} onClick={() => { setSelected(s); setError(""); }} type="button">Agendar</button></td></tr>)}
              </tbody></table></div>
              <div className={styles.pagination}><span>{available.length} horarios · Página {Math.min(page,totalPages)} de {totalPages}</span><div><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</button></div></div>
            </>}
          </section>
        </main>
      </div>
      {selected && <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget && !busy) setSelected(null); }}><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title">Confirmar sesión personal</h3><p>¿Deseas reservar una sesión con <strong>{trainer.name}</strong>?</p>
        <dl><div><dt>Fecha</dt><dd>{formatDate(selected.startsAt)}</dd></div><div><dt>Horario</dt><dd>{formatTime(selected.startsAt)} – {formatTime(selected.endsAt)}</dd></div><div><dt>Monto pendiente</dt><dd>$10.00 USD</dd></div></dl>
        <p className={styles.note}>La reserva creará un cobro pendiente; no realizará un pago real.</p>
        <div className={styles.dialogActions}><button type="button" onClick={() => setSelected(null)} disabled={busy}>Volver</button><button className={styles.primary} type="button" onClick={confirmBooking} disabled={busy}>{busy ? "Procesando solicitud..." : "Confirmar"}</button></div>
      </section></div>}
    </div>
  );
}

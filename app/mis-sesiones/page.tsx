"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type PersonalSession = { id: string; trainerName: string; startsAt: string; endsAt: string; status: "CONFIRMADA"; payment: { amountUsd: number; status: "PENDIENTE" } };
const STORAGE_KEY = "gkds_h10_sesiones_prototipo";
function formatDate(iso: string) { return new Date(iso).toLocaleDateString("es-SV", { day: "2-digit", month: "2-digit", year: "numeric" }); }
function formatTime(iso: string) { return new Date(iso).toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit", hour12: false }); }
export default function MisSesionesPage() {
  const [sessions, setSessions] = useState<PersonalSession[] | null>(null);
  const [page, setPage] = useState(1);
  useEffect(() => { const handle = setTimeout(() => { try { const raw = sessionStorage.getItem(STORAGE_KEY); const data = raw ? JSON.parse(raw) as PersonalSession[] : []; setSessions(data.sort((a,b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())); } catch { setSessions([]); } }, 350); return () => clearTimeout(handle); }, []);
  const totalPages = Math.max(1, Math.ceil((sessions?.length ?? 0) / 10));
  const currentPage = Math.min(page, totalPages);
  return <div className={styles.layout}>
    <header className={styles.header}><h1>GKDS <span>FITNESS</span></h1></header>
    <div className={styles.body}>
      <aside className={styles.sidebar}><p>MENÚ PRINCIPAL</p><nav><Link href="/">Inicio</Link><Link href="/entrenadores">Entrenadores</Link><Link className={styles.active} href="/mis-sesiones">Mis sesiones</Link><Link href="/clases">Clases y reservas</Link><Link href="/mi-membresia">Mi membresía</Link></nav></aside>
      <main className={styles.main}><div className={styles.pageTitle}><h2>Mis sesiones personales</h2><span>PROTOTIPO</span></div>
        <section className={styles.card}><div className={styles.cardTop}><h3>Historial de sesiones</h3><Link href="/entrenadores">Agendar nueva sesión</Link></div>
          {sessions === null ? <p className={styles.empty}>Cargando mis sesiones...</p> : sessions.length === 0 ? <p className={styles.empty}>Aún no tienes sesiones personales agendadas. <Link href="/entrenadores">Consultar entrenadores</Link></p> : <>
            <div className={styles.tableWrap}><table><thead><tr><th>Entrenador</th><th>Fecha</th><th>Horario</th><th>Estado</th><th>Cobro</th><th>Acción</th></tr></thead><tbody>
              {sessions.slice((currentPage - 1) * 10, currentPage * 10).map(s => <tr key={s.id}><td className={styles.strong}>{s.trainerName}</td><td>{formatDate(s.startsAt)}</td><td>{formatTime(s.startsAt)} – {formatTime(s.endsAt)}</td><td><span className={styles.pill}>CONFIRMADA</span></td><td><span className={styles.pending}>PENDIENTE · ${s.payment.amountUsd.toFixed(2)}</span></td><td>—</td></tr>)}
            </tbody></table></div>
            <div className={styles.pagination}><span>{sessions.length} sesiones · Página {currentPage} de {totalPages}</span><div><button disabled={currentPage <= 1} onClick={() => setPage(n => n - 1)}>Anterior</button><button disabled={currentPage >= totalPages} onClick={() => setPage(n => n + 1)}>Siguiente</button></div></div>
          </>}
          <p className={styles.info}>Los datos son temporales. La integración con el backend permitirá consultar las sesiones y sus cobros reales.</p>
        </section>
      </main>
    </div>
  </div>;
}

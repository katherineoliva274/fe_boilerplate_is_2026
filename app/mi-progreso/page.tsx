"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { fechaVisible, leerRegistros, nombreEjercicio, numeroVisible, type Registro } from "./_lib/progreso";

const PAGINA = 10;
export default function MiProgresoPage() {
    const [registros, setRegistros] = useState<Registro[] | null>(null);
    const [pagina, setPagina] = useState(1);
    const [guardado, setGuardado] = useState(false);
    useEffect(() => {
        setRegistros(leerRegistros().sort((a, b) => b.recordDate.localeCompare(a.recordDate)));
        setGuardado(new URLSearchParams(window.location.search).get("guardado") === "1");
    }, []);
    const total = registros?.length ?? 0;
    const paginas = Math.max(1, Math.ceil(total / PAGINA));
    const paginaActual = Math.min(pagina, paginas);
    const visibles = (registros ?? []).slice((paginaActual - 1) * PAGINA, paginaActual * PAGINA);
    const inicial = registros?.length ? [...registros].sort((a, b) => a.recordDate.localeCompare(b.recordDate))[0].id : null;
    const ultimo = registros?.[0];
    return <div className={styles.layout}>
        <header className={styles.header}><h1>GKDS <span>FITNESS</span></h1></header>
        <div className={styles.body}>
            <aside className={styles.sidebar}><p>MENÚ PRINCIPAL</p><nav><Link href="/">Inicio</Link><Link href="/mi-rutina">Mi rutina</Link><Link className={styles.active} href="/mi-progreso">Mi progreso</Link><Link href="/entrenadores">Entrenadores</Link><Link href="/pagos">Pagos</Link></nav></aside>
            <main className={styles.main}>
                <div className={styles.titleRow}><div><p className={styles.eyebrow}>SEGUIMIENTO PERSONAL</p><h2>Mi progreso físico</h2><p>Registra tus mediciones y revisa cómo has evolucionado.</p></div><span className={styles.tag}>PROTOTIPO</span></div>
                <div className={styles.summaryGrid}>
                    <div className={styles.summary}><span>Registros realizados</span><strong>{total}</strong><small>En tu historial</small></div>
                    <div className={styles.summary}><span>Último peso</span><strong>{ultimo ? `${ultimo.weightKg.toFixed(2)} kg` : "—"}</strong><small>{ultimo ? fechaVisible(ultimo.recordDate) : "Sin registros"}</small></div>
                    <div className={styles.summary}><span>Marcas registradas</span><strong>{(registros ?? []).reduce((s, r) => s + r.marks.length, 0)}</strong><small>Marcas de ejercicios</small></div>
                </div>
                <section className={styles.card}>
                    <div className={styles.cardHeading}><div><h3>Historial de progreso</h3><p>Ordenado desde el registro más reciente.</p></div><Link href="/mi-progreso/nuevo" className={styles.primary}>+ Nuevo registro</Link></div>
                    {guardado && <div className={styles.success} role="status">Progreso guardado</div>}
                    {registros === null ? <div className={styles.empty}>Cargando historial...</div> : registros.length === 0 ? <div className={styles.empty}><div className={styles.emptyIcon}>↗</div><h4>Aún no has registrado tu progreso</h4><p>Comienza con tu peso, medidas o marcas de ejercicios.</p><Link className={styles.primary} href="/mi-progreso/nuevo">Registrar mi progreso</Link></div> : <>
                        <div className={styles.tableWrap}><table><thead><tr><th>Fecha</th><th>Peso</th><th>Cintura</th><th>Pecho</th><th>Brazo</th><th>Marcas</th><th>Acción</th></tr></thead><tbody>
                            {visibles.map(r => <tr key={r.id}><td><strong>{fechaVisible(r.recordDate)}</strong>{r.id === inicial && <span className={styles.startBadge}>Punto de partida</span>}</td><td>{r.weightKg.toFixed(2)} kg</td><td>{numeroVisible(r.waistCm)}{r.waistCm !== null ? " cm" : ""}</td><td>{numeroVisible(r.chestCm)}{r.chestCm !== null ? " cm" : ""}</td><td>{numeroVisible(r.armCm)}{r.armCm !== null ? " cm" : ""}</td><td>{r.marks.length ? <details className={styles.marksDetail}><summary>{r.marks.length} {r.marks.length === 1 ? "marca" : "marcas"}</summary><ul>{r.marks.map((m, i) => <li key={i}>{nombreEjercicio(m.exerciseId)} · {m.weightKg.toFixed(2)} kg · {m.reps} reps</li>)}</ul></details> : "—"}</td><td><Link href={`/mi-progreso/${r.id}/editar`} className={styles.editLink}>Editar</Link></td></tr>)}
                        </tbody></table></div>
                        <div className={styles.pagination}><span>{total} {total === 1 ? "registro" : "registros"} · Página {paginaActual} de {paginas}</span><div><button type="button" disabled={paginaActual <= 1} onClick={() => setPagina(p => p - 1)}>Anterior</button><button type="button" disabled={paginaActual >= paginas} onClick={() => setPagina(p => p + 1)}>Siguiente</button></div></div>
                    </>}
                </section>
            </main>
        </div>
    </div>;
}

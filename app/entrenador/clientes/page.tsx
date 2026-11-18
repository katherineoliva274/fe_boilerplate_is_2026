"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Cliente = { id: string; numero: string; nombre: string; objetivo: string; desde: string; estado: "ACTIVA" };
const CLIENTES: Cliente[] = [
  { id: "m001", numero: "GKDS-0001", nombre: "Ana Martínez", objetivo: "Resistencia y movilidad", desde: "2026-08-10", estado: "ACTIVA" },
  { id: "m002", numero: "GKDS-0002", nombre: "Carlos López", objetivo: "Ganar masa muscular", desde: "2026-07-15", estado: "ACTIVA" },
  { id: "m003", numero: "GKDS-0003", nombre: "Daniela Rivera", objetivo: "Fuerza general", desde: "2026-09-02", estado: "ACTIVA" },
  { id: "m004", numero: "GKDS-0004", nombre: "Eduardo Pérez", objetivo: "Acondicionamiento", desde: "2026-07-22", estado: "ACTIVA" },
  { id: "m005", numero: "GKDS-0005", nombre: "Fernanda Gómez", objetivo: "Ganancia de fuerza", desde: "2026-06-17", estado: "ACTIVA" },
  { id: "m006", numero: "GKDS-0006", nombre: "Gabriel Hernández", objetivo: "Mejorar técnica", desde: "2026-09-18", estado: "ACTIVA" },
  { id: "m007", numero: "GKDS-0007", nombre: "Isabel Cruz", objetivo: "Movilidad", desde: "2026-10-05", estado: "ACTIVA" },
  { id: "m008", numero: "GKDS-0008", nombre: "Javier Molina", objetivo: "Resistencia", desde: "2026-08-24", estado: "ACTIVA" },
  { id: "m009", numero: "GKDS-0009", nombre: "Karen Vásquez", objetivo: "Fuerza y coordinación", desde: "2026-10-12", estado: "ACTIVA" },
  { id: "m010", numero: "GKDS-0010", nombre: "Luis Romero", objetivo: "Hipertrofia", desde: "2026-09-01", estado: "ACTIVA" },
  { id: "m011", numero: "GKDS-0011", nombre: "María Flores", objetivo: "Acondicionamiento", desde: "2026-08-01", estado: "ACTIVA" },
  { id: "m012", numero: "GKDS-0012", nombre: "Óscar Castillo", objetivo: "Fuerza funcional", desde: "2026-10-20", estado: "ACTIVA" },
];
const PAGINA = 10;
const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

export default function ClientesPage() {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return CLIENTES.filter((c) => c.estado === "ACTIVA" && (normalizar(c.nombre).includes(q) || normalizar(c.numero).includes(q)))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [busqueda]);
  const paginas = Math.max(1, Math.ceil(filtrados.length / PAGINA));
  const actual = Math.min(pagina, paginas);
  const visibles = filtrados.slice((actual - 1) * PAGINA, actual * PAGINA);

  return (
    <div className={styles.layout}>
      <header className={styles.header}><Link href="/">GKDS <span>FITNESS</span></Link></header>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <p>MENÚ PRINCIPAL</p>
          <nav aria-label="Menú del entrenador">
            <Link href="/">Inicio</Link><Link href="/entrenador/agenda">Agenda</Link>
            <Link href="/entrenador/disponibilidad">Mi disponibilidad</Link>
            <Link href="/entrenador/rutinas">Rutinas</Link>
            <Link className={styles.activo} href="/entrenador/clientes" aria-current="page">Mis clientes</Link>
          </nav>
        </aside>
        <main className={styles.main}>
          <div className={styles.titleRow}><div><p className={styles.eyebrow}>SEGUIMIENTO DE ENTRENAMIENTO</p><h1>Mis clientes</h1><p>Consulta el progreso y las rutinas de tus miembros asignados.</p></div><span className={styles.tag}>PROTOTIPO</span></div>
          <div className={styles.stats}>
            <div className={styles.stat}><span>Asignaciones activas</span><strong>{CLIENTES.length}</strong><small>Miembros a tu cargo</small></div>
            <div className={`${styles.stat} ${styles.featured}`}><span>Coincidencias</span><strong>{filtrados.length}</strong><small>Con los filtros actuales</small></div>
          </div>
          <section className={styles.card}>
            <div className={styles.cardHeader}><div><h2>Miembros asignados</h2><p>Ordenados alfabéticamente por nombre.</p></div></div>
            <label className={styles.filterLabel} htmlFor="buscar">Buscar por nombre o número de miembro</label>
            <div className={styles.filters}>
              <input id="buscar" maxLength={100} placeholder="Ej. Ana o GKDS-0001" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1); setCargando(false); }} />
              <button type="button" onClick={() => { setBusqueda(""); setPagina(1); }} className={styles.secondary}>Limpiar</button>
            </div>
            {cargando ? <p className={styles.empty}>Cargando clientes...</p> : filtrados.length === 0 ? <p role="status" className={styles.empty}>No tienes miembros asignados</p> : (
              <>
                <div className={styles.tableWrap}><table><thead><tr><th>Miembro</th><th>Número</th><th>Objetivo</th><th>Asignación</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
                  {visibles.map((c) => <tr key={c.id}><td className={styles.name}>{c.nombre}</td><td>{c.numero}</td><td>{c.objetivo}</td><td>{c.desde.split("-").reverse().join("/")}</td><td><span className={styles.pill}>ACTIVA</span></td><td><Link className={styles.action} href={`/entrenador/clientes/${c.id}/progreso`}>Ver progreso</Link></td></tr>)}
                </tbody></table></div>
                <div className={styles.pagination}><span>{filtrados.length} miembros · Página {actual} de {paginas}</span><div><button disabled={actual === 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button><button disabled={actual === paginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button></div></div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

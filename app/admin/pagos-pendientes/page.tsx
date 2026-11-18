"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Concepto = "MEMBRESIA" | "SESION_ADICIONAL" | "SESION_PERSONAL";
type FiltroConcepto = Concepto | "TODOS";
type FiltroAtraso = "TODOS" | "SIN_ATRASO" | "1_30" | "31_60" | "MAS_60";

type PagoPendiente = {
  id: string;
  memberNumber: string;
  memberName: string;
  concept: Concepto;
  amountUsd: number;
  dueDate: string; // YYYY-MM-DD
};

const LIMITE = 20;
const CONCEPTOS: Record<Concepto, string> = {
  MEMBRESIA: "Membresía",
  SESION_ADICIONAL: "Sesión adicional",
  SESION_PERSONAL: "Sesión personal",
};

const menu = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Membresías", ruta: "/admin/membresias" },
  { nombre: "Clases y reservas", ruta: "/admin/clases" },
  { nombre: "Ingresos", ruta: "/admin/ingresos" },
  { nombre: "Pagos pendientes", ruta: "/admin/pagos-pendientes" },
  { nombre: "Cobros", ruta: "/recepcion/cobros" },
  { nombre: "Reportes", ruta: "/admin/reportes" },
];

// La fecha se interpreta a medianoche local para evitar desfases por zona horaria.
function fechaLocal(fecha: Date): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/El_Salvador", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(fecha);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

function diasEntre(hoy: string, vencimiento: string): number {
  const ms = Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${vencimiento}T00:00:00Z`);
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function fechaDesplazada(hoy: string, desplazamiento: number): string {
  const date = new Date(`${hoy}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + desplazamiento);
  return date.toISOString().slice(0, 10);
}

function fechaBonita(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

function dinero(monto: number): string { return `$${monto.toFixed(2)}`; }

function crearDatosEjemplo(hoy: string): PagoPendiente[] {
  const nombres = [
    "Ana Martínez", "Carlos López", "Daniela Rivera", "Miguel Hernández",
    "Sofía Ramírez", "José Pérez", "María González", "Roberto Aguilar",
    "Fernanda Cruz", "Gabriel Torres", "Lucía Morales", "Kevin Romero",
    "Andrea Flores", "Oscar Mejía", "Valeria Chávez", "Luis Fuentes",
    "Paola Castillo", "Daniel Molina", "Karla Sánchez", "Mario Delgado",
    "Nicole Reyes", "Juan Herrera", "Carmen Rivas", "Samuel Pineda",
    "Elena Escobar", "Ricardo Solís", "Rosa Alvarado", "Diego Martínez",
  ];
  const diferencias = [-98, -83, -68, -61, -53, -45, -36, -31, -27, -22, -19, -14, -12, -9, -7, -5, -3, -2, -1, 0, 1, 2, 4, 7, 9, 12, 15, 25];
  return nombres.map((nombre, i) => {
    const concept: Concepto = i % 3 === 0 ? "MEMBRESIA" : i % 3 === 1 ? "SESION_PERSONAL" : "SESION_ADICIONAL";
    return {
      id: `pend-${i + 1}`,
      memberNumber: `GKDS-${String(i + 1).padStart(4, "0")}`,
      memberName: nombre,
      concept,
      amountUsd: concept === "MEMBRESIA" ? 35 : concept === "SESION_PERSONAL" ? 10 : 8.5,
      dueDate: fechaDesplazada(hoy, diferencias[i]),
    };
  });
}

function coincideAtraso(dias: number, filtro: FiltroAtraso): boolean {
  switch (filtro) {
    case "SIN_ATRASO": return dias === 0;
    case "1_30": return dias >= 1 && dias <= 30;
    case "31_60": return dias >= 31 && dias <= 60;
    case "MAS_60": return dias > 60;
    default: return true;
  }
}

export default function PagosPendientesPage() {
  const [hoy, setHoy] = useState("");
  const [pagos, setPagos] = useState<PagoPendiente[] | null>(null);
  const [concepto, setConcepto] = useState<FiltroConcepto>("TODOS");
  const [atraso, setAtraso] = useState<FiltroAtraso>("TODOS");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    const actual = fechaLocal(new Date());
    const timer = window.setTimeout(() => {
      setHoy(actual);
      setPagos(crearDatosEjemplo(actual));
    }, 350);
    return () => window.clearTimeout(timer);
  }, []);

  const filtrados = useMemo(() => {
    if (!pagos || !hoy) return [];
    return pagos.filter((p) => {
      const dias = diasEntre(hoy, p.dueDate);
      return (concepto === "TODOS" || p.concept === concepto) && coincideAtraso(dias, atraso);
    }).sort((a, b) => diasEntre(hoy, b.dueDate) - diasEntre(hoy, a.dueDate) || a.memberName.localeCompare(b.memberName, "es"));
  }, [pagos, concepto, atraso, hoy]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / LIMITE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * LIMITE, paginaActual * LIMITE);
  const totalAdeudado = filtrados.reduce((suma, pago) => suma + pago.amountUsd, 0);
  const pagosAtrasados = filtrados.filter((pago) => diasEntre(hoy, pago.dueDate) > 0).length;
  const mayorAtraso = filtrados.length ? Math.max(...filtrados.map((p) => diasEntre(hoy, p.dueDate))) : 0;

  function cambiarConcepto(valor: FiltroConcepto) { setConcepto(valor); setPagina(1); }
  function cambiarAtraso(valor: FiltroAtraso) { setAtraso(valor); setPagina(1); }
  function limpiar() { setConcepto("TODOS"); setAtraso("TODOS"); setPagina(1); }

  return (
    <div className={styles.layout}>
      <header className={styles.header}><h1>GKDS <span>FITNESS</span></h1></header>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <p>MENÚ PRINCIPAL</p>
          <nav>{menu.map((item) => <Link key={item.ruta} href={item.ruta} className={item.ruta === "/admin/pagos-pendientes" ? styles.active : undefined}>{item.nombre}</Link>)}</nav>
        </aside>
        <main className={styles.main}>
          <div className={styles.pageTitle}>
            <div><p className={styles.eyebrow}>ADMINISTRACIÓN / PAGOS</p><h2>Consulta de pagos pendientes</h2><p className={styles.subtitle}>Control de cobros, vencimientos y atrasos de los miembros.</p></div>
            <span className={styles.prototype}>PROTOTIPO</span>
          </div>

          <div className={styles.metrics}>
            <article className={styles.metric}><span>Pagos pendientes</span><strong>{pagos === null ? "—" : filtrados.length}</strong><small>Según los filtros aplicados</small></article>
            <article className={styles.metric}><span>Monto pendiente</span><strong>{pagos === null ? "—" : dinero(totalAdeudado)}</strong><small>Total por cobrar</small></article>
            <article className={styles.metric}><span>Cobros atrasados</span><strong>{pagos === null ? "—" : pagosAtrasados}</strong><small>Con al menos 1 día de atraso</small></article>
            <article className={styles.metric}><span>Mayor atraso</span><strong>{pagos === null ? "—" : `${mayorAtraso} días`}</strong><small>Entre los pagos encontrados</small></article>
          </div>

          <section className={styles.card}>
            <div className={styles.cardTitle}><div><h3>Pagos por cobrar</h3><p>Filtra por concepto y tiempo de atraso.</p></div><span className={styles.count}>{filtrados.length} registros</span></div>
            <div className={styles.filters}>
              <label className={styles.field}>Concepto
                <select value={concepto} onChange={(e) => cambiarConcepto(e.target.value as FiltroConcepto)}>
                  <option value="TODOS">Todos los conceptos</option>
                  <option value="MEMBRESIA">Membresía</option>
                  <option value="SESION_ADICIONAL">Sesión adicional</option>
                  <option value="SESION_PERSONAL">Sesión personal</option>
                </select>
              </label>
              <label className={styles.field}>Días de atraso
                <select value={atraso} onChange={(e) => cambiarAtraso(e.target.value as FiltroAtraso)}>
                  <option value="TODOS">Todos los rangos</option>
                  <option value="SIN_ATRASO">Sin atraso</option>
                  <option value="1_30">1 a 30 días</option>
                  <option value="31_60">31 a 60 días</option>
                  <option value="MAS_60">Más de 60 días</option>
                </select>
              </label>
              <button type="button" className={styles.clear} onClick={limpiar}>Limpiar filtros</button>
            </div>

            {pagos === null ? (
              <div className={styles.empty} role="status">Cargando pagos pendientes...</div>
            ) : filtrados.length === 0 ? (
              <div className={styles.empty}><div className={styles.emptyIcon}>✓</div><h4>No hay pagos pendientes</h4><p>No se encontraron cobros para los filtros seleccionados.</p><button type="button" onClick={limpiar}>Restablecer filtros</button></div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table>
                    <thead><tr><th>Miembro</th><th>Número</th><th>Concepto</th><th>Monto adeudado</th><th>Vencimiento</th><th>Días de atraso</th></tr></thead>
                    <tbody>{visibles.map((pago) => {
                      const dias = diasEntre(hoy, pago.dueDate);
                      return <tr key={pago.id}>
                        <td className={styles.strong}>{pago.memberName}</td>
                        <td className={styles.muted}>{pago.memberNumber}</td>
                        <td>{CONCEPTOS[pago.concept]}</td>
                        <td className={styles.amount}>{dinero(pago.amountUsd)}</td>
                        <td>{fechaBonita(pago.dueDate)}</td>
                        <td><span className={`${styles.status} ${dias > 60 ? styles.severe : dias > 0 ? styles.late : styles.onTime}`}>{dias === 0 ? "Sin atraso" : `${dias} ${dias === 1 ? "día" : "días"}`}</span></td>
                      </tr>;
                    })}</tbody>
                  </table>
                </div>
                <div className={styles.pagination}>
                  <span>Mostrando {(paginaActual - 1) * LIMITE + 1}–{Math.min(paginaActual * LIMITE, filtrados.length)} de {filtrados.length} · Página {paginaActual} de {totalPaginas}</span>
                  <div><button type="button" disabled={paginaActual === 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button><button type="button" disabled={paginaActual === totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button></div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EJERCICIOS, fechaVisible, leerRegistros, type Registro } from "../_lib/progreso";
import styles from "./page.module.css";

type Metrica = "weightKg" | "waistCm" | "chestCm" | "armCm" | "exerciseWeightKg";
type Punto = { fecha: string; valor: number | null; reps: number | null };
const METRICAS: { value: Metrica; label: string; unit: string }[] = [
  { value: "weightKg", label: "Peso corporal", unit: "kg" },
  { value: "waistCm", label: "Cintura", unit: "cm" },
  { value: "chestCm", label: "Pecho", unit: "cm" },
  { value: "armCm", label: "Brazo", unit: "cm" },
  { value: "exerciseWeightKg", label: "Peso levantado por ejercicio", unit: "kg" },
];

function obtenerPuntos(registros: Registro[], metrica: Metrica, ejercicio: string): Punto[] {
  return [...registros].sort((a, b) => a.recordDate.localeCompare(b.recordDate))
    .map((r): Punto => {
      if (metrica === "exerciseWeightKg") {
        const marca = r.marks.find(m => m.exerciseId === ejercicio);
        return { fecha: r.recordDate, valor: marca?.weightKg ?? null, reps: marca?.reps ?? null };
      }
      return { fecha: r.recordDate, valor: r[metrica], reps: null };
    });
}

function Grafica({ puntos, unidad, tipo }: { puntos: Punto[]; unidad: string; tipo: Metrica }) {
  const ancho = 860, alto = 320, izq = 65, der = 26, arriba = 28, abajo = 64;
  const validos = puntos.filter((p): p is Punto & { valor: number } => p.valor !== null);
  if (validos.length < 2) return null;
  const valores = validos.map(p => p.valor);
  let minimo = Math.min(...valores), maximo = Math.max(...valores);
  const margen = Math.max(1, (maximo - minimo) * .16);
  minimo = Math.max(0, minimo - margen);
  maximo += margen;
  const x = (indice: number) => izq + indice * (ancho - izq - der) / Math.max(1, puntos.length - 1);
  const y = (valor: number) => arriba + (maximo - valor) * (alto - arriba - abajo) / (maximo - minimo);
  // Las medidas ausentes interrumpen la línea: no se dibujan segmentos atravesando huecos.
  const segmentos: string[] = [];
  let actual: string[] = [];
  puntos.forEach((p, indice) => {
    if (p.valor === null) {
      if (actual.length) segmentos.push(actual.join(" "));
      actual = [];
    } else {
      actual.push(`${actual.length ? "L" : "M"} ${x(indice).toFixed(1)} ${y(p.valor).toFixed(1)}`);
    }
  });
  if (actual.length) segmentos.push(actual.join(" "));
  const pasos = [0, 1, 2, 3, 4];
  const indicesFecha = Array.from(new Set([0, Math.floor((puntos.length - 1) / 2), puntos.length - 1]));

  return <div className={styles.chartScroll}>
    <svg className={styles.chart} viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={`Gráfica de evolución de ${tipo}, con ${validos.length} valores registrados`}>
      {pasos.map(n => {
        const valor = minimo + (maximo - minimo) * n / 4;
        const cy = y(valor);
        return <g key={n}><line x1={izq} x2={ancho - der} y1={cy} y2={cy} stroke="#e5ebf3" strokeDasharray="5 5" />
          <text x={izq - 12} y={cy + 4} textAnchor="end" className={styles.axis}>{valor.toFixed(1)}</text></g>;
      })}
      <text x="19" y={arriba + 4} className={styles.axisUnit}>{unidad}</text>
      {segmentos.map((d, i) => <path key={i} d={d} stroke="#0c9485" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
      {puntos.map((p, i) => p.valor === null ? null : <g key={`${p.fecha}-${i}`}>
        <circle cx={x(i)} cy={y(p.valor)} r="6" fill="#0c9485" stroke="white" strokeWidth="2.5" />
        <title>{fechaVisible(p.fecha)}: {p.valor.toFixed(2)} {unidad}{p.reps !== null ? ` · ${p.reps} repeticiones` : ""}</title>
        {tipo === "exerciseWeightKg" && <text x={x(i)} y={y(p.valor) - 16} textAnchor="middle" className={styles.pointLabel}>{p.reps} rep.</text>}
      </g>)}
      {indicesFecha.map(i => <text key={i} x={x(i)} y={alto - 28} textAnchor="middle" className={styles.axis}>{fechaVisible(puntos[i].fecha)}</text>)}
      <text x={ancho / 2} y={alto - 5} textAnchor="middle" className={styles.axisTitle}>Fecha de medición</text>
    </svg>
  </div>;
}

export default function EvolucionPage() {
  const [registros, setRegistros] = useState<Registro[] | null>(null);
  const [error, setError] = useState("");
  const [metrica, setMetrica] = useState<Metrica>("weightKg");
  const [ejercicio, setEjercicio] = useState(EJERCICIOS[0].id);

  useEffect(() => {
    try {
      setRegistros(leerRegistros());
    } catch {
      setError("No se pudo cargar la evolución");
      setRegistros([]);
    }
  }, []);

  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
  const desde = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}-${String(inicio.getDate()).padStart(2, "0")}`;
  const hasta = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const datos = useMemo(() => (registros ?? []).filter(r => r.recordDate >= desde && r.recordDate <= hasta).slice(0, 365), [registros, desde, hasta]);
  const puntos = useMemo(() => obtenerPuntos(datos, metrica, ejercicio), [datos, metrica, ejercicio]);
  const validos = puntos.filter((p): p is Punto & { valor: number } => p.valor !== null);
  const unidad = METRICAS.find(m => m.value === metrica)?.unit ?? "kg";
  const inicial = validos.length ? validos[0].valor : null;
  const ultimo = validos.length ? validos[validos.length - 1].valor : null;
  const diferencia = validos.length >= 2 && inicial !== null && ultimo !== null ? ultimo - inicial : null;
  const mensajeVacio = metrica === "exerciseWeightKg" && validos.length === 0
    ? "No hay registros para este ejercicio"
    : "Registra al menos 2 mediciones para ver tu evolución";
  const numeros = (v: number | null) => v === null ? "—" : `${v.toFixed(2)} ${unidad}`;

  return <div className={styles.layout}>
    <header className={styles.header}><h1>GKDS <span>FITNESS</span></h1></header>
    <div className={styles.body}>
      <aside className={styles.sidebar}>
        <p>MENÚ PRINCIPAL</p>
        <nav>
          <Link href="/">Inicio</Link>
          <Link href="/mi-rutina">Mi rutina</Link>
          <Link href="/mi-progreso">Mi progreso</Link>
          
          <Link className={styles.active} href="/mi-progreso/evolucion">Mi evolución</Link>
          <Link href="/entrenadores">Entrenadores</Link>
          <Link href="/pagos">Pagos</Link>
        </nav>
      </aside>
      <main className={styles.main}>
        <div className={styles.heading}>
          <div><p className={styles.eyebrow}>SEGUIMIENTO PERSONAL</p><h2>Mi evolución física</h2>
            <p>Compara tus resultados con tu punto de partida y observa tu progreso en el tiempo.</p></div>
          <Link href="/mi-progreso" className={styles.back}>Ver mis registros</Link>
        </div>
        <section className={styles.panel}>
          <div className={styles.sectionHead}><div><h3>Indicadores de evolución</h3><p>Últimos 12 meses · hasta 365 mediciones</p></div></div>
          <div className={styles.filters}>
            <label>Indicador<select value={metrica} onChange={e => setMetrica(e.target.value as Metrica)}>
              {METRICAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select></label>
            {metrica === "exerciseWeightKg" && <label>Ejercicio<select value={ejercicio} onChange={e => setEjercicio(e.target.value)}>
              {EJERCICIOS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select></label>}
          </div>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          {registros === null ? <p className={styles.empty}>Cargando evolución...</p> : <>
            <div className={styles.stats}>
              <div className={styles.stat}><span>Valor inicial</span><strong>{numeros(inicial)}</strong><small>Primer registro disponible</small></div>
              <div className={`${styles.stat} ${styles.statAccent}`}><span>Último valor</span><strong>{numeros(ultimo)}</strong><small>Medición más reciente</small></div>
              <div className={styles.stat}><span>Diferencia</span><strong>{diferencia === null ? "—" : `${diferencia > 0 ? "+" : ""}${diferencia.toFixed(2)} ${unidad}`}</strong><small>Último valor − primero</small></div>
            </div>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}><h4>{METRICAS.find(m => m.value === metrica)?.label}</h4><span>{validos.length} mediciones con datos</span></div>
              {validos.length < 2 ? <div className={styles.emptyChart}><span aria-hidden="true">◌</span><p>{mensajeVacio}</p><Link href="/mi-progreso/nuevo">Registrar medición</Link></div> : <Grafica puntos={puntos} unidad={unidad} tipo={metrica} />}
            </div>
            
          </>}
        </section>
      </main>
    </div>
  </div>;
}

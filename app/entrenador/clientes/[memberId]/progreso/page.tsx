"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { backendRequest } from "@/lib/backend-client";
import s from "./page.module.css";

type Metric = "weightKg" | "waistCm" | "chestCm" | "armCm" | "exercise";
type Mark = { exerciseId: string; weightKg: number; reps: number };
type RecordRow = { date: string; weightKg: number; waistCm: number | null; chestCm: number | null; armCm: number | null; marks: Mark[] };
type Data = { memberId: string; records: RecordRow[]; evolution: { baseline: number | null; latest: number | null; difference: number | null } };
type Member = { memberId: string; memberName: string; memberNumber: string | null };
type Exercise = { id: string; name: string };
const METRICS: { value: Metric; label: string; unit: string }[] = [
  { value: "weightKg", label: "Peso", unit: "kg" }, { value: "waistCm", label: "Cintura", unit: "cm" },
  { value: "chestCm", label: "Pecho", unit: "cm" }, { value: "armCm", label: "Brazo", unit: "cm" },
  { value: "exercise", label: "Peso por ejercicio", unit: "kg" },
];
const MINIMUM_MEASUREMENTS = "Registra al menos 2 mediciones para ver tu evolución";
const NO_EXERCISE_RECORDS = "No hay registros para este ejercicio";

export default function MemberProgress() {
  const { memberId } = useParams<{ memberId: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState("");
  const [metric, setMetric] = useState<Metric>("weightKg");
  const [exerciseId, setExerciseId] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      backendRequest<Data>(`/trainers/me/members/${memberId}/progress`),
      backendRequest<{ data: Member[] }>("/trainers/me/members?page=1&pageSize=50"),
      backendRequest<{ data: Exercise[] }>("/exercises?page=1&pageSize=50"),
    ]).then(([progress, members, catalog]) => {
      if (!active) return;
      setData(progress);
      setMember(members.data.find((item) => item.memberId === memberId) ?? null);
      setExercises(catalog.data ?? []);
    }).catch(() => {
      if (active) setError("No se pudo cargar el progreso del cliente. Verifica que siga asignado a tu cuenta.");
    });
    return () => { active = false; };
  }, [memberId]);

  const exerciseOptions = useMemo(() => {
    if (!data) return [];
    const ids = new Set(data.records.flatMap((record) => record.marks.map((mark) => mark.exerciseId)));
    return [...ids].map((id) => ({ id, name: exercises.find((exercise) => exercise.id === id)?.name ?? "Ejercicio" }));
  }, [data, exercises]);
  const selectedExerciseId = exerciseOptions.some((item) => item.id === exerciseId) ? exerciseId : exerciseOptions[0]?.id ?? "";
  const series = useMemo(() => {
    if (!data) return [];
    const records = [...data.records].sort((a, b) => a.date.localeCompare(b.date));
    if (metric === "exercise") return records.flatMap((record, recordIndex) => record.marks.filter((mark) => mark.exerciseId === selectedExerciseId).map((mark) => ({ date: record.date, value: mark.weightKg, reps: mark.reps, recordIndex })));
    return records.flatMap((record) => {
      const value = record[metric];
      return value == null ? [] : [{ date: record.date, value, reps: null, recordIndex: records.indexOf(record) }];
    });
  }, [data, metric, selectedExerciseId]);
  const selectedMetric = METRICS.find((item) => item.value === metric)!;
  const first = series[0]?.value;
  const last = series.at(-1)?.value;
  const difference = first == null || last == null ? null : last - first;
  const values = series.map((point) => point.value);
  const min = Math.min(...values), max = Math.max(...values);
  const chartPoints = series.map((point, index) => ({ ...point, x: series.length < 2 ? 400 : 44 + index * 712 / (series.length - 1), y: 168 - (max === min ? 65 : (point.value - min) / (max - min) * 130) }));
  const exerciseName = (id: string) => exercises.find((item) => item.id === id)?.name ?? "Ejercicio";
  const dateLabel = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });

  return <main className={s.page}>
    <header className={s.heading}><div><h1>Progreso de {member?.memberName ?? "cliente"}</h1><p>{member?.memberNumber ?? ""}</p></div>
      <Link className={s.primary} href={`/entrenador/rutinas?memberId=${memberId}`}>Ajustar rutina</Link></header>
    {error && <p role="alert" className={s.alert}>{error}</p>}
    {!data ? <p className={s.loading}>Cargando progreso del cliente...</p> : <>
      <section className={s.card} aria-labelledby="evolution-heading">
        <div className={s.cardHeading}><h2 id="evolution-heading">Evolución</h2><div className={s.filters}>
          <label htmlFor="metric-select">Métrica</label><select id="metric-select" value={metric} onChange={(event) => setMetric(event.target.value as Metric)}>
            {METRICS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          {metric === "exercise" && <><label htmlFor="exercise-select">Ejercicio</label><select id="exercise-select" value={selectedExerciseId} onChange={(event) => setExerciseId(event.target.value)}>
            {exerciseOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></>}
        </div></div>
        {metric === "exercise" && series.length === 0 ? <p className={s.empty}>{NO_EXERCISE_RECORDS}</p> : series.length < 2 ? <p className={s.empty}>{MINIMUM_MEASUREMENTS}</p> : <>
          <div className={s.stats} aria-label="Resumen del período">
            <div className={s.stat}><span>Inicial</span><strong>{first!.toFixed(2)} {selectedMetric.unit}</strong></div>
            <div className={s.stat}><span>Último</span><strong>{last!.toFixed(2)} {selectedMetric.unit}</strong></div>
            <div className={s.stat}><span>Diferencia</span><strong>{difference!.toFixed(2)} {selectedMetric.unit}</strong></div>
          </div>
          <div className={s.chartWrap}><svg viewBox="0 0 800 210" className={s.chart} role="img" aria-labelledby="chart-title chart-desc">
            <title id="chart-title">Evolución de {metric === "exercise" ? exerciseOptions.find((item) => item.id === selectedExerciseId)?.name ?? "peso por ejercicio" : selectedMetric.label.toLowerCase()}</title>
            <desc id="chart-desc">{chartPoints.length} mediciones representadas cronológicamente de menor a mayor fecha.</desc>
            {chartPoints.slice(1).map((point, index) => { const previous = chartPoints[index]; return point.recordIndex === previous.recordIndex + 1 ? <line key={`segment-${point.date}-${index}`} x1={previous.x} y1={previous.y} x2={point.x} y2={point.y} stroke="#087e8b" strokeWidth="3" /> : null; })}
            {chartPoints.map((point, index) => <circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} r="6" fill="#087e8b"><title>{`${dateLabel(point.date)}: ${point.value.toFixed(2)} ${selectedMetric.unit}${point.reps == null ? "" : ` · ${point.reps} repeticiones`}`}</title></circle>)}
          </svg></div>
        </>}
      </section>
      <section className={s.card}><h2>Historial físico</h2>{!data.records.length ? <p className={s.empty}>Este cliente aún no ha registrado progreso.</p> :
        <div className={s.tableWrap}><table><thead><tr><th>Fecha</th><th>Peso</th><th>Cintura</th><th>Pecho</th><th>Brazo</th><th>Marcas</th></tr></thead><tbody>
          {data.records.map((record, index) => <tr key={`${record.date}-${index}`}><td>{record.date}</td><td>{record.weightKg} kg</td><td>{record.waistCm ?? "—"}</td><td>{record.chestCm ?? "—"}</td><td>{record.armCm ?? "—"}</td><td>{record.marks.map((mark) => `${exerciseName(mark.exerciseId)}: ${mark.weightKg} kg × ${mark.reps}`).join("; ") || "—"}</td></tr>)}
        </tbody></table></div>}</section>
    </>}
  </main>;
}

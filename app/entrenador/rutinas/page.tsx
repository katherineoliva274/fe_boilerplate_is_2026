"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { backendRequest, BackendRequestError } from "@/lib/backend-client";
import styles from "../../mi-progreso/domain.module.css";

type Member = { memberId: string; memberName: string; memberNumber: string | null };
type Exercise = { id: string; name: string; muscleGroup: string };
type CurrentRoutine = {
  id: string;
  name: string;
  goal: string;
  version: number;
  startsOn: string;
  endsOn: string;
  exercises: { exerciseName: string; weekday: number; sets: number; reps: number; position: number }[];
};
type ExerciseRow = { exerciseId: string; weekday: number; sets: number; reps: number; position: number };

export default function AssignRoutine() {
  return (
    <Suspense fallback={<main className={styles.page}><p className={styles.loading}>Cargando…</p></main>}>
      <AssignRoutineForm />
    </Suspense>
  );
}

function AssignRoutineForm() {
  const searchParams = useSearchParams();
  const [memberId, setMemberId] = useState(searchParams.get("memberId") ?? "");
  const [members, setMembers] = useState<Member[]>([]);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [snapshot, setSnapshot] = useState<{ memberId: string; routine: CurrentRoutine | null } | null>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [rows, setRows] = useState<ExerciseRow[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const current = snapshot?.memberId === memberId ? snapshot.routine : null;

  useEffect(() => {
    Promise.all([
      backendRequest<{ data: Member[] }>("/trainers/me/members?page=1&pageSize=50"),
      backendRequest<{ data: Exercise[] }>("/exercises?page=1&pageSize=50"),
    ])
      .then(([memberResult, exerciseResult]) => {
        setMembers(memberResult.data);
        setCatalog(exerciseResult.data);
      })
      .catch(() => setError("No se pudieron cargar clientes o ejercicios."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!memberId) return;
    let active = true;
    backendRequest<CurrentRoutine | null>(`/trainers/me/members/${memberId}/routines/current`)
      .then((routine) => {
        if (!active) return;
        setSnapshot({ memberId, routine });
        if (routine) {
          setName(routine.name);
          setGoal(routine.goal);
          setStarts(routine.startsOn);
          setEnds(routine.endsOn);
          setRows(routine.exercises.map((exercise, index) => ({
            exerciseId: catalog.find((item) => item.name === exercise.exerciseName)?.id ?? "",
            weekday: exercise.weekday,
            sets: exercise.sets,
            reps: exercise.reps,
            position: exercise.position || index + 1,
          })));
        }
      })
      .catch(() => {
        if (!active) return;
        setSnapshot({ memberId, routine: null });
        setError("No se pudo cargar la rutina actual del cliente.");
      });
    return () => { active = false; };
  }, [memberId, catalog]);

  function updateRow(index: number, key: keyof ExerciseRow, value: number | string) {
    setRows((currentRows) => currentRows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [key]: value } : row
    )));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!memberId || !current) {
      setError("Se requiere un cliente con rutina vigente para crear una versión.");
      return;
    }
    if (name.trim().length < 3 || goal.trim().length < 3 || !starts || !ends || starts > ends || !rows.length || rows.some((row) => !row.exerciseId)) {
      setError("Completa nombre, objetivo, fechas y al menos un ejercicio válido.");
      return;
    }
    setSaving(true);
    try {
      await backendRequest(`/trainers/me/members/${memberId}/routines/versions`, {
        method: "POST",
        body: JSON.stringify({
          expectedCurrentVersion: current.version,
          name: name.trim(),
          goal: goal.trim(),
          startsOn: starts,
          endsOn: ends,
          exercises: rows,
        }),
      });
      setSuccess("Nueva versión de rutina guardada.");
      const refreshed = await backendRequest<CurrentRoutine | null>(`/trainers/me/members/${memberId}/routines/current`);
      setSnapshot({ memberId, routine: refreshed });
    } catch (cause) {
      setError(cause instanceof BackendRequestError && cause.status === 409
        ? "La rutina fue actualizada; vuelve a cargarla."
        : cause instanceof BackendRequestError && cause.status === 404
          ? "El miembro ya no tiene una asignación activa contigo."
          : cause instanceof BackendRequestError && cause.status === 400
            ? cause.message
            : cause instanceof BackendRequestError && cause.status === 403
              ? "No tienes permiso para ajustar rutinas."
              : "No se pudo guardar la rutina.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div><h1>Ajustar rutina</h1><p>Crea una versión nueva de la rutina vigente del cliente.</p></div>
      </header>
      {loading ? <p className={styles.loading}>Cargando clientes y ejercicios…</p> : (
        <section className={styles.card}>
          <label className={styles.field}>Miembro asignado
            <select value={memberId} onChange={(event) => setMemberId(event.target.value)}>
              <option value="">Selecciona cliente</option>
              {members.map((member) => <option key={member.memberId} value={member.memberId}>{member.memberName} · {member.memberNumber ?? "Sin número"}</option>)}
            </select>
          </label>
          {memberId && snapshot?.memberId !== memberId && <p className={styles.loading}>Cargando rutina actual…</p>}
          {memberId && snapshot?.memberId === memberId && !current && <p className={styles.empty}>No se encontró rutina vigente para este cliente; el versionado requiere una versión actual.</p>}
          {current && (
            <>
              <p className={styles.badge}>Versión actual {current.version}</p>
              {success && <p role="status" className={styles.success}>{success}</p>}
              {error && <p role="alert" className={styles.alert}>{error}</p>}
              <form onSubmit={submit}>
                <div className={styles.grid}>
                  <label className={styles.field}>Nombre<input minLength={3} maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} /></label>
                  <label className={styles.field}>Objetivo<textarea minLength={3} maxLength={250} required value={goal} onChange={(event) => setGoal(event.target.value)} /></label>
                  <label className={styles.field}>Inicio<input type="date" required value={starts} onChange={(event) => setStarts(event.target.value)} /></label>
                  <label className={styles.field}>Fin<input type="date" min={starts} required value={ends} onChange={(event) => setEnds(event.target.value)} /></label>
                </div>
                <h2>Ejercicios por día</h2>
                {rows.map((row, index) => (
                  <div className={styles.mark} key={`${row.position}-${index}`}>
                    <label className={styles.field}>Ejercicio<select required value={row.exerciseId} onChange={(event) => updateRow(index, "exerciseId", event.target.value)}><option value="">Selecciona</option>{catalog.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></label>
                    <label className={styles.field}>Día<select value={row.weekday} onChange={(event) => updateRow(index, "weekday", Number(event.target.value))}>{["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day, dayIndex) => <option key={day} value={dayIndex + 1}>{day}</option>)}</select></label>
                    <label className={styles.field}>Series<input type="number" min="1" max="10" value={row.sets} onChange={(event) => updateRow(index, "sets", Number(event.target.value))} /></label>
                    <label className={styles.field}>Repeticiones<input type="number" min="1" max="100" value={row.reps} onChange={(event) => updateRow(index, "reps", Number(event.target.value))} /></label>
                    <label className={styles.field}>Posición<input type="number" min="1" max="50" value={row.position} onChange={(event) => updateRow(index, "position", Number(event.target.value))} /></label>
                    <button type="button" className={styles.danger} onClick={() => setRows((currentRows) => currentRows.filter((_, rowIndex) => rowIndex !== index))}>Quitar</button>
                  </div>
                ))}
                <div className={styles.actions}>
                  <button type="button" className={styles.secondary} disabled={rows.length >= 50} onClick={() => setRows((currentRows) => [...currentRows, { exerciseId: "", weekday: 1, sets: 3, reps: 10, position: currentRows.length + 1 }])}>Agregar ejercicio</button>
                  <button disabled={saving} className={styles.primary}>{saving ? "Guardando…" : "Guardar nueva versión"}</button>
                </div>
              </form>
            </>
          )}
        </section>
      )}
    </main>
  );
}

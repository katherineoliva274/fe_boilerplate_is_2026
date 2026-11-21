"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { backendRequest } from "@/lib/backend-client";
import s from "./domain.module.css";

type RecordRow = {
  id: string;
  recordDate: string;
  weightKg: number;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  isBaseline: boolean;
  marks: { exerciseId: string; weightKg: number; reps: number }[];
};
type PageData = { data: RecordRow[]; total: number; page: number; pageSize: number };

export default function PageView() {
  return (
    <Suspense fallback={<main className={s.page}><p className={s.loading}>Cargando tu progreso…</p></main>}>
      <ProgressHistory />
    </Suspense>
  );
}

function ProgressHistory() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageData | null>(null);
  const [error, setError] = useState("");
  const search = useSearchParams();

  useEffect(() => {
    const controller = new AbortController();
    backendRequest<PageData>(`/progress-records/me?page=${page}&pageSize=10`, { signal: controller.signal })
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("No se pudo cargar tu progreso.");
      });
    return () => controller.abort();
  }, [page]);

  const pages = Math.ceil((data?.total ?? 0) / 10);

  return (
    <main className={s.page}>
      <header className={s.heading}>
        <div>
          <h1>Mi progreso físico</h1>
          <p>Registra mediciones y revisa tu historial personal.</p>
        </div>
        <div className={s.actions}>
          <Link className={s.secondary} href="/mi-progreso/evolucion">Ver evolución</Link>
          <Link className={s.primary} href="/mi-progreso/nuevo">+ Nuevo registro</Link>
        </div>
      </header>
      {search.get("guardado") === "1" && <p className={s.success}>Progreso guardado</p>}
      {error && <p className={s.alert} role="alert">{error}</p>}
      <section className={s.card}>
        <h2>Historial</h2>
        {!data ? <p className={s.loading}>Cargando historial…</p> : data.data.length === 0 ? (
          <p className={s.empty}>Aún no has registrado tu progreso</p>
        ) : (
          <>
            <div className={s.tableWrap}>
              <table>
                <thead><tr><th>Fecha</th><th>Peso</th><th>Cintura</th><th>Pecho</th><th>Brazo</th><th>Marcas</th><th>Acción</th></tr></thead>
                <tbody>{data.data.map((record) => (
                  <tr key={record.id}>
                    <td>{record.recordDate}{record.isBaseline && <><br /><span className={s.badge}>Punto de partida</span></>}</td>
                    <td>{record.weightKg} kg</td><td>{record.waistCm ?? "—"}</td><td>{record.chestCm ?? "—"}</td><td>{record.armCm ?? "—"}</td>
                    <td>{record.marks.length}</td><td><Link href={`/mi-progreso/${record.id}/editar`}>Editar</Link></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className={s.pagination}>
              <span>{data.total} registros · página {page} de {pages}</span>
              <div>
                <button className={s.secondary} disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
                <button className={s.secondary} disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente</button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

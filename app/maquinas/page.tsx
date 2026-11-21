"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { backendRequest } from "@/lib/backend-client";
import styles from "./page.module.css";

type Status = "DISPONIBLE" | "EN_MANTENIMIENTO" | "FUERA_SERVICIO";
type Machine = { id: string; name: string; type: string; location: string; status: Status; updatedAt: string };
type MachineList = { data: Machine[]; total: number; page: number; pageSize: number };
const labels: Record<Status, string> = { DISPONIBLE: "Disponible", EN_MANTENIMIENTO: "En mantenimiento", FUERA_SERVICIO: "Fuera de servicio" };

export default function MaquinasPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"" | Status>("");
  const [location, setLocation] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const params = new URLSearchParams({ page: "1", pageSize: "50" });
    if (status) params.set("status", status);
    if (location) params.set("location", location);
    try {
      const response = await backendRequest<MachineList>(`machines?${params.toString()}`);
      setMachines(response.data); setTotal(response.total);
      if (!status && !location) setLocations((previous) => previous.length ? previous : [...new Set(response.data.map((m) => m.location))].sort((a,b) => a.localeCompare(b, "es")));
    } catch { setError(true); setMachines([]); setTotal(0); }
    finally { setLoading(false); }
  }, [status, location]);

  useEffect(() => {
    // The callback starts an asynchronous request; its state updates occur after the response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  const emptyText = useMemo(() => status || location ? "No hay máquinas con esos filtros" : "No hay máquinas registradas.", [status, location]);

  return <main className={styles.page}>
    <div className={styles.heading}><div><p className={styles.eyebrow}>DISPONIBILIDAD</p><h2>Máquinas del gimnasio</h2><p className={styles.intro}>Consulta el estado actual, el tipo y la ubicación de los equipos.</p></div></div>
    <section className={styles.panel} aria-labelledby="filter-title">
      <h3 id="filter-title">Disponibilidad por ubicación y estado</h3>
      <div className={styles.filters}>
        <div className={styles.field}><label htmlFor="machine-status">Estado</label><select id="machine-status" value={status} onChange={(e) => setStatus(e.target.value as "" | Status)}><option value="">Todos los estados</option>{Object.entries(labels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        <div className={styles.field}><label htmlFor="machine-location">Ubicación</label><select id="machine-location" value={location} onChange={(e) => setLocation(e.target.value)}><option value="">Todas las ubicaciones</option>{locations.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        {(status || location) && <button className={styles.clear} type="button" onClick={() => { setStatus(""); setLocation(""); }}>Limpiar filtros</button>}
      </div>
      {loading ? <p className={styles.state} role="status">Cargando máquinas...</p> : error ? <div className={styles.state} role="alert"><p>No se pudieron cargar las máquinas</p><button className={styles.retry} onClick={() => void load()} type="button">Intentar de nuevo</button></div> : machines.length === 0 ? <p className={styles.state}>{emptyText}</p> : <>
        <p className={styles.count}>{total} {total === 1 ? "máquina" : "máquinas"}</p>
        <div className={styles.grid}>{machines.map((machine) => <article className={styles.machineCard} key={machine.id}>
          <div className={styles.machineIcon} aria-hidden="true">{machine.type.slice(0,1).toUpperCase()}</div>
          <div><h4>{machine.name}</h4><p className={styles.type}>{machine.type}</p></div>
          <p className={styles.location}><span>Ubicación</span>{machine.location}</p>
          <span className={`${styles.badge} ${machine.status === "DISPONIBLE" ? styles.available : machine.status === "EN_MANTENIMIENTO" ? styles.maintenance : styles.outOfService}`}><span className={styles.dot} aria-hidden="true" />{labels[machine.status]}</span>
        </article>)}</div>
      </>}
    </section>
  </main>;
}

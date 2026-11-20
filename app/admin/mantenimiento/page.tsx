"use client";

import { useCallback, useEffect, useState } from "react";
import { BackendRequestError, backendRequest } from "@/lib/backend-client";
import styles from "./page.module.css";

type Status = "DISPONIBLE" | "EN_MANTENIMIENTO" | "FUERA_SERVICIO";
type Machine = { id: string; name: string; type: string; location: string; status: Status; updatedAt: string };
type ListResponse<T> = { data: T[]; total: number; page: number; pageSize: number };
type Maintenance = { id: string; machineId: string; reason: string; startedAt: string; endedAt: string | null; createdById: string; closedById: string | null; createdAt: string };
type Mode = "open" | "close" | "status";
const statusNames: Record<Status, string> = { DISPONIBLE: "Disponible", EN_MANTENIMIENTO: "En mantenimiento", FUERA_SERVICIO: "Fuera de servicio" };
function dateTime(value: string | null) { if (!value) return "—"; return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function localDateTimeNow() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
function isoDateTime(value: string) { return new Date(value).toISOString(); }
function explainError(error: unknown) {
  if (error instanceof BackendRequestError) {
    if (error.status === 409) return "Conflicto: ya existe un mantenimiento abierto o la transición solicitada no está permitida.";
    if (error.status === 404) return "No se encontró la máquina o el mantenimiento solicitado.";
    if (error.status === 400) return error.message || "Revisa los datos y la fecha indicados.";
    if (error.status === 401 || error.status === 403) return "No tienes permiso para realizar esta acción. Verifica tu sesión.";
    return error.message;
  }
  return "No se pudo completar la solicitud. Inténtalo de nuevo.";
}
export default function MantenimientoPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Status>("");
  const [mode, setMode] = useState<Mode | null>(null);
  const [selected, setSelected] = useState<Machine | null>(null);
  const [reason, setReason] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [targetStatus, setTargetStatus] = useState<"DISPONIBLE" | "FUERA_SERVICIO">("FUERA_SERVICIO");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState<Maintenance[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [closeId, setCloseId] = useState("");

  const loadMachines = useCallback(async () => {
    setLoading(true); setLoadError("");
    const params = new URLSearchParams({ page: "1", pageSize: "50" });
    if (statusFilter) params.set("status", statusFilter);
    try { const result = await backendRequest<ListResponse<Machine>>(`machines?${params}`); setMachines(result.data); }
    catch { setLoadError("No se pudieron cargar las máquinas. Inténtalo de nuevo."); setMachines([]); }
    finally { setLoading(false); }
  }, [statusFilter]);
  useEffect(() => {
    // The callback starts an asynchronous request; its state updates occur after the response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMachines();
  }, [loadMachines]);

  async function openModal(machine: Machine, nextMode: Mode) {
    setSelected(machine); setMode(nextMode); setError(""); setNotice(""); setReason(""); setHistory([]); setHistoryError(""); setCloseId("");
    setStartsAt(localDateTimeNow()); setEndedAt(localDateTimeNow());
    setTargetStatus(machine.status === "FUERA_SERVICIO" ? "DISPONIBLE" : "FUERA_SERVICIO");
    if (nextMode === "close") {
      setHistoryLoading(true);
      try {
        const result = await backendRequest<ListResponse<Maintenance>>(`machines/${encodeURIComponent(machine.id)}/maintenance?openOnly=true&page=1&pageSize=50`);
        setHistory(result.data);
        if (result.data.length) setCloseId(result.data[0].id);
        else setError("No se encontró un período de mantenimiento abierto para esta máquina.");
      } catch (err) { setHistoryError(explainError(err)); }
      finally { setHistoryLoading(false); }
    }
  }
  function closeModal() { if (saving) return; setMode(null); setSelected(null); setError(""); setHistoryError(""); }
  async function refreshAndNotify(text: string) { setMode(null); setSelected(null); setNotice(text); await loadMachines(); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || !mode) return;
    setError(""); setNotice("");
    const trimmed = reason.trim();
    if (mode === "open" && (!startsAt || !Number.isFinite(new Date(startsAt).getTime()))) { setError("Indica una fecha de inicio válida."); return; }
    if (mode === "open" && (trimmed.length < 10 || trimmed.length > 250)) { setError("El motivo debe tener entre 10 y 250 caracteres."); return; }
    if (mode === "close" && !endedAt) { setError("Indica una fecha de fin válida."); return; }
    if (mode === "close" && history.find((item) => item.id === closeId) && new Date(endedAt).getTime() < new Date(history.find((item) => item.id === closeId)!.startedAt).getTime()) { setError("La fecha de fin no puede ser anterior a la fecha de inicio."); return; }
    if (mode === "status" && (trimmed.length < 10 || trimmed.length > 250)) { setError("El motivo debe tener entre 10 y 250 caracteres."); return; }
    setSaving(true);
    try {
      if (mode === "open") {
        await backendRequest(`machines/${encodeURIComponent(selected.id)}/maintenance`, { method: "POST", body: JSON.stringify({ reason: trimmed, startsAt: isoDateTime(startsAt) }) });
        await refreshAndNotify("Mantenimiento registrado");
      } else if (mode === "close") {
        if (!closeId) { setError("Selecciona un mantenimiento abierto."); return; }
        await backendRequest(`machines/${encodeURIComponent(selected.id)}/maintenance/${encodeURIComponent(closeId)}/complete`, { method: "PATCH", body: JSON.stringify({ endedAt: isoDateTime(endedAt) }) });
        await refreshAndNotify("Mantenimiento finalizado");
      } else {
        await backendRequest(`machines/${encodeURIComponent(selected.id)}/status`, { method: "PATCH", body: JSON.stringify({ status: targetStatus, reason: trimmed }) });
        await refreshAndNotify("Estado de la máquina actualizado");
      }
    } catch (err) { setError(explainError(err)); }
    finally { setSaving(false); }
  }

  return <main className={styles.page}>
    <div className={styles.heading}><div><p className={styles.eyebrow}>ADMINISTRACIÓN</p><h2>Mantenimiento de máquinas</h2><p className={styles.intro}>Registra intervenciones y mantén actualizado el estado de los equipos.</p></div></div>
    {notice && <p className={styles.success} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="list-heading">
      <div className={styles.panelHead}><div><h3 id="list-heading">Máquinas del gimnasio</h3><p>El estado y los períodos se actualizan desde el sistema.</p></div><div className={styles.filter}><label htmlFor="status-filter">Filtrar estado</label><select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "" | Status)}><option value="">Todos los estados</option>{Object.entries(statusNames).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
      {loading ? <p className={styles.state} role="status">Cargando máquinas...</p> : loadError ? <div className={styles.state} role="alert">{loadError}<button className={styles.secondary} type="button" onClick={() => void loadMachines()}>Reintentar</button></div> : machines.length === 0 ? <p className={styles.state}>No hay máquinas registradas.</p> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Máquina</th><th>Tipo</th><th>Ubicación</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{machines.map((machine) => <tr key={machine.id}><td data-label="Máquina"><strong>{machine.name}</strong></td><td data-label="Tipo">{machine.type}</td><td data-label="Ubicación">{machine.location}</td><td data-label="Estado"><span className={`${styles.badge} ${machine.status === "DISPONIBLE" ? styles.available : machine.status === "EN_MANTENIMIENTO" ? styles.maintenance : styles.outOfService}`}>{statusNames[machine.status]}</span></td><td data-label="Acciones"><div className={styles.rowActions}>{machine.status === "EN_MANTENIMIENTO" ? <button className={styles.action} type="button" onClick={() => void openModal(machine, "close")}>Finalizar mantenimiento</button> : <button className={styles.action} type="button" onClick={() => void openModal(machine, "open")}>Registrar mantenimiento</button>}<button className={styles.linkAction} type="button" onClick={() => void openModal(machine, "status")}>Cambiar estado</button></div></td></tr>)}</tbody></table></div>}
    </section>
    {mode && selected && <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className={styles.dialogHead}><div><p>{selected.name} · {selected.location}</p><h3 id="dialog-title">{mode === "open" ? "Registrar mantenimiento" : mode === "close" ? "Finalizar mantenimiento" : "Cambiar estado de máquina"}</h3></div><button type="button" aria-label="Cerrar" className={styles.close} onClick={closeModal} disabled={saving}>×</button></div>
      {historyLoading ? <p className={styles.state} role="status">Cargando mantenimiento activo...</p> : historyError ? <p className={styles.error} role="alert">{historyError}</p> : <form onSubmit={submit}>
        {mode === "close" && history.length > 0 && <div className={styles.field}><label htmlFor="period">Período abierto</label><select id="period" value={closeId} onChange={(e) => setCloseId(e.target.value)}>{history.map((item) => <option key={item.id} value={item.id}>{dateTime(item.startedAt)} · {item.reason}</option>)}</select><p className={styles.help}>Inicio: {dateTime(history.find((item) => item.id === closeId)?.startedAt ?? null)} · Motivo: {history.find((item) => item.id === closeId)?.reason}</p></div>}
        {mode === "open" && <><div className={styles.field}><label htmlFor="reason">Motivo del mantenimiento</label><textarea id="reason" minLength={10} maxLength={250} required rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe el motivo (10–250 caracteres)" /><small>{reason.length}/250</small></div><div className={styles.field}><label htmlFor="starts-at">Fecha y hora de inicio</label><input id="starts-at" type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></div></>}
        {mode === "close" && <div className={styles.field}><label htmlFor="ended-at">Fecha y hora de fin</label><input id="ended-at" type="datetime-local" required value={endedAt} onChange={(e) => setEndedAt(e.target.value)} /></div>}
        {mode === "status" && <><div className={styles.field}><label htmlFor="target-status">Estado de la máquina</label><select id="target-status" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value as "DISPONIBLE" | "FUERA_SERVICIO")}><option value="DISPONIBLE">Disponible</option><option value="FUERA_SERVICIO">Fuera de servicio</option></select><p className={styles.help}>El estado «En mantenimiento» se registra con un período de mantenimiento.</p></div><div className={styles.field}><label htmlFor="status-reason">Motivo del cambio</label><textarea id="status-reason" minLength={10} maxLength={250} required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo (10–250 caracteres)" /></div></>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.dialogActions}><button className={styles.secondary} type="button" onClick={closeModal} disabled={saving}>Cancelar</button><button className={styles.primary} type="submit" disabled={saving || (mode === "close" && (historyLoading || !!historyError || !history.length))}>{saving ? "Guardando…" : mode === "open" ? "Registrar mantenimiento" : mode === "close" ? "Finalizar" : "Guardar estado"}</button></div>
      </form>}
    </section></div>}
  </main>;
}

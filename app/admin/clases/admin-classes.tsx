"use client";
import { useEffect, useState, type FormEvent } from "react";
import { backendRequest, BackendRequestError } from "@/lib/backend-client";
import s from "./admin-classes.module.css";

type Template = { id: string; name: string; trainerId: string; roomId: string; weekday: number; startTime: string; durationMinutes: number; capacity: number; status: string };
type Room = { id: string; name: string; capacity: number };
type Trainer = { id: string; name: string };
type Session = { id: string; classTemplateId: string; startsAt: string; endsAt: string; capacity: number; roomId: string; trainerId: string; status: string };
type Page<T> = { data: T[]; total: number; page: number; pageSize: number };
type TemplateForm = Omit<Template, "id" | "status">;
const blank: TemplateForm = { name: "", trainerId: "", roomId: "", weekday: 1, startTime: "08:00", durationMinutes: 60, capacity: 10 };
const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const dateLabel = (iso: string) => new Date(iso).toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" });
function apiError(e: unknown, fallback: string) { return e instanceof BackendRequestError && e.status === 403 ? "No tienes permiso para acceder." : e instanceof Error ? e.message : fallback; }
export default function AdminClassesPage() {
  const [templates, setTemplates] = useState<Template[]>([]), [sessions, setSessions] = useState<Session[]>([]), [rooms, setRooms] = useState<Room[]>([]), [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [form, setForm] = useState<TemplateForm>(blank), [editing, setEditing] = useState<string | null>(null), [generateId, setGenerateId] = useState<string | null>(null), [fromDate, setFromDate] = useState(""), [toDate, setToDate] = useState("");
  const [sessionEdit, setSessionEdit] = useState<Session | null>(null);
  async function load() {
    setLoading(true); setError("");
    try {
      const [a,b,c,d] = await Promise.all([backendRequest<Template[]>("class-templates"), backendRequest<Page<Session>>("admin/class-sessions?page=1&pageSize=50"), backendRequest<Room[]>("rooms"), backendRequest<{data:Trainer[]}>("trainers")]);
      setTemplates(a); setSessions(b.data ?? []); setRooms(c); setTrainers(d.data ?? []);
    } catch (e) { setError(apiError(e, "No se pudieron cargar las clases.")); } finally { setLoading(false); }
  }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
  function editTemplate(t: Template) { setEditing(t.id); setForm({ name:t.name, trainerId:t.trainerId, roomId:t.roomId, weekday:t.weekday, startTime:t.startTime, durationMinutes:t.durationMinutes, capacity:t.capacity }); setNotice(""); }
  function resetForm() { setEditing(null); setForm(blank); }
  async function saveTemplate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    const payload = { ...form, weekday:Number(form.weekday), durationMinutes:Number(form.durationMinutes), capacity:Number(form.capacity) };
    try { await backendRequest(editing ? `class-templates/${editing}` : "class-templates", { method:editing?"PATCH":"POST", body:JSON.stringify(payload) }); setNotice(editing?"Plantilla actualizada.":"Plantilla creada."); resetForm(); await load(); }
    catch (err) { setError(apiError(err, "No se pudo guardar la plantilla.")); } finally { setSaving(false); }
  }
  async function generate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!generateId) return;
    const start = new Date(`${fromDate}T00:00:00`), end = new Date(`${toDate}T00:00:00`), days = (end.getTime()-start.getTime())/86400000;
    if (!Number.isInteger(days) || days < 0 || days > 27) { setError("El rango debe ser inclusivo y abarcar entre 1 y 28 días."); return; }
    setSaving(true); setError(""); setNotice("");
    try { const result = await backendRequest<{created:number}>(`class-templates/${generateId}/sessions`, { method:"POST", body:JSON.stringify({fromDate,toDate}) }); setNotice(`Generación completada: ${result.created} sesión(es) creada(s).`); setGenerateId(null); setFromDate(""); setToDate(""); await load(); }
    catch (err) { setError(apiError(err, "No se pudieron generar las sesiones.")); } finally { setSaving(false); }
  }
  async function saveSession(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!sessionEdit) return; setSaving(true); setError(""); setNotice("");
    try { await backendRequest(`class-sessions/${sessionEdit.id}`, { method:"PATCH", body:JSON.stringify({ capacity:Number(sessionEdit.capacity), roomId:sessionEdit.roomId, trainerId:sessionEdit.trainerId }) }); setNotice("Sesión actualizada."); setSessionEdit(null); await load(); }
    catch (err) { setError(apiError(err, "No se pudo actualizar la sesión.")); } finally { setSaving(false); }
  }
  return <main className={s.page}><h1>Administración de clases</h1>
    {notice && <p className={s.success} role="status">{notice}</p>}{error && <p className={s.error} role="alert">{error}</p>}
    <section className={s.card}><h2>{editing ? "Editar plantilla semanal" : "Nueva plantilla semanal"}</h2>
      <form className={s.form} onSubmit={saveTemplate}>
        <label>Nombre<input required minLength={3} maxLength={80} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>Entrenador<select required value={form.trainerId} onChange={e=>setForm({...form,trainerId:e.target.value})}><option value="">Selecciona</option>{trainers.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label>Sala<select required value={form.roomId} onChange={e=>setForm({...form,roomId:e.target.value})}><option value="">Selecciona</option>{rooms.map(x=><option key={x.id} value={x.id}>{x.name} (capacidad {x.capacity})</option>)}</select></label>
        <label>Día<select required value={form.weekday} onChange={e=>setForm({...form,weekday:Number(e.target.value)})}>{weekdays.map((x,i)=><option key={x} value={i+1}>{x}</option>)}</select></label>
        <label>Hora<input type="time" required value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})}/></label>
        <label>Duración<select required value={form.durationMinutes} onChange={e=>setForm({...form,durationMinutes:Number(e.target.value)})}>{[30,45,60,75,90,120].map(x=><option key={x} value={x}>{x} min</option>)}</select></label>
        <label>Cupo<input type="number" required min={1} max={50} value={form.capacity} onChange={e=>setForm({...form,capacity:Number(e.target.value)})}/></label>
        <div className={s.actions}><button disabled={saving||loading}>{saving?"Guardando…":editing?"Guardar cambios":"Crear plantilla"}</button>{editing&&<button type="button" className={s.secondary} onClick={resetForm}>Cancelar edición</button>}</div>
      </form>
    </section>
    <section className={s.card}><h2>Plantillas ({templates.length})</h2>{loading?<p>Cargando plantillas…</p>:templates.length===0?<p>No hay plantillas registradas.</p>:<div className={s.list}>{templates.map(t=><article className={s.row} key={t.id}><div><strong>{t.name}</strong><span>{weekdays[t.weekday-1]} · {t.startTime} · {t.durationMinutes} min · cupo {t.capacity} · {t.status}</span></div><div className={s.actions}><button type="button" className={s.secondary} onClick={()=>editTemplate(t)}>Editar</button><button type="button" onClick={()=>{setGenerateId(generateId===t.id?null:t.id);setError("");setNotice("")}}>Generar sesiones</button></div>{generateId===t.id&&<form className={s.generate} onSubmit={generate}><label>Desde<input type="date" required value={fromDate} onChange={e=>setFromDate(e.target.value)}/></label><label>Hasta<input type="date" required min={fromDate||undefined} value={toDate} onChange={e=>setToDate(e.target.value)}/></label><p>El rango inclusivo debe ser de 1 a 28 días.</p><div className={s.actions}><button disabled={saving}>{saving?"Generando…":"Crear sesiones"}</button><button className={s.secondary} type="button" onClick={()=>setGenerateId(null)}>Cancelar</button></div></form>}</article>)}</div>}</section>
    <section className={s.card}><h2>Sesiones fechadas</h2>{loading?<p>Cargando sesiones…</p>:sessions.length===0?<p>No hay sesiones para mostrar.</p>:<div className={s.list}>{sessions.map(x=><article className={s.row} key={x.id}><div><strong>{dateLabel(x.startsAt)}</strong><span>Plantilla {x.classTemplateId} · sala {x.roomId} · entrenador {x.trainerId} · cupo {x.capacity} · {x.status}</span>{sessionEdit?.id===x.id&&<form className={s.generate} onSubmit={saveSession}><label>Cupo<input type="number" required min={1} max={50} value={sessionEdit.capacity} onChange={e=>setSessionEdit({...sessionEdit,capacity:Number(e.target.value)})}/></label><label>Sala<select required value={sessionEdit.roomId} onChange={e=>setSessionEdit({...sessionEdit,roomId:e.target.value})}>{rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label>Entrenador<select required value={sessionEdit.trainerId} onChange={e=>setSessionEdit({...sessionEdit,trainerId:e.target.value})}>{trainers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><div className={s.actions}><button disabled={saving}>{saving?"Guardando…":"Guardar sesión"}</button><button className={s.secondary} type="button" onClick={()=>setSessionEdit(null)}>Cancelar</button></div></form>}</div>{!sessionEdit&&<div className={s.actions}><button className={s.secondary} type="button" disabled={x.status!=="PROGRAMADA"} onClick={()=>setSessionEdit({...x})}>Editar sesión</button></div>}</article>)}</div>}</section>
  </main>;
}

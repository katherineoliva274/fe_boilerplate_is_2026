"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../page.module.css";
import { diaLocal, escribirRegistros, EJERCICIOS, leerRegistros, type Marca, type Registro } from "../_lib/progreso";

type Props = { registroId?: string };
type Campos = { recordDate: string; weightKg: string; waistCm: string; chestCm: string; armCm: string; marks: Marca[] };
type Errores = Record<string, string>;
const vacio = (): Campos => ({ recordDate: diaLocal(), weightKg: "", waistCm: "", chestCm: "", armCm: "", marks: [] });
const idMarca = () => `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const formato = (n: number | null) => n === null ? "" : String(n);
const VALOR_DECIMAL = /^\d+(?:[.,]\d{1,2})?$/;
function validarNumero(valor: string, min: number, max: number, obligatorio: boolean, etiqueta: string): string | null {
    if (!valor.trim()) return obligatorio ? `${etiqueta} es obligatorio` : null;
    if (!VALOR_DECIMAL.test(valor.trim())) return `${etiqueta} debe tener hasta 2 decimales`;
    const n = Number(valor.replace(",", "."));
    if (!Number.isFinite(n) || n < min || n > max) return `${etiqueta} debe estar entre ${min} y ${max}`;
    return null;
}
const numero = (v: string) => Number(v.replace(",", "."));

export default function ProgressForm({ registroId }: Props) {
    const router = useRouter();
    const editando = Boolean(registroId);
    const [campos, setCampos] = useState<Campos>(vacio);
    const [cargando, setCargando] = useState(true);
    const [noExiste, setNoExiste] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [errores, setErrores] = useState<Errores>({});
    const [mensaje, setMensaje] = useState("");
    const [duplicadoId, setDuplicadoId] = useState<string | null>(null);

    useEffect(() => {
        if (registroId) {
            const registro = leerRegistros().find(r => r.id === registroId);
            if (!registro) setNoExiste(true);
            else setCampos({
                recordDate: registro.recordDate, weightKg: String(registro.weightKg),
                waistCm: formato(registro.waistCm), chestCm: formato(registro.chestCm), armCm: formato(registro.armCm),
                marks: registro.marks.map(m => ({ id: idMarca(), exerciseId: m.exerciseId, weightKg: String(m.weightKg), reps: String(m.reps) }))
            });
        }
        setCargando(false);
    }, [registroId]);

    function actualizar(campo: keyof Omit<Campos, "marks">, valor: string) {
        setCampos(v => ({ ...v, [campo]: valor }));
        setErrores(v => ({ ...v, [campo]: "" }));
        setMensaje(""); setDuplicadoId(null);
    }
    function actualizarMarca(id: string, campo: "exerciseId" | "weightKg" | "reps", valor: string) {
        setCampos(v => ({ ...v, marks: v.marks.map(m => m.id === id ? { ...m, [campo]: valor } : m) }));
        setErrores(v => ({ ...v, [`marca-${id}-${campo}`]: "" }));
    }
    function guardar(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (guardando) return;
        setMensaje(""); setDuplicadoId(null);
        const next: Errores = {};
        if (!/^\d{4}-\d{2}-\d{2}$/.test(campos.recordDate) || Number.isNaN(new Date(`${campos.recordDate}T12:00:00`).getTime())) next.recordDate = "Selecciona una fecha válida";
        else if (campos.recordDate > diaLocal()) next.recordDate = "La fecha no puede ser futura";
        const camposNumericos: { campo: "weightKg" | "waistCm" | "chestCm" | "armCm"; min: number; max: number; obligatorio: boolean; etiqueta: string }[] = [
            { campo: "weightKg", min: 20, max: 300, obligatorio: true, etiqueta: "Peso" },
            { campo: "waistCm", min: 10, max: 250, obligatorio: false, etiqueta: "Cintura" },
            { campo: "chestCm", min: 10, max: 250, obligatorio: false, etiqueta: "Pecho" },
            { campo: "armCm", min: 10, max: 250, obligatorio: false, etiqueta: "Brazo" },
        ];
        for (const f of camposNumericos) {
            const error = validarNumero(campos[f.campo], f.min, f.max, f.obligatorio, f.etiqueta);
            if (error) next[f.campo] = error;
        }
        campos.marks.forEach(m => {
            if (!EJERCICIOS.some(x => x.id === m.exerciseId)) next[`marca-${m.id}-exerciseId`] = "Selecciona un ejercicio";
            const error = validarNumero(m.weightKg, 0, 500, true, "Peso levantado");
            if (error) next[`marca-${m.id}-weightKg`] = error;
            if (!/^\d+$/.test(m.reps) || Number(m.reps) < 1 || Number(m.reps) > 100) next[`marca-${m.id}-reps`] = "Repeticiones: entero entre 1 y 100";
        });
        setErrores(next);
        if (Object.keys(next).length) return;
        const registros = leerRegistros();
        const duplicado = registros.find(r => r.recordDate === campos.recordDate && r.id !== registroId);
        if (duplicado) {
            setDuplicadoId(duplicado.id);
            setErrores({ recordDate: "Ya registraste progreso ese día; puedes editarlo" });
            return;
        }
        setGuardando(true);
        try {
            const nuevo: Registro = {
                id: registroId ?? `progreso-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                recordDate: campos.recordDate, weightKg: numero(campos.weightKg),
                waistCm: campos.waistCm.trim() ? numero(campos.waistCm) : null,
                chestCm: campos.chestCm.trim() ? numero(campos.chestCm) : null,
                armCm: campos.armCm.trim() ? numero(campos.armCm) : null,
                marks: campos.marks.map(m => ({ exerciseId: m.exerciseId, weightKg: numero(m.weightKg), reps: Number(m.reps) }))
            };
            escribirRegistros(editando ? registros.map(r => r.id === registroId ? nuevo : r) : [...registros, nuevo]);
            router.push("/mi-progreso?guardado=1");
        } catch {
            setMensaje("No se pudo guardar el progreso");
        } finally { setGuardando(false); }
    }

    return <div className={styles.layout}>
        <header className={styles.header}><h1>GKDS <span>FITNESS</span></h1></header>
        <div className={styles.body}>
            <aside className={styles.sidebar}><p>MENÚ PRINCIPAL</p><nav>
                <Link href="/">Inicio</Link><Link href="/mi-rutina">Mi rutina</Link><Link className={styles.active} href="/mi-progreso">Mi progreso</Link><Link href="/entrenadores">Entrenadores</Link><Link href="/pagos">Pagos</Link>
            </nav></aside>
            <main className={styles.main}>
                <div className={styles.titleRow}><div><p className={styles.eyebrow}>SEGUIMIENTO PERSONAL</p><h2>{editando ? "Editar registro de progreso" : "Registrar mi progreso"}</h2><p>Registra tus mediciones y las marcas de tus ejercicios.</p></div><span className={styles.tag}>PROTOTIPO</span></div>
                {cargando ? <section className={styles.card}>Cargando registro...</section> : noExiste ? <section className={styles.card}><p role="alert">No se encontró el registro.</p><Link href="/mi-progreso">Volver al historial</Link></section> :
                    <form className={styles.card} onSubmit={guardar} noValidate>
                        <div className={styles.cardHeading}><div><h3>Mediciones corporales</h3><p>El peso y la fecha son obligatorios; las demás medidas son opcionales.</p></div><Link href="/mi-progreso" className={styles.textLink}>Volver al historial</Link></div>
                        {mensaje && <div role="alert" className={styles.errorBox}>{mensaje}</div>}
                        <div className={styles.formGrid}>
                            <label className={styles.field}>Fecha del registro <strong>*</strong><input type="date" value={campos.recordDate} max={diaLocal()} onChange={e => actualizar("recordDate", e.target.value)} aria-invalid={Boolean(errores.recordDate)} />{errores.recordDate && <span className={styles.fieldError}>{errores.recordDate}</span>}{duplicadoId && <Link href={`/mi-progreso/${duplicadoId}/editar`} className={styles.textLink}>Editar el registro existente</Link>}</label>
                            <label className={styles.field}>Peso corporal (kg) <strong>*</strong><input type="number" min="20" max="300" step="0.01" placeholder="Ej. 72.50" value={campos.weightKg} onChange={e => actualizar("weightKg", e.target.value)} aria-invalid={Boolean(errores.weightKg)} />{errores.weightKg && <span className={styles.fieldError}>{errores.weightKg}</span>}</label>
                            {([["waistCm", "Cintura (cm)"], ["chestCm", "Pecho (cm)"], ["armCm", "Brazo (cm)"]] as const).map(([campo, titulo]) => <label className={styles.field} key={campo}>{titulo}<input type="number" min="10" max="250" step="0.01" placeholder="Opcional" value={campos[campo]} onChange={e => actualizar(campo, e.target.value)} aria-invalid={Boolean(errores[campo])} />{errores[campo] && <span className={styles.fieldError}>{errores[campo]}</span>}</label>)}
                        </div>
                        <div className={styles.sectionDivider} />
                        <div className={styles.cardHeading}><div><h3>Marcas de ejercicios</h3><p>Agrega las marcas que quieras registrar para esta fecha.</p></div><button className={styles.secondary} type="button" onClick={() => setCampos(v => ({ ...v, marks: [...v.marks, { id: idMarca(), exerciseId: "", weightKg: "", reps: "" }] }))}>+ Agregar marca</button></div>
                        {campos.marks.length === 0 ? <div className={styles.emptyMarks}>Todavía no has agregado marcas. Esta sección es opcional.</div> : campos.marks.map((m, i) => <div className={styles.markRow} key={m.id}>
                            <div className={styles.markNumber}>Marca {i + 1}</div>
                            <label className={styles.field}>Ejercicio<select value={m.exerciseId} onChange={e => actualizarMarca(m.id, "exerciseId", e.target.value)}><option value="">Seleccionar ejercicio</option>{EJERCICIOS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>{errores[`marca-${m.id}-exerciseId`] && <span className={styles.fieldError}>{errores[`marca-${m.id}-exerciseId`]}</span>}</label>
                            <label className={styles.field}>Peso levantado (kg)<input type="number" min="0" max="500" step="0.01" value={m.weightKg} onChange={e => actualizarMarca(m.id, "weightKg", e.target.value)} />{errores[`marca-${m.id}-weightKg`] && <span className={styles.fieldError}>{errores[`marca-${m.id}-weightKg`]}</span>}</label>
                            <label className={styles.field}>Repeticiones<input type="number" min="1" max="100" step="1" value={m.reps} onChange={e => actualizarMarca(m.id, "reps", e.target.value)} />{errores[`marca-${m.id}-reps`] && <span className={styles.fieldError}>{errores[`marca-${m.id}-reps`]}</span>}</label>
                            <button className={styles.remove} type="button" onClick={() => setCampos(v => ({ ...v, marks: v.marks.filter(x => x.id !== m.id) }))}>Quitar</button>
                        </div>)}
                        <div className={styles.formActions}><Link href="/mi-progreso" className={styles.secondary}>Cancelar</Link><button type="submit" className={styles.primary} disabled={guardando}>{guardando ? "Guardando..." : "Guardar progreso"}</button></div>
                    </form>}
            </main>
        </div>
    </div>;
}

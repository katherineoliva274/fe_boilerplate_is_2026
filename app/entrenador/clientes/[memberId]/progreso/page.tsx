"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

type Metric = "weightKg" | "waistCm" | "chestCm" | "armCm" | "exerciseWeightKg";
type Marca = { exerciseId: string; weightKg: number; reps: number };
type Registro = { date: string; weightKg: number; waistCm: number | null; chestCm: number | null; armCm: number | null; marks: Marca[] };
type Ejercicio = { exerciseId: string; weekday: number; sets: number; reps: number; position: number };
type Rutina = { version: number; name: string; goal: string; startsOn: string; endsOn: string; status: "VIGENTE" | "REEMPLAZADA"; exercises: Ejercicio[] };
type Cliente = { id: string; numero: string; nombre: string; objetivo: string; activo: boolean };

const CLIENTES: Cliente[] = [
  {id:"m001",numero:"GKDS-0001",nombre:"Ana Martínez",objetivo:"Resistencia y movilidad",activo:true},
  {id:"m002",numero:"GKDS-0002",nombre:"Carlos López",objetivo:"Ganar masa muscular",activo:true},
  {id:"m003",numero:"GKDS-0003",nombre:"Daniela Rivera",objetivo:"Fuerza general",activo:true},
  {id:"m004",numero:"GKDS-0004",nombre:"Eduardo Pérez",objetivo:"Acondicionamiento",activo:true},
  {id:"m005",numero:"GKDS-0005",nombre:"Fernanda Gómez",objetivo:"Ganancia de fuerza",activo:true},
  {id:"m006",numero:"GKDS-0006",nombre:"Gabriel Hernández",objetivo:"Mejorar técnica",activo:true},
  {id:"m007",numero:"GKDS-0007",nombre:"Isabel Cruz",objetivo:"Movilidad",activo:true},
  {id:"m008",numero:"GKDS-0008",nombre:"Javier Molina",objetivo:"Resistencia",activo:true},
  {id:"m009",numero:"GKDS-0009",nombre:"Karen Vásquez",objetivo:"Fuerza y coordinación",activo:true},
  {id:"m010",numero:"GKDS-0010",nombre:"Luis Romero",objetivo:"Hipertrofia",activo:true},
  {id:"m011",numero:"GKDS-0011",nombre:"María Flores",objetivo:"Acondicionamiento",activo:true},
  {id:"m012",numero:"GKDS-0012",nombre:"Óscar Castillo",objetivo:"Fuerza funcional",activo:true},
];
const EJERCICIOS = [
  {id:"sentadilla",name:"Sentadilla con barra"}, {id:"press-banca",name:"Press de banca"},
  {id:"remo",name:"Remo con mancuerna"}, {id:"peso-muerto",name:"Peso muerto"},
  {id:"press-militar",name:"Press militar"}, {id:"dominadas",name:"Dominadas"},
  {id:"curl",name:"Curl de bíceps"}, {id:"zancadas",name:"Zancadas"},
];
const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const METRICAS: {id:Metric;label:string;unit:string}[] = [
  {id:"weightKg",label:"Peso corporal",unit:"kg"},
  {id:"waistCm",label:"Cintura",unit:"cm"},
  {id:"chestCm",label:"Pecho",unit:"cm"},
  {id:"armCm",label:"Brazo",unit:"cm"},
  {id:"exerciseWeightKg",label:"Peso levantado por ejercicio",unit:"kg"},
];
const STORAGE_PREFIX = "gkds_h26_rutinas_prototipo_";
const fechaVisible = (s: string) => s.split("-").reverse().join("/");
const fechaHoy = () => { const f = new Date(); return `${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,"0")}-${String(f.getDate()).padStart(2,"0")}`; };
const sumarDias = (iso: string, dias: number) => {const [a,m,d] = iso.split("-").map(Number);const f = new Date(a,m-1,d+dias);return `${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,"0")}-${String(f.getDate()).padStart(2,"0")}`;};
const ejercicioNombre = (id: string) => EJERCICIOS.find(e=>e.id===id)?.name ?? id;

// Datos exclusivamente simulados. No representan información personal real.
function crearRegistros(id: string): Registro[] {
  const n = Number(id.replace("m", "")) || 1;
  const base = 66 + n * 2.4;
  if (id === "m007") return [{date:"2026-11-02",weightKg:base,waistCm:null,chestCm:90,armCm:null,marks:[]}];
  return [
    {date:"2026-08-12",weightKg:+(base+2.1).toFixed(2),waistCm:82+n,chestCm:97+n,armCm:null,marks:[{exerciseId:"sentadilla",weightKg:35+n*2,reps:10}]},
    {date:"2026-09-12",weightKg:+(base+1.5).toFixed(2),waistCm:81+n,chestCm:null,armCm:30+n/2,marks:[{exerciseId:"sentadilla",weightKg:38+n*2,reps:9},{exerciseId:"press-banca",weightKg:25+n,reps:12}]},
    {date:"2026-10-14",weightKg:+(base+0.8).toFixed(2),waistCm:null,chestCm:97+n,armCm:31+n/2,marks:[{exerciseId:"sentadilla",weightKg:42+n*2,reps:8}]},
    {date:"2026-11-10",weightKg:base,waistCm:79+n,chestCm:98+n,armCm:32+n/2,marks:[{exerciseId:"sentadilla",weightKg:46+n*2,reps:8},{exerciseId:"press-banca",weightKg:30+n,reps:10}]},
  ];
}
function rutinaInicial(id: string): Rutina[] {
  return [{version:1,name:"Plan de fuerza y movilidad",goal:CLIENTES.find(c=>c.id===id)?.objetivo ?? "Mejorar el rendimiento",startsOn:"2026-11-01",endsOn:"2026-12-15",status:"VIGENTE",exercises:[{exerciseId:"sentadilla",weekday:1,sets:3,reps:10,position:1},{exerciseId:"press-banca",weekday:3,sets:3,reps:10,position:1},{exerciseId:"remo",weekday:5,sets:3,reps:12,position:1}]}];
}
function leerRutinas(id: string): Rutina[] {
  try { const raw = localStorage.getItem(STORAGE_PREFIX+id);if(raw){const p:unknown=JSON.parse(raw);if(Array.isArray(p)&&p.length) return p as Rutina[];} } catch { /* Usar datos de prueba */ }
  return rutinaInicial(id);
}
type Punto = {date:string;value:number;reps:number|null};
function obtenerPuntos(registros: Registro[], metrica: Metric, exerciseId: string): Punto[] {
  const ordenados = [...registros].sort((a,b)=>a.date.localeCompare(b.date));
  if(metrica==="exerciseWeightKg") return ordenados.flatMap(r => r.marks.filter(m=>m.exerciseId===exerciseId).map(m=>({date:r.date,value:m.weightKg,reps:m.reps})));
  return ordenados.flatMap(r => {const v=r[metrica];return v===null||!Number.isFinite(v)?[]:[{date:r.date,value:v,reps:null}];});
}
function Grafica({puntos, unidad}:{puntos:Punto[];unidad:string}) {
  if(puntos.length<2) return <div className={styles.noData}>Registra al menos 2 mediciones para ver tu evolución</div>;
  const min=Math.min(...puntos.map(p=>p.value));const max=Math.max(...puntos.map(p=>p.value));
  const minimo=Math.floor(min-Math.max(1,(max-min)*.25));const maximo=Math.ceil(max+Math.max(1,(max-min)*.25));
  const escala=(v:number)=>230-((v-minimo)/(maximo-minimo))*178;
  const x=(i:number)=>70+(i/(puntos.length-1))*620;
  const path=puntos.map((p,i)=>`${i===0?"M":"L"} ${x(i)} ${escala(p.value)}`).join(" ");
  return <div className={styles.chartScroll}><svg className={styles.chart} viewBox="0 0 750 315" role="img" aria-label={`Gráfica de evolución en ${unidad}`}>
    {[0,1,2,3,4].map(i=>{const valor=minimo+(maximo-minimo)*(4-i)/4;const y=52+i*44.5;return <g key={i}><line x1="70" y1={y} x2="690" y2={y} stroke="#e3eaf2"/><text x="59" y={y+4} textAnchor="end" fontSize="12" fill="#66758c">{valor.toFixed(1)}</text></g>;})}
    <path d={path} fill="none" stroke="#108b80" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
    {puntos.map((p,i)=><g key={`${p.date}-${i}`}><circle cx={x(i)} cy={escala(p.value)} r="6" stroke="white" strokeWidth="2" fill="#108b80"/><text x={x(i)} y={escala(p.value)-15} fontSize="12" fontWeight="700" textAnchor="middle" fill="#14233f">{p.value.toFixed(1)}{p.reps!==null?` · ${p.reps} rep.`:""}</text><text x={x(i)} y="264" fontSize="11" textAnchor="middle" fill="#66758c">{fechaVisible(p.date).slice(0,5)}</text></g>)}
    <text x="380" y="305" fontSize="12" textAnchor="middle" fill="#66758c">Fecha de medición</text>
  </svg></div>;
}

export default function ProgresoClientePage() {
  const params=useParams<{memberId:string}>();
  const id=String(params.memberId ?? "");
  const cliente=CLIENTES.find(c=>c.id===id&&c.activo);
  const [metrica,setMetrica]=useState<Metric>("weightKg");
  const [ejercicio,setEjercicio]=useState("sentadilla");
  const [rutinas,setRutinas]=useState<Rutina[]|null>(null);
  const [mostrarFormulario,setMostrarFormulario]=useState(false);
  const [guardando,setGuardando]=useState(false);
  const [error,setError]=useState("");
  const [exito,setExito]=useState("");
  const [nombre,setNombre]=useState("");
  const [objetivo,setObjetivo]=useState("");
  const [inicio,setInicio]=useState("");
  const [fin,setFin]=useState("");
  const [ejercicios,setEjercicios]=useState<Ejercicio[]>([]);
  const registros=useMemo(()=>crearRegistros(id),[id]);
  const puntos=useMemo(()=>obtenerPuntos(registros,metrica,ejercicio),[registros,metrica,ejercicio]);
  const indicador=METRICAS.find(m=>m.id===metrica)!;
  const actual=rutinas?.find(r=>r.status==="VIGENTE")??null;
  const ultimaVersion=Math.max(0,...(rutinas??[]).map(r=>r.version));
  useEffect(()=>{if(!cliente) return;setRutinas(leerRutinas(id));},[id,cliente]);
  const valores=puntos.length>=2?{inicial:puntos[0].value,ultimo:puntos[puntos.length-1].value,diferencia:puntos[puntos.length-1].value-puntos[0].value}:null;
  function abrirFormulario(){
    if(!actual)return;
    setNombre(actual.name);setObjetivo(actual.goal);setInicio(fechaHoy());setFin(sumarDias(fechaHoy(),30));
    setEjercicios(actual.exercises.map(x=>({...x})));setError("");setExito("");setMostrarFormulario(true);
  }
  function agregarEjercicio(){setEjercicios(a=>[...a,{exerciseId:"",weekday:1,sets:3,reps:10,position:a.length+1}]);}
  function modificarEjercicio(i:number,cambio:Partial<Ejercicio>){setEjercicios(a=>a.map((x,j)=>j===i?{...x,...cambio}:x));}
  function guardar(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();if(!cliente||guardando||!actual)return;
    setError("");setExito("");
    if(nombre.trim().length<3||nombre.trim().length>80){setError("El nombre debe tener entre 3 y 80 caracteres.");return;}
    if(objetivo.trim().length<3||objetivo.trim().length>250){setError("El objetivo debe tener entre 3 y 250 caracteres.");return;}
    if(!inicio||!fin||inicio>fin){setError("La fecha de inicio no puede ser posterior a la fecha final.");return;}
    if(ejercicios.length===0){setError("Debes agregar al menos un ejercicio.");return;}
    if(ejercicios.some(x=>!EJERCICIOS.some(ej=>ej.id===x.exerciseId)||!Number.isInteger(x.weekday)||x.weekday<1||x.weekday>7||!Number.isInteger(x.sets)||x.sets<1||x.sets>10||!Number.isInteger(x.reps)||x.reps<1||x.reps>100||!Number.isInteger(x.position)||x.position<1||x.position>50)){
      setError("Revisa los ejercicios: catálogo, día (1–7), series (1–10), repeticiones (1–100) y posición (1–50).");return;
    }
    const combinaciones=ejercicios.map(x=>`${x.weekday}:${x.position}`);
    if(new Set(combinaciones).size!==combinaciones.length){setError("No repitas la misma posición en un día.");return;}
    setGuardando(true);
    try {
      const actuales=leerRutinas(id);
      // Comprobación básica de versión en prototipo; la concurrencia real corresponde al backend.
      if(Math.max(...actuales.map(r=>r.version))!==ultimaVersion){throw new Error("La rutina fue actualizada; vuelve a cargarla");}
      const nueva:Rutina={version:ultimaVersion+1,name:nombre.trim(),goal:objetivo.trim(),startsOn:inicio,endsOn:fin,status:"VIGENTE",exercises:ejercicios.map(x=>({...x}))};
      const siguientes=[nueva,...actuales.map(r=>({...r,status:"REEMPLAZADA" as const}))];
      localStorage.setItem(STORAGE_PREFIX+id,JSON.stringify(siguientes));
      setRutinas(siguientes);setMostrarFormulario(false);setExito("Nueva versión de rutina guardada");
    } catch(err){setError(err instanceof Error?err.message:"No se pudo actualizar la rutina. Intenta de nuevo.");setRutinas(leerRutinas(id));}
    finally{setGuardando(false);}
  }
  if(!cliente)return <div className={styles.noAccess}><h1>Cliente no encontrado</h1><p>No existe una asignación activa para este miembro.</p><Link href="/entrenador/clientes">Volver a mis clientes</Link></div>;
  return <div className={styles.layout}>
    <header className={styles.header}><Link href="/">GKDS <span>FITNESS</span></Link></header>
    <div className={styles.body}>
      <aside className={styles.sidebar}><p>MENÚ PRINCIPAL</p><nav aria-label="Menú del entrenador"><Link href="/">Inicio</Link><Link href="/entrenador/agenda">Agenda</Link><Link href="/entrenador/disponibilidad">Mi disponibilidad</Link><Link href="/entrenador/rutinas">Rutinas</Link><Link className={styles.activo} href="/entrenador/clientes">Mis clientes</Link></nav></aside>
      <main className={styles.main}>
        <Link className={styles.back} href="/entrenador/clientes">← Volver a mis clientes</Link>
        <div className={styles.titleRow}><div><p className={styles.eyebrow}>SEGUIMIENTO DE ENTRENAMIENTO</p><h1>Progreso del cliente</h1><p>{cliente.nombre} · {cliente.numero}</p></div><span className={styles.tag}>PROTOTIPO</span></div>
        <div className={styles.summaryGrid}><div className={styles.summary}><span>Miembro asignado</span><strong>{cliente.nombre}</strong><small>{cliente.numero}</small></div><div className={`${styles.summary} ${styles.highlight}`}><span>Mediciones físicas</span><strong>{registros.length}</strong><small>Registros históricos</small></div><div className={styles.summary}><span>Versión de rutina</span><strong>{actual?`v${actual.version}`:"—"}</strong><small>{actual?.name??"Cargando..."}</small></div></div>
        <section className={styles.card}><div className={styles.cardHeading}><div><h2>Evolución física</h2><p>Mediciones ordenadas por fecha, del primer registro al último.</p></div></div>
          <div className={styles.filters}><label>Indicador<select value={metrica} onChange={e=>setMetrica(e.target.value as Metric)}>{METRICAS.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select></label>{metrica==="exerciseWeightKg"&&<label>Ejercicio<select value={ejercicio} onChange={e=>setEjercicio(e.target.value)}>{EJERCICIOS.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>}</div>
          {metrica==="exerciseWeightKg"&&puntos.length===0?<p role="status" className={styles.empty}>No hay registros para este ejercicio</p>:valores?<div className={styles.metrics}><div><span>Valor inicial</span><strong>{valores.inicial.toFixed(2)} {indicador.unit}</strong></div><div><span>Último valor</span><strong>{valores.ultimo.toFixed(2)} {indicador.unit}</strong></div><div><span>Diferencia</span><strong>{valores.diferencia>0?"+":""}{valores.diferencia.toFixed(2)} {indicador.unit}</strong></div></div>:null}
          {puntos.length<2?(metrica==="exerciseWeightKg"&&puntos.length===0?null:<p className={styles.empty}>Registra al menos 2 mediciones para ver tu evolución</p>):<Grafica puntos={puntos} unidad={indicador.unit}/>}
          <p className={styles.tip}>Las medidas no registradas se omiten de la gráfica. Las repeticiones se muestran junto a cada marca de ejercicio.</p>
        </section>
        <section className={styles.card}><div className={styles.cardHeading}><div><h2>Historial físico</h2><p>Consulta el peso, las medidas y las marcas registradas por fecha.</p></div></div><div className={styles.tableWrap}><table><thead><tr><th>Fecha</th><th>Peso</th><th>Cintura</th><th>Pecho</th><th>Brazo</th><th>Marcas</th></tr></thead><tbody>{[...registros].reverse().map(r=><tr key={r.date}><td>{fechaVisible(r.date)}</td><td>{r.weightKg.toFixed(2)} kg</td><td>{r.waistCm===null?"—":`${r.waistCm.toFixed(2)} cm`}</td><td>{r.chestCm===null?"—":`${r.chestCm.toFixed(2)} cm`}</td><td>{r.armCm===null?"—":`${r.armCm.toFixed(2)} cm`}</td><td>{r.marks.length?r.marks.map(m=>`${ejercicioNombre(m.exerciseId)}: ${m.weightKg} kg × ${m.reps}`).join("; "):"—"}</td></tr>)}</tbody></table></div></section>
        <section className={styles.card}><div className={styles.cardHeading}><div><h2>Rutina del miembro</h2><p>Una única versión vigente y conservación de las versiones anteriores.</p></div><button type="button" className={styles.primary} onClick={abrirFormulario} disabled={!actual}>Ajustar rutina</button></div>
          {exito&&<p role="status" className={styles.success}>{exito}</p>}
          {rutinas===null?<p>Cargando rutina...</p>:actual?<div className={styles.routine}><div><span className={styles.pill}>VIGENTE · v{actual.version}</span><h3>{actual.name}</h3><p>{actual.goal}</p><small>{fechaVisible(actual.startsOn)} – {fechaVisible(actual.endsOn)}</small></div><div className={styles.exerciseList}><strong>Ejercicios</strong>{actual.exercises.map((x,i)=><p key={`${x.exerciseId}-${i}`}>{DIAS[x.weekday-1]}: {ejercicioNombre(x.exerciseId)} · {x.sets} series × {x.reps} rep.</p>)}</div></div>:<p>No hay rutina vigente.</p>}
          {rutinas!==null&&rutinas.length>1&&<details className={styles.history}><summary>Ver versiones anteriores ({rutinas.length-1})</summary>{rutinas.filter(r=>r.status==="REEMPLAZADA").sort((a,b)=>b.version-a.version).map(r=><p key={r.version}><strong>Versión {r.version} · {r.name}</strong> · REEMPLAZADA · {fechaVisible(r.startsOn)} – {fechaVisible(r.endsOn)}</p>)}</details>}
        </section>
      </main>
    </div>
    {mostrarFormulario&&actual&&<div className={styles.overlay}><div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-ajuste"><div className={styles.modalTop}><div><p className={styles.eyebrow}>VERSIÓN v{actual.version+1}</p><h2 id="titulo-ajuste">Ajustar rutina</h2></div><button type="button" aria-label="Cerrar" onClick={()=>setMostrarFormulario(false)} className={styles.close}>×</button></div><p className={styles.tip}>Se creará una nueva versión; la anterior conservará su historial.</p><form onSubmit={guardar}>
      <div className={styles.formGrid}><label>Nombre de rutina<input required minLength={3} maxLength={80} value={nombre} onChange={e=>setNombre(e.target.value)}/></label><label>Objetivo<textarea required minLength={3} maxLength={250} value={objetivo} onChange={e=>setObjetivo(e.target.value)} rows={2}/></label><label>Inicio<input type="date" required value={inicio} onChange={e=>setInicio(e.target.value)}/></label><label>Fin<input type="date" required min={inicio} value={fin} onChange={e=>setFin(e.target.value)}/></label></div>
      <div className={styles.formSection}><div className={styles.inlineTitle}><h3>Ejercicios ({ejercicios.length})</h3><button className={styles.secondary} type="button" onClick={agregarEjercicio}>+ Agregar ejercicio</button></div>
      {ejercicios.map((x,i)=><div className={styles.exerciseRow} key={i}><label>Ejercicio<select required value={x.exerciseId} onChange={e=>modificarEjercicio(i,{exerciseId:e.target.value})}><option value="">Selecciona...</option>{EJERCICIOS.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label>Día<select value={x.weekday} onChange={e=>modificarEjercicio(i,{weekday:Number(e.target.value)})}>{DIAS.map((d,j)=><option key={d} value={j+1}>{d}</option>)}</select></label><label>Series<input type="number" min="1" max="10" required value={x.sets} onChange={e=>modificarEjercicio(i,{sets:Number(e.target.value)})}/></label><label>Reps<input type="number" min="1" max="100" required value={x.reps} onChange={e=>modificarEjercicio(i,{reps:Number(e.target.value)})}/></label><label>Posición<input type="number" min="1" max="50" required value={x.position} onChange={e=>modificarEjercicio(i,{position:Number(e.target.value)})}/></label><button type="button" className={styles.remove} onClick={()=>setEjercicios(a=>a.filter((_,j)=>j!==i))}>Quitar</button></div>)}
      </div>{error&&<p role="alert" className={styles.error}>{error}</p>}<div className={styles.modalActions}><button className={styles.secondary} type="button" onClick={()=>setMostrarFormulario(false)}>Volver</button><button type="submit" disabled={guardando} className={styles.primary}>{guardando?"Guardando...":"Guardar nueva versión"}</button></div></form></div></div>}
  </div>;
}

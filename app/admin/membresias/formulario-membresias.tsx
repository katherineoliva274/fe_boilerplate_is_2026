"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { logout } from "@/app/actions/auth";
import { backendRequest } from "@/lib/backend-client";
import { registrarSolicitud, type ResultadoSolicitud } from "./actions";
import type { PlanAPI } from "./page";

type Operacion = "COMPRA" | "RENOVACION";
type Miembro = {
  memberId: string;
  memberNumber: string;
  memberName: string;
  membership: {
    membershipId: string | null;
    status: "VIGENTE" | "VENCIDA" | "SIN_MEMBRESIA";
    endsOn: string | null;
  };
};
type RespuestaMiembros = { data: Miembro[] };

const menu = [
  { nombre: "Inicio", ruta: "/admin" },
  { nombre: "Membresías", ruta: "/admin/membresias" },
  { nombre: "Clases y reservas", ruta: "/admin/clases" },
  { nombre: "Planes", ruta: "/admin/planes" },
  { nombre: "Pagos pendientes", ruta: "/admin/pagos-pendientes" },
  { nombre: "Mantenimiento", ruta: "/admin/mantenimiento" },
  { nombre: "Reportes", ruta: "/admin/reportes" },
];

function obtenerNumero(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor === "string" && valor.trim() !== "") {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }
  return null;
}

function descripcionDuracion(plan: PlanAPI) {
  const meses = obtenerNumero(plan.durationMonths);
  const dias = obtenerNumero(plan.durationDays);
  const creditos = obtenerNumero(plan.classCredits);
  const partes: string[] = [];
  if (meses !== null) partes.push(`${meses} mes(es)`);
  if (dias !== null) partes.push(`${dias} días`);
  if (creditos !== null) partes.push(`${creditos} clases`);
  return partes.length > 0 ? partes.join(" / ") : "Duración definida por el plan";
}

function mostrarFecha(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split("-");
  if (!anio || !mes || !dia) return fecha;
  return `${dia}/${mes}/${anio}`;
}

export default function FormularioMembresias({ planes, errorPlanes }: { planes: PlanAPI[]; errorPlanes: string }) {
  const [numero, setNumero] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [miembro, setMiembro] = useState<Miembro | null>(null);
  const [estadoBusqueda, setEstadoBusqueda] = useState<"inactivo" | "cargando" | "listo" | "error">("inactivo");
  const [planId, setPlanId] = useState("");
  const [operacion, setOperacion] = useState<Operacion>("COMPRA");
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSolicitud | null>(null);
  const secuenciaBusqueda = useRef(0);
  const plan = planes.find((p) => p.id === planId);

  useEffect(() => {
    const q = busqueda.trim();
    if (q.length < 2) {
      return;
    }
    const actual = ++secuenciaBusqueda.current;
    const timer = window.setTimeout(async () => {
      setEstadoBusqueda("cargando");
      try {
        const respuesta = await backendRequest<RespuestaMiembros>(`/api/v1/access/members?q=${encodeURIComponent(q)}`);
        if (actual !== secuenciaBusqueda.current) return;
        setMiembros(Array.isArray(respuesta.data) ? respuesta.data.slice(0, 20) : []);
        setEstadoBusqueda("listo");
      } catch {
        if (actual === secuenciaBusqueda.current) setEstadoBusqueda("error");
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [busqueda]);

  function reiniciarResultado() {
    setMensaje("");
    setExito(false);
    setResultado(null);
  }

  async function confirmarSolicitud() {
    reiniciarResultado();
    const memberNumber = miembro?.memberNumber ?? numero.trim();
    if (!memberNumber || !planId) {
      setMensaje("Completa los campos obligatorios.");
      return;
    }
    if (!/^M-\d{6}$/i.test(memberNumber)) {
      setMensaje("Ingresa un número de miembro válido. Ej.: M-000001.");
      return;
    }
    if (!plan || plan.status !== "ACTIVO") {
      setMensaje("Selecciona un plan activo.");
      return;
    }
    if (operacion === "RENOVACION" && (!miembro || !miembro.membership.membershipId)) {
      setMensaje("Selecciona un miembro con una membresía disponible para renovar.");
      return;
    }
    setCargando(true);
    try {
      const respuesta = await registrarSolicitud({
        operacion,
        memberNumber,
        planId,
        membershipId: operacion === "RENOVACION" ? miembro?.membership.membershipId ?? undefined : undefined,
      });
      setMensaje(respuesta.mensaje);
      setExito(respuesta.ok);
      setResultado(respuesta.ok ? respuesta : null);
    } catch {
      setMensaje("Ocurrió un error inesperado.");
      setExito(false);
    } finally {
      setCargando(false);
    }
  }

  function cancelar() {
    setNumero("");
    setBusqueda("");
    setMiembro(null);
    setMiembros([]);
    setPlanId("");
    setOperacion("COMPRA");
    reiniciarResultado();
  }

  return (
    <div className={styles.contenedor}>
      <header className={styles.encabezado} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <h1>GKDS/GYM</h1>
        <form action={logout}><button type="submit" style={{ backgroundColor: "#2563eb", color: "#ffffff", padding: "11px 20px", borderRadius: "8px", border: "none", fontWeight: 600, cursor: "pointer" }}>Cerrar sesión</button></form>
      </header>
      <div className={styles.estructura}>
        <aside className={styles.sidebar}><nav className={styles.navegacion}>{menu.map((opcion) => <Link key={opcion.ruta} href={opcion.ruta} className={opcion.ruta === "/admin/membresias" ? styles.menuActivo : styles.menuItem}>{opcion.nombre}</Link>)}</nav></aside>
        <main className={styles.contenido}>
          <div className={styles.tituloSeccion}><h2>Compra o renovación</h2></div>
          <section className={styles.tarjeta}>
            <h3>Formulario</h3>
            {errorPlanes && <div role="alert" className={styles.error}>{errorPlanes}</div>}
            <div className={styles.formulario}>
              <div className={styles.campo}>
                <label htmlFor="buscarMiembro">Buscar miembro por nombre o número</label>
                <input id="buscarMiembro" value={busqueda} placeholder="Nombre o M-000001" maxLength={100} disabled={cargando} autoComplete="off" aria-controls="resultados-miembros" aria-describedby="estado-busqueda" onChange={(e) => {
                  setBusqueda(e.target.value);
                  setMiembro(null);
                  setMiembros([]);
                  if (e.target.value.trim().length < 2) setEstadoBusqueda("inactivo");
                  setNumero("");
                  reiniciarResultado();
                }} />
                <div id="estado-busqueda" className={styles.ayuda} role="status" aria-live="polite">
                  {busqueda.trim().length < 2 ? "Escribe al menos 2 caracteres para buscar." : estadoBusqueda === "cargando" ? "Buscando miembros…" : estadoBusqueda === "error" ? "No se pudo completar la búsqueda. Inténtalo de nuevo." : estadoBusqueda === "listo" && miembros.length === 0 ? "No se encontraron miembros." : estadoBusqueda === "listo" ? `${miembros.length} resultado(s), máximo 20.` : ""}
                </div>
                {estadoBusqueda === "error" && <button type="button" className={styles.cancelar} onClick={() => setBusqueda((q) => `${q} `)}>Reintentar búsqueda</button>}
                {miembros.length > 0 && !miembro && <ul id="resultados-miembros" className={styles.resultados} aria-label="Resultados de miembros">{miembros.map((item) => <li key={item.memberId}><button type="button" className={styles.resultadoMiembro} disabled={cargando} onClick={() => {
                  setMiembro(item);
                  setNumero(item.memberNumber);
                  setBusqueda(`${item.memberName} · ${item.memberNumber}`);
                  setMiembros([]);
                  reiniciarResultado();
                }}><strong>{item.memberName}</strong><span>{item.memberNumber}</span><span>{item.membership.status}{item.membership.endsOn ? ` · vence ${mostrarFecha(item.membership.endsOn)}` : ""}</span></button></li>)}</ul>}
                {miembro && <div className={styles.miembroSeleccionado} aria-live="polite"><strong>{miembro.memberName}</strong><span>{miembro.memberNumber} · {miembro.membership.status}</span><span>{miembro.membership.endsOn ? `Vencimiento: ${mostrarFecha(miembro.membership.endsOn)}` : "Sin fecha de vencimiento"}</span><button type="button" className={styles.quitarMiembro} disabled={cargando} onClick={() => { setMiembro(null); setBusqueda(""); setNumero(""); }}>Cambiar miembro</button></div>}
                {operacion === "COMPRA" && !miembro && <><label htmlFor="numeroManual">O ingresa el número de miembro</label><input id="numeroManual" value={numero} placeholder="Ej. M-000001" maxLength={30} disabled={cargando} onChange={(e) => { setNumero(e.target.value); reiniciarResultado(); }} /></>}
              </div>
              <div className={styles.campo}><label htmlFor="plan">Plan activo</label><select id="plan" value={planId} disabled={cargando || !!errorPlanes} onChange={(e) => { setPlanId(e.target.value); reiniciarResultado(); }}><option value="">Seleccionar plan</option>{planes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className={styles.campo}><label>Operación</label><div className={styles.opciones}><label><input type="radio" name="operacion" checked={operacion === "COMPRA"} disabled={cargando} onChange={() => { setOperacion("COMPRA"); reiniciarResultado(); }} />Compra</label><label><input type="radio" name="operacion" checked={operacion === "RENOVACION"} disabled={cargando} onChange={() => { setOperacion("RENOVACION"); setNumero(""); reiniciarResultado(); }} />Renovación</label></div>{operacion === "RENOVACION" && miembro && !miembro.membership.membershipId && <small className={styles.ayuda}>Este miembro no tiene una membresía que pueda seleccionarse para renovar.</small>}</div>
              <div className={styles.campo}><label>Precio y duración</label><div className={styles.lectura}>{plan ? `$${Number(plan.priceUsd).toFixed(2)} · ${descripcionDuracion(plan)}` : "Selecciona un plan"}</div></div>
              <div className={styles.campo}><label>Beneficios</label><div className={styles.lectura}>{plan ? plan.benefits?.join(", ") || "Sin beneficios registrados" : "Selecciona un plan"}</div></div>
              <div className={styles.campo}><label>Vencimiento previsto</label><div className={styles.lectura}>Se calculará al procesar la solicitud</div></div>
            </div>
            {mensaje && <div role={exito ? "status" : "alert"} className={exito ? styles.exito : styles.error}>{mensaje}</div>}
            {resultado?.ok && <div style={{ marginTop: "20px", padding: "18px", border: "1px solid #cbd5e1", borderRadius: "10px", backgroundColor: "#f8fafc", overflowWrap: "anywhere" }}><h3>Resultado de la solicitud</h3><p><strong>Estado: </strong>{resultado.status ?? "PENDIENTE_PAGO"}</p><p><strong>ID de solicitud: </strong>{resultado.requestId}</p><p><strong>ID de pago: </strong>{resultado.paymentId}</p>{resultado.expectedEndsOn && <p><strong>Vencimiento previsto: </strong>{mostrarFecha(resultado.expectedEndsOn)}</p>}<p>El pago debe confirmarse antes de considerar completada la operación.</p></div>}
            <div className={styles.acciones}><button type="button" className={styles.cancelar} disabled={cargando} onClick={cancelar}>Cancelar</button><button type="button" className={styles.confirmar} disabled={cargando || !!errorPlanes || planes.length === 0 || (operacion === "RENOVACION" && (!miembro?.membership.membershipId))} onClick={confirmarSolicitud}>{cargando ? "Procesando…" : "Confirmar solicitud"}</button></div>
          </section>
        </main>
      </div>
    </div>
  );
}

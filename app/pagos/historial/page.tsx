"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Concepto = "MEMBRESIA" | "SESION_ADICIONAL" | "SESION_PERSONAL";
type Estado = "PAGADO" | "ANULADO";
type Pago = {
  id: string;
  receiptNumber?: string;
  paidAt: string;
  concept: Concepto;
  amountUsd: number;
  status: Estado;
  method: "TARJETA" | "EFECTIVO";
  cancellationReason?: string;
};

const LABELS: Record<Concepto, string> = {
  MEMBRESIA: "Membresía",
  SESION_ADICIONAL: "Sesión adicional",
  SESION_PERSONAL: "Sesión personal",
};
const PAGE_SIZE = 10;

function fechaDePrueba(diasAtras: number, hora = 11): string {
  const fecha = new Date();
  fecha.setHours(hora, 15, 0, 0);
  fecha.setDate(fecha.getDate() - diasAtras);
  return fecha.toISOString();
}

function pagosDeEjemplo(): Pago[] {
  return [
    { id: "p-01", receiptNumber: "C-000145", paidAt: fechaDePrueba(1), concept: "MEMBRESIA", amountUsd: 35, status: "PAGADO", method: "TARJETA" },
    { id: "p-02", receiptNumber: "C-000138", paidAt: fechaDePrueba(6, 16), concept: "SESION_PERSONAL", amountUsd: 10, status: "PAGADO", method: "EFECTIVO" },
    { id: "p-03", receiptNumber: "C-000132", paidAt: fechaDePrueba(13), concept: "SESION_ADICIONAL", amountUsd: 8.50, status: "PAGADO", method: "TARJETA" },
    { id: "p-04", receiptNumber: "C-000125", paidAt: fechaDePrueba(20), concept: "MEMBRESIA", amountUsd: 30, status: "ANULADO", method: "EFECTIVO", cancellationReason: "Cobro registrado por error" },
    { id: "p-05", receiptNumber: "C-000117", paidAt: fechaDePrueba(35), concept: "MEMBRESIA", amountUsd: 35, status: "PAGADO", method: "TARJETA" },
    { id: "p-06", receiptNumber: "C-000104", paidAt: fechaDePrueba(48), concept: "SESION_PERSONAL", amountUsd: 10, status: "PAGADO", method: "EFECTIVO" },
    { id: "p-07", receiptNumber: "C-000096", paidAt: fechaDePrueba(60), concept: "SESION_ADICIONAL", amountUsd: 8.50, status: "PAGADO", method: "TARJETA" },
    { id: "p-08", receiptNumber: "C-000080", paidAt: fechaDePrueba(75), concept: "MEMBRESIA", amountUsd: 35, status: "PAGADO", method: "TARJETA" },
    { id: "p-09", receiptNumber: "C-000074", paidAt: fechaDePrueba(95), concept: "SESION_PERSONAL", amountUsd: 10, status: "ANULADO", method: "EFECTIVO", cancellationReason: "Anulación administrativa" },
    { id: "p-10", receiptNumber: "C-000063", paidAt: fechaDePrueba(115), concept: "MEMBRESIA", amountUsd: 35, status: "PAGADO", method: "EFECTIVO" },
    { id: "p-11", receiptNumber: "C-000050", paidAt: fechaDePrueba(145), concept: "MEMBRESIA", amountUsd: 35, status: "PAGADO", method: "TARJETA" },
    { id: "p-12", receiptNumber: "C-000037", paidAt: fechaDePrueba(170), concept: "SESION_ADICIONAL", amountUsd: 8.50, status: "PAGADO", method: "EFECTIVO" },
  ];
}

function mostrarFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-SV", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function mostrarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function diaLocal(iso: string): string {
  const fecha = new Date(iso);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function validarRango(desde: string, hasta: string): { desde?: string; hasta?: string } {
  if (!desde || !hasta) return {};
  if (hasta < desde) return { hasta: "La fecha final no puede ser anterior a la inicial" };
  const [anio, mes, dia] = desde.split("-").map(Number);
  const limite = new Date(anio, mes - 1, dia);
  limite.setMonth(limite.getMonth() + 12);
  if (hasta > `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, "0")}-${String(limite.getDate()).padStart(2, "0")}`) return { hasta: "El rango no puede superar 12 meses" };
  return {};
}

// Genera un comprobante PDF básico y descargable para el prototipo, sin dependencias.
// En producción se debe descargar el PDF existente del endpoint de H17.
// Reemplaza UNICAMENTE la función crearPdfDemostracion(pago: Pago)
// en app/pagos/historial/page.tsx por esta versión.
// No requiere librerías nuevas ni modifica la interfaz web.
function crearPdfDemostracion(pago: Pago): Blob {
  const limpiar = (valor: string) =>
    valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, " ");
  const pdfTexto = (valor: string) =>
    limpiar(valor).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  // Documento carta (612 x 792 puntos).
  const AZUL = [0.075, 0.137, 0.247];
  const VERDE = [0.063, 0.561, 0.502];
  const GRIS = [0.325, 0.396, 0.486];
  const BORDE = [0.858, 0.894, 0.937];
  const CLARO = [0.956, 0.972, 0.985];
  const BLANCO = [1, 1, 1];
  const ROJO = [0.690, 0.145, 0.188];

  const color = (c: number[]) => c.map(n => n.toFixed(3)).join(" ");
  const pasos: string[] = [];
  const rect = (x: number, y: number, w: number, h: number, c: number[]) => {
    pasos.push(`${color(c)} rg ${x} ${y} ${w} ${h} re f`);
  };
  const linea = (x1: number, y1: number, x2: number, y2: number, c: number[], grosor = 1) => {
    pasos.push(`${color(c)} RG ${grosor} w ${x1} ${y1} m ${x2} ${y2} l S`);
  };
  const texto = (contenido: string, x: number, y: number, size: number, fuente: "F1" | "F2" = "F1", c = AZUL) => {
    pasos.push(`${color(c)} rg BT /${fuente} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfTexto(contenido)}) Tj ET`);
  };

  const anulado = pago.status === "ANULADO";
  const estadoColor = anulado ? ROJO : VERDE;
  const referencia = pago.receiptNumber ?? pago.id;
  const fecha = mostrarFecha(pago.paidAt);
  const hora = mostrarHora(pago.paidAt);
  const concepto = LABELS[pago.concept];
  const monto = `$${pago.amountUsd.toFixed(2)}`;
  const metodo = pago.method === "TARJETA" ? "Tarjeta" : "Efectivo";

  // Cabecera corporativa.
  rect(0, 0, 612, 792, BLANCO);
  rect(0, 660, 612, 132, AZUL);
  rect(0, 654, 612, 6, VERDE);
  rect(42, 709, 42, 42, VERDE);
  texto("G", 54, 721, 24, "F2", BLANCO);
  texto("GKDS", 99, 724, 25, "F2", BLANCO);
  texto("FITNESS", 182, 727, 14, "F1", [0.78, 0.85, 0.91]);
  texto("COMPROBANTE DE PAGO", 42, 683, 13, "F2", BLANCO);

  // Referencia y estatus.
  texto("NUMERO DE COMPROBANTE", 42, 618, 9, "F2", GRIS);
  texto(referencia, 42, 593, 22, "F2");
  rect(417, 590, 153, 38, anulado ? [1.0, 0.925, 0.930] : [0.860, 0.954, 0.929]);
  texto(anulado ? "ANULADO" : "PAGADO", 445, 604, 13, "F2", estadoColor);
  linea(42, 568, 570, 568, BORDE);

  // Gran bloque de monto, con etiqueta clara.
  rect(42, 438, 528, 108, CLARO);
  rect(42, 438, 5, 108, VERDE);
  texto("IMPORTE DEL PAGO", 64, 515, 10, "F2", GRIS);
  texto(monto, 64, 465, 32, "F2");
  texto("USD", 480, 467, 13, "F2", VERDE);

  // Dos columnas con contenido legible.
  texto("DETALLE DE LA OPERACION", 42, 402, 11, "F2");
  linea(42, 386, 570, 386, BORDE);
  texto("Concepto", 42, 355, 10, "F1", GRIS);
  texto(concepto, 42, 333, 13, "F2");
  texto("Metodo de pago", 324, 355, 10, "F1", GRIS);
  texto(metodo, 324, 333, 13, "F2");
  linea(42, 311, 570, 311, BORDE);
  texto("Fecha", 42, 281, 10, "F1", GRIS);
  texto(fecha, 42, 259, 13, "F2");
  texto("Hora", 324, 281, 10, "F1", GRIS);
  texto(hora, 324, 259, 13, "F2");
  linea(42, 237, 570, 237, BORDE);

  if (anulado) {
    rect(42, 151, 528, 66, [1.0, 0.95, 0.95]);
    texto("COMPROBANTE ANULADO", 58, 192, 11, "F2", ROJO);
    const motivo = pago.cancellationReason ?? "Sin detalle";
    texto(`Motivo: ${motivo.substring(0, 62)}`, 58, 170, 10, "F1", ROJO);
  } else {
    texto("Gracias por ser parte de GKDS Fitness.", 42, 185, 12, "F2", AZUL);
    texto("Conserva este comprobante para tus registros.", 42, 164, 10, "F1", GRIS);
  }

  

  const stream = pasos.join("\n") + "\n";
  const encoder = new TextEncoder();
  const len = (s: string) => encoder.encode(s).length;
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${len(stream)} >>\nstream\n${stream}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objetos.forEach((obj, i) => {
    offsets.push(len(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = len(pdf);
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([pdf], { type: "application/pdf" });
}
export default function HistorialPagosPage() {
  const [pagos, setPagos] = useState<Pago[] | null>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtros, setFiltros] = useState({ desde: "", hasta: "" });
  const [errores, setErrores] = useState<{ desde?: string; hasta?: string }>({});
  const [pagina, setPagina] = useState(1);
  const [descargando, setDescargando] = useState<string | null>(null);
  const [errorDescarga, setErrorDescarga] = useState("");

  useEffect(() => {
    const tiempo = setTimeout(() => setPagos(pagosDeEjemplo()), 350);
    return () => clearTimeout(tiempo);
  }, []);

  const filtrados = useMemo(() => (pagos ?? [])
    .filter(p => p.status === "PAGADO" || p.status === "ANULADO")
    .filter(p => (!filtros.desde || diaLocal(p.paidAt) >= filtros.desde) && (!filtros.hasta || diaLocal(p.paidAt) <= filtros.hasta))
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()), [pagos, filtros]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  function aplicarFiltros(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nuevosErrores = validarRango(desde, hasta);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) return;
    setFiltros({ desde, hasta });
    setPagina(1);
  }
  function limpiarFiltros() {
    setDesde(""); setHasta(""); setFiltros({ desde: "", hasta: "" });
    setErrores({}); setPagina(1);
  }
  function descargar(pago: Pago) {
    if (descargando || !pago.receiptNumber) return;
    setErrorDescarga("");
    setDescargando(pago.id);
    try {
      const url = URL.createObjectURL(crearPdfDemostracion(pago));
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `comprobante-${pago.receiptNumber}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      setErrorDescarga("No se pudo descargar el comprobante. Intente de nuevo.");
    } finally { setDescargando(null); }
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}><h1>GKDS <span>FITNESS</span></h1></header>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <p>MENÚ PRINCIPAL</p>
          <nav>
            <Link href="/">Inicio</Link>
            <Link href="/mi-membresia">Mi membresía</Link>
            <Link href="/entrenadores">Entrenadores</Link>
            <Link href="/pagos">Pagos</Link>
            <Link className={styles.active} href="/pagos/historial">Historial de pagos</Link>
            <Link href="/mis-sesiones">Mis sesiones</Link>
          </nav>
        </aside>
        <main className={styles.main}>
          <div className={styles.pageTitle}><h2>Historial de pagos</h2><span>PROTOTIPO</span></div>
          <section className={styles.card}>
            <div className={styles.cardTop}><h3>Mis pagos realizados</h3><span>Consulta y descarga tus comprobantes</span></div>
            <form className={styles.filters} onSubmit={aplicarFiltros} noValidate>
              <div className={styles.field}>
                <label htmlFor="desde">Desde</label>
                <input id="desde" type="date" value={desde} aria-invalid={!!errores.desde} onChange={e => { setDesde(e.target.value); setErrores({}); }} />
                {errores.desde && <small className={styles.errorField}>{errores.desde}</small>}
              </div>
              <div className={styles.field}>
                <label htmlFor="hasta">Hasta</label>
                <input id="hasta" type="date" value={hasta} aria-invalid={!!errores.hasta} onChange={e => { setHasta(e.target.value); setErrores({}); }} />
                {errores.hasta && <small className={styles.errorField}>{errores.hasta}</small>}
              </div>
              <div className={styles.filterActions}>
                <button className={styles.primary} type="submit">Filtrar</button>
                <button className={styles.secondary} type="button" onClick={limpiarFiltros}>Limpiar</button>
              </div>
            </form>
            {errorDescarga && <p role="alert" className={styles.error}>{errorDescarga}</p>}
            {pagos === null ? <div className={styles.empty}>Cargando historial...</div> : filtrados.length === 0 ? <div className={styles.empty}>No tienes pagos en este periodo</div> : <>
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>Fecha</th><th>Hora</th><th>Concepto</th><th>Monto</th><th>Estado</th><th>Comprobante</th></tr></thead>
                  <tbody>{visibles.map(pago => <tr key={pago.id}>
                    <td>{mostrarFecha(pago.paidAt)}</td>
                    <td>{mostrarHora(pago.paidAt)}</td>
                    <td>{LABELS[pago.concept]}</td>
                    <td className={styles.amount}>${pago.amountUsd.toFixed(2)}</td>
                    <td><span className={pago.status === "PAGADO" ? styles.paid : styles.voided}>{pago.status}</span></td>
                    <td>{pago.receiptNumber ? <button className={styles.download} type="button" disabled={descargando !== null} onClick={() => descargar(pago)}>{descargando === pago.id ? "Generando PDF..." : "Descargar PDF"}</button> : "—"}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className={styles.pagination}><span>{filtrados.length} pagos · Página {paginaActual} de {totalPaginas}</span><div><button type="button" disabled={paginaActual <= 1} onClick={() => setPagina(p => p - 1)}>Anterior</button><button type="button" disabled={paginaActual >= totalPaginas} onClick={() => setPagina(p => p + 1)}>Siguiente</button></div></div>
            </>}
            
          </section>
        </main>
      </div>
    </div>
  );
}

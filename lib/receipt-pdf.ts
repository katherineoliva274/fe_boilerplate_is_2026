
export interface DatosComprobante {
  numero: string; 
  miembro: string;
  concepto: string;
  montoUsd: string; 
  metodo: string;
  fechaHora: string; 
  anulado: boolean;
}

const ANCHO = 595;
const ALTO = 842;

function aLatin1(texto: string): string {
  return Array.from(texto, (c) => (c.charCodeAt(0) <= 255 ? c : "?")).join("");
}

function escapar(texto: string): string {
  return aLatin1(texto)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function texto(
  fuente: "F1" | "F2",
  tamano: number,
  x: number,
  y: number,
  contenido: string,
  color: string
): string {
  return `BT /${fuente} ${tamano} Tf ${color} rg ${x} ${y} Td (${escapar(contenido)}) Tj ET\n`;
}

function construirContenido(d: DatosComprobante): string {
  const textoOscuro = "0.09 0.14 0.23";
  const textoSuave = "0.42 0.47 0.56";

  let c = "";

  // Banda superior
  c += "q 0.078 0.137 0.247 rg 0 752 595 90 re f Q\n";
  c += texto("F2", 24, 40, 796, "GKDS FITNESS", "1 1 1");
  c += texto("F1", 12, 40, 774, "Comprobante de pago", "0.73 0.77 0.84");

  c += texto("F1", 11, 40, 716, "Comprobante n.º", textoSuave);
  c += texto("F2", 26, 40, 686, d.numero, textoOscuro);

  const filas: [string, string][] = [
    ["Miembro", d.miembro],
    ["Concepto", d.concepto],
    ["Monto en USD", `$${Number(d.montoUsd).toFixed(2)}`],
    ["Método de pago", d.metodo],
    ["Fecha y hora", d.fechaHora],
  ];

  let y = 630;
  c += "0.88 0.91 0.94 RG 0.8 w 40 650 m 555 650 l S\n";
  for (const [etiqueta, valor] of filas) {
    c += texto("F2", 12, 40, y, etiqueta, textoOscuro);
    c += texto("F1", 12, 220, y, valor, textoOscuro);
    y -= 14;
    c += `0.88 0.91 0.94 RG 0.8 w 40 ${y} m 555 ${y} l S\n`;
    y -= 28;
  }

  c += texto(
    "F1",
    9,
    40,
    60,
    "Documento generado por el prototipo de GKDS Fitness. Pasarela de pago simulada.",
    textoSuave
  );

  if (d.anulado) {
    c +=
      "q 0.9063 0.4226 -0.4226 0.9063 120 250 cm " +
      "BT /F2 86 Tf 0.78 0.16 0.16 rg 0 0 Td (ANULADO) Tj ET Q\n";
  }

  return c;
}

export function generarPdfComprobante(datos: DatosComprobante): Blob {
  const contenido = construirContenido(datos);

  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ANCHO} ${ALTO}] ` +
      "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${contenido.length} >>\nstream\n${contenido}endstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const posiciones: number[] = [];
  objetos.forEach((objeto, indice) => {
    posiciones.push(pdf.length);
    pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
  });

  const inicioXref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const posicion of posiciones) {
    pdf += `${String(posicion).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;

  const bytes = new Uint8Array(new ArrayBuffer(pdf.length));
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i);

  return new Blob([bytes], { type: "application/pdf" });
}

export function descargarArchivo(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Concepto = "MEMBRESIA" | "SESION_ADICIONAL";
type EstadoPago = "PENDIENTE" | "PAGADO" | "ANULADO";

interface Pago {
  id: string;
  concept: Concepto;
  amountUsd: string;
  dueDate: string;
  status: EstadoPago;
  paidAt?: string;
  receiptNumber?: string;
  cardLast4?: string;
  gatewayRef?: string;
}

interface AlmacenPagos {
  pagos: Pago[];
  siguienteComprobante: number;
}

const CLAVE_PAGOS = "gkds_pagos_prototipo";

const menu = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Membresías", ruta: "/admin/membresias" },
  { nombre: "Clases y reservas", ruta: "/clases" },
  { nombre: "Entrenadores", ruta: "/entrenadores" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Máquinas", ruta: "/maquinas" },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
  { nombre: "Reportes", ruta: "/reportes" },
];

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

function claveIso(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

function mostrarFechaIso(texto: string): string {
  const [anio, mes, dia] = texto.split("-");
  return `${dia}/${mes}/${anio}`;
}

function mostrarMonto(monto: string): string {
  return `$${Number(monto).toFixed(2)}`;
}

function nombreConcepto(concepto: Concepto): string {
  return concepto === "MEMBRESIA" ? "Membresía" : "Sesión adicional";
}

function crearAlmacenInicial(ahora: Date): AlmacenPagos {
  const enDias = (n: number) =>
    claveIso(
      new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + n)
    );

  return {
    pagos: [
      { id: "pay-0", concept: "MEMBRESIA", amountUsd: "25.00", dueDate: enDias(-25), status: "PAGADO", paidAt: new Date(ahora.getTime() - 25 * 86400000).toISOString(), receiptNumber: "C-000001", cardLast4: "4242", gatewayRef: "SIM-0" },
      { id: "pay-1", concept: "MEMBRESIA", amountUsd: "25.00", dueDate: enDias(2), status: "PENDIENTE" },
      { id: "pay-2", concept: "SESION_ADICIONAL", amountUsd: "8.50", dueDate: enDias(5), status: "PENDIENTE" },
      { id: "pay-3", concept: "MEMBRESIA", amountUsd: "45.00", dueDate: enDias(9), status: "PENDIENTE" },
    ],
    siguienteComprobante: 2,
  };
}

function leerAlmacen(): AlmacenPagos | null {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_PAGOS);
    return crudo ? (JSON.parse(crudo) as AlmacenPagos) : null;
  } catch {
    return null;
  }
}

function guardarAlmacen(almacen: AlmacenPagos) {
  window.sessionStorage.setItem(CLAVE_PAGOS, JSON.stringify(almacen));
}

export default function PagosPendientesPage() {
  const [almacen, setAlmacen] = useState<AlmacenPagos | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      let datos = leerAlmacen();
      if (!datos) {
        datos = crearAlmacenInicial(new Date());
        try {
          guardarAlmacen(datos);
        } catch {
        }
      }
      setAlmacen(datos);
      setCargado(true);
    }, 400);

    return () => clearTimeout(temporizador);
  }, []);

  const pendientes = (almacen?.pagos ?? [])
    .filter((p) => p.status === "PENDIENTE")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className={styles.contenedor}>
      <header className={styles.encabezado}>
        <h1>
          GKDS <span>FITNESS</span>
        </h1>
      </header>

      <div className={styles.estructura}>
        <aside className={styles.sidebar}>
          <p className={styles.menuTitulo}>MENÚ PRINCIPAL</p>
          <nav className={styles.navegacion}>
            {menu.map((opcion) => (
              <Link
                href={opcion.ruta}
                key={opcion.nombre}
                className={
                  opcion.nombre === "Pagos"
                    ? styles.menuActivo
                    : styles.menuItem
                }
              >
                {opcion.nombre}
              </Link>
            ))}
          </nav>
        </aside>

        <main className={styles.contenido}>
          <div className={styles.tituloSeccion}>
            <h2>Mis pagos</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          <section className={styles.tarjeta}>
            <h3>Cobros pendientes</h3>

            {!cargado ? (
              <p role="status" className={styles.estado}>
                Cargando pagos...
              </p>
            ) : pendientes.length === 0 ? (
              <p role="status" className={styles.estado}>
                No tienes pagos pendientes
              </p>
            ) : (
              <div className={styles.tablaContenedor}>
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>Monto (USD)</th>
                      <th>Vencimiento</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendientes.map((pago) => (
                      <tr key={pago.id}>
                        <td className={styles.destacado}>
                          {nombreConcepto(pago.concept)}
                        </td>
                        <td>{mostrarMonto(pago.amountUsd)}</td>
                        <td>{mostrarFechaIso(pago.dueDate)}</td>
                        <td>
                          <span className={styles.insignia}>PENDIENTE</span>
                        </td>
                        <td>
                          <Link
                            href={`/pagos/${pago.id}/pagar`}
                            className={styles.pagar}
                          >
                            Pagar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

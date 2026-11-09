
"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Operacion = "COMPRA" | "RENOVACION";
type Estado = "VIGENTE" | "VENCIDA" | "SIN_MEMBRESIA";
type TipoPlan = "MONTHLY" | "QUARTERLY" | "BY_CLASSES";

interface Miembro {
  numero: string;
  nombre: string;
  estado: Estado;
  vencimiento: string | null;
}

interface Plan {
  id: string;
  nombre: string;
  tipo: TipoPlan;
  precio: number;
  meses?: number;
  dias?: number;
  creditos?: number;
  beneficios: string[];
  activo: boolean;
}

// Datos temporales para probar la pantalla.
const miembros: Miembro[] = [
  {
    numero: "M-000001",
    nombre: "María López",
    estado: "VIGENTE",
    vencimiento: "2026-11-30",
  },
  {
    numero: "M-000002",
    nombre: "Carlos Martínez",
    estado: "VENCIDA",
    vencimiento: "2026-10-15",
  },
  {
    numero: "M-000003",
    nombre: "Ana Rodríguez",
    estado: "SIN_MEMBRESIA",
    vencimiento: null,
  },
];

const planes: Plan[] = [
  {
    id: "mensual",
    nombre: "Plan mensual",
    tipo: "MONTHLY",
    precio: 25,
    meses: 1,
    beneficios: ["Acceso al gimnasio", "Uso de máquinas"],
    activo: true,
  },
  {
    id: "trimestral",
    nombre: "Plan trimestral",
    tipo: "QUARTERLY",
    precio: 65,
    meses: 3,
    beneficios: [
      "Acceso al gimnasio",
      "Uso de máquinas",
      "Clases grupales",
    ],
    activo: true,
  },
  {
    id: "clases",
    nombre: "Plan por clases",
    tipo: "BY_CLASSES",
    precio: 20,
    dias: 30,
    creditos: 8,
    beneficios: ["8 clases grupales"],
    activo: true,
  },
  {
    id: "inactivo",
    nombre: "Plan promocional",
    tipo: "MONTHLY",
    precio: 15,
    meses: 1,
    beneficios: ["Acceso al gimnasio"],
    activo: false,
  },
];

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

function sumarPeriodo(fecha: Date, plan: Plan): Date {
  const resultado = new Date(fecha);

  if (plan.tipo === "BY_CLASSES") {
    resultado.setUTCDate(resultado.getUTCDate() + (plan.dias ?? 0));
  } else {
    const meses = plan.meses ?? 0;
    const diaOriginal = resultado.getUTCDate();

    resultado.setUTCDate(1);
    resultado.setUTCMonth(resultado.getUTCMonth() + meses);

    const ultimoDia = new Date(
      Date.UTC(
        resultado.getUTCFullYear(),
        resultado.getUTCMonth() + 1,
        0
      )
    ).getUTCDate();

    resultado.setUTCDate(Math.min(diaOriginal, ultimoDia));
  }

  return resultado;
}

function fechaISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

function mostrarFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export default function CompraRenovacionPage() {
  const [numero, setNumero] = useState("");
  const [planId, setPlanId] = useState("");
  const [operacion, setOperacion] = useState<Operacion>("COMPRA");
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);

  const miembro = miembros.find(
    (m) => m.numero.toLowerCase() === numero.trim().toLowerCase()
  );

  const plan = planes.find((p) => p.id === planId);

  const fechaHoy = fechaISO(new Date());

  function calcularVencimiento(): string {
    if (!plan) return "";

    let inicio = new Date(`${fechaHoy}T12:00:00Z`);

    if (
      operacion === "RENOVACION" &&
      miembro?.estado === "VIGENTE" &&
      miembro.vencimiento
    ) {
      inicio = new Date(`${miembro.vencimiento}T12:00:00Z`);
      inicio.setUTCDate(inicio.getUTCDate() + 1);
    }

    return mostrarFecha(fechaISO(sumarPeriodo(inicio, plan)));
  }

  function confirmarSolicitud() {
    setExito(false);

    if (!numero.trim() || !planId) {
      setMensaje("Completa los campos obligatorios.");
      return;
    }

    if (!miembro) {
      setMensaje("Miembro no encontrado.");
      return;
    }

    if (!plan || !plan.activo) {
      setMensaje("El plan seleccionado no está disponible.");
      return;
    }

    if (operacion === "COMPRA" && miembro.estado === "VIGENTE") {
      setMensaje(
        "El miembro ya tiene una membresía vigente. Seleccione la opción Renovación."
      );
      return;
    }

    if (
      operacion === "RENOVACION" &&
      miembro.estado === "SIN_MEMBRESIA"
    ) {
      setMensaje(
        "El miembro no tiene una membresía anterior. Seleccione Compra."
      );
      return;
    }

    setMensaje(
      "Simulación correcta. Solicitud pendiente de conexión con el backend."
    );
    setExito(true);
  }

  return (
    <div className={styles.contenedor}>
      <header className={styles.encabezado}>
        <h1>GKDS/GYM</h1>
      </header>

      <div className={styles.estructura}>
        <aside className={styles.sidebar}>
          <nav className={styles.navegacion}>
            {menu.map((opcion) => (
              <Link
                href={opcion.ruta}
                key={opcion.nombre}
                className={
                  opcion.nombre === "Membresías"
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
            <h2>Compra o renovación</h2>
            <span className={styles.etiqueta}>Prototipo</span>
          </div>

          <section className={styles.tarjeta}>
            <h3>Formulario</h3>

            <div className={styles.formulario}>
              <div className={styles.campo}>
                <label htmlFor="numero">Número de miembro</label>
                <input
                  id="numero"
                  value={numero}
                  maxLength={30}
                  placeholder="Ej. M-000001"
                  onChange={(e) => {
                    setNumero(e.target.value);
                    setMensaje("");
                  }}
                />
                {miembro && (
                  <span className={styles.ayuda}>
                    {miembro.nombre} · {miembro.estado}
                  </span>
                )}
              </div>

              <div className={styles.campo}>
                <label htmlFor="plan">Plan activo</label>
                <select
                  id="plan"
                  value={planId}
                  onChange={(e) => {
                    setPlanId(e.target.value);
                    setMensaje("");
                  }}
                >
                  <option value="">Seleccionar plan</option>
                  {planes.filter((p) => p.activo).map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.campo}>
                <label>Operación</label>
                <div className={styles.opciones}>
                  <label>
                    <input
                      type="radio"
                      name="operacion"
                      checked={operacion === "COMPRA"}
                      onChange={() => {
                        setOperacion("COMPRA");
                        setMensaje("");
                      }}
                    />
                    Compra
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="operacion"
                      checked={operacion === "RENOVACION"}
                      onChange={() => {
                        setOperacion("RENOVACION");
                        setMensaje("");
                      }}
                    />
                    Renovación
                  </label>
                </div>
              </div>

              <div className={styles.campo}>
                <label>Precio y duración</label>
                <div className={styles.lectura}>
                  {plan
                    ? `$${plan.precio.toFixed(2)} · ${
                        plan.tipo === "BY_CLASSES"
                          ? `${plan.dias} días / ${plan.creditos} clases`
                          : `${plan.meses} mes(es)`
                      }`
                    : "Selecciona un plan"}
                </div>
              </div>

              <div className={styles.campo}>
                <label>Beneficios</label>
                <div className={styles.lectura}>
                  {plan
                    ? plan.beneficios.join(", ")
                    : "Selecciona un plan"}
                </div>
              </div>

              <div className={styles.campo}>
                <label>Vencimiento previsto</label>
                <div className={styles.lectura}>
                  {plan ? calcularVencimiento() : "Sin calcular"}
                </div>
              </div>
            </div>

            {mensaje && (
              <div
                role="status"
                className={exito ? styles.exito : styles.error}
              >
                {mensaje}
              </div>
            )}

            <div className={styles.acciones}>
              <button
                type="button"
                className={styles.cancelar}
                onClick={() => {
                  setNumero("");
                  setPlanId("");
                  setOperacion("COMPRA");
                  setMensaje("");
                  setExito(false);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmar}
                onClick={confirmarSolicitud}
              >
                Confirmar solicitud
              </button>
            </div>
          </section>

    
        </main>
      </div>
    </div>
  );
}

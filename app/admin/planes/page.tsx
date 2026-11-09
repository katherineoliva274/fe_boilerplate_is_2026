
"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Modalidad = "MONTHLY" | "QUARTERLY" | "BY_CLASSES";
type Estado = "ACTIVO" | "INACTIVO";

interface Plan {
  id: number;
  nombre: string;
  modalidad: Modalidad;
  precio: number;
  duracion: number;
  creditos: number | null;
  beneficios: string[];
  estado: Estado;
}

interface Formulario {
  nombre: string;
  modalidad: Modalidad;
  precio: string;
  duracion: string;
  creditos: string;
  beneficios: string;
}

const planesIniciales: Plan[] = [
  {
    id: 1,
    nombre: "Plan mensual",
    modalidad: "MONTHLY",
    precio: 25,
    duracion: 1,
    creditos: null,
    beneficios: ["Acceso al gimnasio", "Uso de máquinas"],
    estado: "ACTIVO",
  },
  {
    id: 2,
    nombre: "Plan trimestral",
    modalidad: "QUARTERLY",
    precio: 65,
    duracion: 3,
    creditos: null,
    beneficios: [
      "Acceso al gimnasio",
      "Uso de máquinas",
      "Clases grupales",
    ],
    estado: "ACTIVO",
  },
  {
    id: 3,
    nombre: "Plan por clases",
    modalidad: "BY_CLASSES",
    precio: 20,
    duracion: 30,
    creditos: 8,
    beneficios: ["Acceso a ocho clases grupales"],
    estado: "ACTIVO",
  },
  {
    id: 4,
    nombre: "Plan promocional",
    modalidad: "MONTHLY",
    precio: 15,
    duracion: 1,
    creditos: null,
    beneficios: ["Acceso al gimnasio"],
    estado: "INACTIVO",
  },
];

const formularioVacio: Formulario = {
  nombre: "",
  modalidad: "MONTHLY",
  precio: "",
  duracion: "1",
  creditos: "",
  beneficios: "",
};

const menu = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Membresías", ruta: "/admin/planes" },
  { nombre: "Clases y reservas", ruta: "/clases" },
  { nombre: "Entrenadores", ruta: "/entrenadores" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Máquinas", ruta: "/maquinas" },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
  { nombre: "Reportes", ruta: "/reportes" },
];

function textoModalidad(modalidad: Modalidad): string {
  switch (modalidad) {
    case "MONTHLY":
      return "Mensual";
    case "QUARTERLY":
      return "Trimestral";
    case "BY_CLASSES":
      return "Por clases";
  }
}

export default function AdministracionPlanesPage() {
  const [planes, setPlanes] = useState(planesIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(
    formularioVacio
  );
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const planesFiltrados = planes.filter((plan) => {
    const coincideNombre = plan.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === "TODOS" || plan.estado === filtroEstado;

    return coincideNombre && coincideEstado;
  });

  function cambiarCampo(
    campo: keyof Formulario,
    valor: string
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
    setError("");
  }

  function abrirNuevo() {
    setEditandoId(null);
    setFormulario({ ...formularioVacio });
    setError("");
    setMensaje("");
    setFormularioAbierto(true);
  }

  function abrirEditar(plan: Plan) {
    setEditandoId(plan.id);

    setFormulario({
      nombre: plan.nombre,
      modalidad: plan.modalidad,
      precio: String(plan.precio),
      duracion: String(plan.duracion),
      creditos: plan.creditos === null ? "" : String(plan.creditos),
      beneficios: plan.beneficios.join(", "),
    });

    setError("");
    setMensaje("");
    setFormularioAbierto(true);
  }

  function cerrarFormulario() {
    setFormularioAbierto(false);
    setEditandoId(null);
    setError("");
  }

  function guardarPlan(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const nombre = formulario.nombre.trim();
    const precio = Number(formulario.precio);
    const duracion = Number(formulario.duracion);
    const creditos = Number(formulario.creditos);
    const porClases = formulario.modalidad === "BY_CLASSES";

    if (!nombre) {
      setError("El nombre del plan es obligatorio.");
      return;
    }

    if (nombre.length > 80) {
      setError("El nombre no puede superar 80 caracteres.");
      return;
    }

    if (
      formulario.precio.trim() === "" ||
      !Number.isFinite(precio) ||
      precio < 0
    ) {
      setError("El precio debe ser un número mayor o igual a cero.");
      return;
    }

    if (
      formulario.duracion.trim() === "" ||
      !Number.isInteger(duracion) ||
      duracion < 1
    ) {
      setError("La duración debe ser un número entero mayor o igual a 1.");
      return;
    }

    if (
      porClases &&
      (formulario.creditos.trim() === "" ||
        !Number.isInteger(creditos) ||
        creditos < 1)
    ) {
      setError("El plan por clases debe tener al menos un crédito.");
      return;
    }

    const beneficios = formulario.beneficios
      .split(",")
      .map((beneficio) => beneficio.trim())
      .filter(Boolean);

    const datosPlan = {
      nombre,
      modalidad: formulario.modalidad,
      precio,
      duracion,
      creditos: porClases ? creditos : null,
      beneficios,
    };

    if (editandoId !== null) {
      setPlanes((anteriores) =>
        anteriores.map((plan) =>
          plan.id === editandoId
            ? { ...plan, ...datosPlan }
            : plan
        )
      );
      setMensaje("Plan actualizado en la demostración.");
    } else {
      const nuevoPlan: Plan = {
        id: Math.max(0, ...planes.map((plan) => plan.id)) + 1,
        ...datosPlan,
        estado: "ACTIVO",
      };

      setPlanes((anteriores) => [...anteriores, nuevoPlan]);
      setMensaje("Plan agregado en la demostración.");
    }

    cerrarFormulario();
  }

  function cambiarEstado(plan: Plan) {
    const nuevoEstado: Estado =
      plan.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    setPlanes((anteriores) =>
      anteriores.map((actual) =>
        actual.id === plan.id
          ? { ...actual, estado: nuevoEstado }
          : actual
      )
    );

    setMensaje(
      `El plan "${plan.nombre}" ahora está ${nuevoEstado}.`
    );
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
                key={opcion.nombre}
                href={opcion.ruta}
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
            <h2>Planes de membresía</h2>
            <span className={styles.etiqueta}>Prototipo</span>
          </div>

          <section className={styles.tarjeta}>
            <div className={styles.cabeceraTabla}>
              <h3>Consulta y filtros</h3>

              <button
                type="button"
                className={styles.botonPrincipal}
                onClick={abrirNuevo}
              >
                + Agregar plan
              </button>
            </div>

            <div className={styles.filtros}>
              <input
                type="search"
                placeholder="Buscar por nombre del plan"
                aria-label="Buscar plan"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />

              <select
                aria-label="Filtrar por estado"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>

            {mensaje && (
              <div className={styles.mensaje} role="status">
                {mensaje}
              </div>
            )}

            <div className={styles.tablaContenedor}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Modalidad</th>
                    <th>Precio</th>
                    <th>Duración</th>
                    <th>Beneficios</th>
                    <th>Créditos</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {planesFiltrados.map((plan) => (
                    <tr key={plan.id}>
                      <td>{plan.nombre}</td>
                      <td>{textoModalidad(plan.modalidad)}</td>
                      <td>${plan.precio.toFixed(2)}</td>
                      <td>
                        {plan.duracion}{" "}
                        {plan.modalidad === "BY_CLASSES"
                          ? "día(s)"
                          : "mes(es)"}
                      </td>
                      <td>{plan.beneficios.join(", ") || "Sin beneficios"}</td>
                      <td>{plan.creditos ?? "No aplica"}</td>
                      <td>
                        <span
                          className={
                            plan.estado === "ACTIVO"
                              ? styles.activo
                              : styles.inactivo
                          }
                        >
                          {plan.estado}
                        </span>
                      </td>
                      <td>
                        <div className={styles.accionesTabla}>
                          <button
                            type="button"
                            onClick={() => abrirEditar(plan)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => cambiarEstado(plan)}
                          >
                            {plan.estado === "ACTIVO"
                              ? "Desactivar"
                              : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {planesFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={8} className={styles.sinDatos}>
                        No hay planes con esos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className={styles.contador}>
              Mostrando {planesFiltrados.length} de {planes.length} planes
            </p>
          </section>

          {formularioAbierto && (
            <div className={styles.modalFondo}>
              <section
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tituloFormulario"
              >
                <h3 id="tituloFormulario">
                  {editandoId !== null
                    ? "Editar plan"
                    : "Agregar plan"}
                </h3>

                <form onSubmit={guardarPlan}>
                  <div className={styles.formulario}>
                    <div className={styles.campo}>
                      <label htmlFor="nombre">Nombre del plan</label>
                      <input
                        id="nombre"
                        maxLength={80}
                        value={formulario.nombre}
                        onChange={(e) =>
                          cambiarCampo("nombre", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className={styles.campo}>
                      <label htmlFor="modalidad">Modalidad</label>
                      <select
                        id="modalidad"
                        value={formulario.modalidad}
                        onChange={(e) => {
                          const tipo = e.target.value as Modalidad;

                          setFormulario((anterior) => ({
                            ...anterior,
                            modalidad: tipo,
                            duracion:
                              tipo === "QUARTERLY"
                                ? "3"
                                : tipo === "MONTHLY"
                                  ? "1"
                                  : "30",
                            creditos:
                              tipo === "BY_CLASSES"
                                ? anterior.creditos
                                : "",
                          }));

                          setError("");
                        }}
                      >
                        <option value="MONTHLY">Mensual</option>
                        <option value="QUARTERLY">Trimestral</option>
                        <option value="BY_CLASSES">Por clases</option>
                      </select>
                    </div>

                    <div className={styles.campo}>
                      <label htmlFor="precio">Precio en USD</label>
                      <input
                        id="precio"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formulario.precio}
                        onChange={(e) =>
                          cambiarCampo("precio", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className={styles.campo}>
                      <label htmlFor="duracion">
                        Duración (
                        {formulario.modalidad === "BY_CLASSES"
                          ? "días"
                          : "meses"}
                        )
                      </label>
                      <input
                        id="duracion"
                        type="number"
                        min="1"
                        step="1"
                        value={formulario.duracion}
                        disabled={formulario.modalidad !== "BY_CLASSES"}
                        onChange={(e) =>
                          cambiarCampo("duracion", e.target.value)
                        }
                        required
                      />
                    </div>

                    {formulario.modalidad === "BY_CLASSES" && (
                      <div className={styles.campo}>
                        <label htmlFor="creditos">
                          Cantidad de créditos
                        </label>
                        <input
                          id="creditos"
                          type="number"
                          min="1"
                          step="1"
                          value={formulario.creditos}
                          onChange={(e) =>
                            cambiarCampo("creditos", e.target.value)
                          }
                          required
                        />
                      </div>
                    )}

                    <div className={styles.campoAncho}>
                      <label htmlFor="beneficios">
                        Beneficios (separados por comas)
                      </label>
                      <textarea
                        id="beneficios"
                        value={formulario.beneficios}
                        rows={3}
                        placeholder="Acceso al gimnasio, Uso de máquinas"
                        onChange={(e) =>
                          cambiarCampo("beneficios", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {error && (
                    <div className={styles.error} role="alert">
                      {error}
                    </div>
                  )}

                  <div className={styles.accionesModal}>
                    <button
                      type="button"
                      className={styles.botonSecundario}
                      onClick={cerrarFormulario}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className={styles.botonPrincipal}
                    >
                      Guardar plan
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

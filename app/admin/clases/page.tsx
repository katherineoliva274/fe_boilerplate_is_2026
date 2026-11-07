"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type EstadoSesion = "PROGRAMADA" | "EN_CURSO" | "COMPLETADA" | "CANCELADA";

interface Plantilla {
  id: string;
  name: string;
  trainerId: string;
  roomId: string;
  weekday: number; 
  startTime: string; 
  durationMinutes: number;
  capacity: number;
  status: "ACTIVA";
}

interface SesionAdmin {
  id: string;
  templateId: string;
  name: string;
  trainerId: string;
  trainerName: string;
  roomId: string;
  roomName: string;
  startsAt: string; 
  endsAt: string; 
  capacity: number;
  confirmedReservations: number;
  status: EstadoSesion;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledReservations?: number;
}

interface AlmacenAdmin {
  plantillas: Plantilla[];
  sesiones: SesionAdmin[];
}

interface Formulario {
  nombre: string;
  entrenadorId: string;
  salaId: string;
  dia: string;
  hora: string;
  duracion: string;
  cupo: string;
  desde: string;
  hasta: string;
}

type Errores = Partial<
  Record<
    | "nombre"
    | "entrenador"
    | "sala"
    | "dia"
    | "hora"
    | "duracion"
    | "cupo"
    | "rango",
    string
  >
>;

const CLAVE_ADMIN = "gkds_admin_clases_prototipo";

const ENTRENADORES = [
  { id: "t-1", nombre: "Laura Hernández" },
  { id: "t-2", nombre: "Diego Ramírez" },
];

const SALAS = [
  { id: "r-1", nombre: "Sala funcional", capacidad: 20 },
  { id: "r-2", nombre: "Sala de spinning", capacidad: 15 },
  { id: "r-3", nombre: "Sala de entrenamiento grupal", capacidad: 30 },
];

const DIAS = [
  { valor: 1, nombre: "Lunes" },
  { valor: 2, nombre: "Martes" },
  { valor: 3, nombre: "Miércoles" },
  { valor: 4, nombre: "Jueves" },
  { valor: 5, nombre: "Viernes" },
  { valor: 6, nombre: "Sábado" },
  { valor: 7, nombre: "Domingo" },
];

const DURACIONES = [30, 45, 60, 75, 90, 120];

const FORMULARIO_VACIO: Formulario = {
  nombre: "",
  entrenadorId: "",
  salaId: "",
  dia: "",
  hora: "",
  duracion: "",
  cupo: "",
  desde: "",
  hasta: "",
};

const MENSAJE_CONFLICTO = "Existe un conflicto de horario";
const MENSAJE_SERVIDOR = "No se pudieron guardar los cambios";

const menu = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Membresías", ruta: "/admin/membresias" },
  { nombre: "Clases y reservas", ruta: "/admin/clases" },
  { nombre: "Entrenadores", ruta: "/entrenadores" },
  { nombre: "Pagos", ruta: "/pagos" },
  { nombre: "Máquinas", ruta: "/maquinas" },
  { nombre: "Notificaciones", ruta: "/notificaciones" },
  { nombre: "Reportes", ruta: "/reportes" },
];

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

function mostrarHora(fecha: Date): string {
  return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

function mostrarFecha(fecha: Date): string {
  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function leerFecha(texto: string): Date {
  const [anio, mes, dia] = texto.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function claveFecha(fecha: Date): string {
  return `${fecha.getFullYear()}${dosDigitos(fecha.getMonth() + 1)}${dosDigitos(fecha.getDate())}`;
}

function diaSemanaIso(fecha: Date): number {
  return fecha.getDay() === 0 ? 7 : fecha.getDay();
}

function nombreDia(valor: number): string {
  return DIAS.find((d) => d.valor === valor)?.nombre ?? "";
}

function leerAlmacen(): AlmacenAdmin | null {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_ADMIN);
    return crudo ? (JSON.parse(crudo) as AlmacenAdmin) : null;
  } catch {
    return null;
  }
}

function guardarAlmacen(almacen: AlmacenAdmin) {
  window.sessionStorage.setItem(CLAVE_ADMIN, JSON.stringify(almacen));
}

function generarSesiones(
  plantilla: Plantilla,
  desde: Date,
  hasta: Date,
  existentes: SesionAdmin[]
): SesionAdmin[] {
  const entrenador = ENTRENADORES.find((e) => e.id === plantilla.trainerId);
  const sala = SALAS.find((s) => s.id === plantilla.roomId);
  const [hora, minuto] = plantilla.startTime.split(":").map(Number);
  const nuevas: SesionAdmin[] = [];

  for (
    let dia = new Date(desde);
    dia <= hasta;
    dia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1)
  ) {
    if (diaSemanaIso(dia) !== plantilla.weekday) continue;

    const inicio = new Date(
      dia.getFullYear(),
      dia.getMonth(),
      dia.getDate(),
      hora,
      minuto
    );
    const fin = new Date(inicio.getTime() + plantilla.durationMinutes * 60000);
    const yaExiste = existentes
      .concat(nuevas)
      .some(
        (s) =>
          s.templateId === plantilla.id && s.startsAt === inicio.toISOString()
      );
    if (yaExiste) continue;

    nuevas.push({
      id: `ses-${plantilla.id}-${claveFecha(inicio)}`,
      templateId: plantilla.id,
      name: plantilla.name,
      trainerId: plantilla.trainerId,
      trainerName: entrenador?.nombre ?? "",
      roomId: plantilla.roomId,
      roomName: sala?.nombre ?? "",
      startsAt: inicio.toISOString(),
      endsAt: fin.toISOString(),
      capacity: plantilla.capacity,
      confirmedReservations: 0,
      status: "PROGRAMADA",
    });
  }

  return nuevas;
}

function crearAlmacenInicial(ahora: Date): AlmacenAdmin {
  const plantillas: Plantilla[] = [
    { id: "cls-1", name: "Funcional", trainerId: "t-1", roomId: "r-1", weekday: 1, startTime: "07:00", durationMinutes: 60, capacity: 15, status: "ACTIVA" },
    { id: "cls-2", name: "Spinning", trainerId: "t-2", roomId: "r-2", weekday: 3, startTime: "18:30", durationMinutes: 45, capacity: 12, status: "ACTIVA" },
    { id: "cls-3", name: "HIIT grupal", trainerId: "t-1", roomId: "r-3", weekday: 5, startTime: "17:30", durationMinutes: 60, capacity: 20, status: "ACTIVA" },
  ];

  const base = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const desde = new Date(base.getFullYear(), base.getMonth(), base.getDate() - 6);
  const hasta = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 14);

  let contador = 0;
  const sesiones = plantillas
    .flatMap((p) => generarSesiones(p, desde, hasta, []))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((s) => {
      contador += 1;
      const reservas = (contador * 7 + 3) % (s.capacity + 1);
      return { ...s, confirmedReservations: contador % 4 === 0 ? 0 : reservas };
    });

  return { plantillas, sesiones };
}

function estadoEfectivo(sesion: SesionAdmin, ahora: Date): EstadoSesion {
  if (sesion.status !== "PROGRAMADA") return sesion.status;
  if (ahora >= new Date(sesion.endsAt)) return "COMPLETADA";
  if (ahora >= new Date(sesion.startsAt)) return "EN_CURSO";
  return "PROGRAMADA";
}

function etiquetaEstado(estado: EstadoSesion): string {
  return estado === "EN_CURSO" ? "EN CURSO" : estado;
}

function hayConflicto(
  candidata: Omit<Plantilla, "id" | "status">,
  plantillas: Plantilla[],
  ignorarId: string | null
): boolean {
  const inicioA = aMinutos(candidata.startTime);
  const finA = inicioA + candidata.durationMinutes;

  return plantillas.some((p) => {
    if (p.id === ignorarId || p.weekday !== candidata.weekday) return false;
    const inicioB = aMinutos(p.startTime);
    const finB = inicioB + p.durationMinutes;
    const seCruzan = inicioA < finB && finA > inicioB;
    return (
      seCruzan &&
      (p.roomId === candidata.roomId || p.trainerId === candidata.trainerId)
    );
  });
}

function validar(f: Formulario): Errores {
  const errores: Errores = {};

  const nombre = f.nombre.trim();
  if (nombre.length < 3 || nombre.length > 80) {
    errores.nombre = "El nombre debe tener entre 3 y 80 caracteres";
  }
  if (!f.entrenadorId) errores.entrenador = "Selecciona un entrenador";
  if (!f.salaId) errores.sala = "Selecciona una sala";
  if (!f.dia) errores.dia = "Selecciona un día";

  if (!f.hora) {
    errores.hora = "Ingresa la hora de inicio";
  } else if (
    f.duracion &&
    aMinutos(f.hora) + Number(f.duracion) > 24 * 60
  ) {
    errores.hora = "La clase debe terminar el mismo día";
  }

  if (!f.duracion) errores.duracion = "Selecciona una duración";

  const cupo = Number(f.cupo);
  const sala = SALAS.find((s) => s.id === f.salaId);
  if (!f.cupo || !Number.isInteger(cupo) || cupo < 1 || cupo > 50) {
    errores.cupo = "El cupo debe ser un número entero entre 1 y 50";
  } else if (sala && cupo > sala.capacidad) {
    errores.cupo = `El cupo no puede superar la capacidad de la sala (${sala.capacidad})`;
  }

  if (f.desde || f.hasta) {
    if (!f.desde || !f.hasta) {
      errores.rango = "Indica la fecha inicial y la final";
    } else {
      const dias =
        Math.round(
          (leerFecha(f.hasta).getTime() - leerFecha(f.desde).getTime()) /
            86400000
        ) + 1;
      if (dias < 1) {
        errores.rango = "La fecha final debe ser igual o posterior a la inicial";
      } else if (dias > 28) {
        errores.rango = "El rango debe ser de 1 a 28 días";
      }
    }
  }

  return errores;
}

export default function AdminClasesPage() {
  const [almacen, setAlmacen] = useState<AlmacenAdmin | null>(null);
  const [ahora, setAhora] = useState<Date | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState("");
  const [conflicto, setConflicto] = useState("");
  const [errorServidor, setErrorServidor] = useState("");

  useEffect(() => {
    const temporizador = setTimeout(() => {
      const actual = new Date();
      const guardado = leerAlmacen();
      const datos = guardado ?? crearAlmacenInicial(actual);
      if (!guardado) {
        try {
          guardarAlmacen(datos);
        } catch {
        }
      }
      setAhora(actual);
      setAlmacen(datos);
    }, 400);

    return () => clearTimeout(temporizador);
  }, []);

  const plantillas = almacen?.plantillas ?? [];
  const sesiones = [...(almacen?.sesiones ?? [])].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt)
  );
  const nombresClases = Array.from(new Set(plantillas.map((p) => p.name)));

  function limpiarMensajes() {
    setExito("");
    setConflicto("");
    setErrorServidor("");
  }

  function cambiar(
    campo: keyof Formulario,
    valor: string,
    ...erroresAfectados: (keyof Errores)[]
  ) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    if (erroresAfectados.length > 0) {
      setErrores((actual) => {
        const siguiente = { ...actual };
        erroresAfectados.forEach((clave) => delete siguiente[clave]);
        return siguiente;
      });
    }
  }

  function editar(plantilla: Plantilla) {
    limpiarMensajes();
    setErrores({});
    setEditandoId(plantilla.id);
    setFormulario({
      nombre: plantilla.name,
      entrenadorId: plantilla.trainerId,
      salaId: plantilla.roomId,
      dia: String(plantilla.weekday),
      hora: plantilla.startTime,
      duracion: String(plantilla.durationMinutes),
      cupo: String(plantilla.capacity),
      desde: "",
      hasta: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setErrores({});
    limpiarMensajes();
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando || !almacen) return;

    limpiarMensajes();
    const encontrados = validar(formulario);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setGuardando(true);

    try {
      await new Promise((resolver) => setTimeout(resolver, 600));

      const datos = {
        name: formulario.nombre.trim(),
        trainerId: formulario.entrenadorId,
        roomId: formulario.salaId,
        weekday: Number(formulario.dia),
        startTime: formulario.hora,
        durationMinutes: Number(formulario.duracion),
        capacity: Number(formulario.cupo),
      };

      if (hayConflicto({ ...datos }, almacen.plantillas, editandoId)) {
        setConflicto(MENSAJE_CONFLICTO);
        return;
      }

      const entrenador = ENTRENADORES.find((e) => e.id === datos.trainerId);
      const sala = SALAS.find((s) => s.id === datos.roomId);
      let plantilla: Plantilla;
      let plantillasNuevas: Plantilla[];
      let sesionesNuevas = almacen.sesiones;

      if (editandoId) {
        plantilla = { ...datos, id: editandoId, status: "ACTIVA" };
        plantillasNuevas = almacen.plantillas.map((p) =>
          p.id === editandoId ? plantilla : p
        );

    
        const [hora, minuto] = datos.startTime.split(":").map(Number);
        sesionesNuevas = almacen.sesiones.map((s) => {
          const futura = estadoEfectivo(s, new Date()) === "PROGRAMADA";
          if (s.templateId !== editandoId || !futura) return s;
          if (s.confirmedReservations > 0) return s;
          const inicio = new Date(s.startsAt);
          inicio.setHours(hora, minuto, 0, 0);
          return {
            ...s,
            name: datos.name,
            trainerId: datos.trainerId,
            trainerName: entrenador?.nombre ?? s.trainerName,
            roomId: datos.roomId,
            roomName: sala?.nombre ?? s.roomName,
            capacity: datos.capacity,
            startsAt: inicio.toISOString(),
            endsAt: new Date(
              inicio.getTime() + datos.durationMinutes * 60000
            ).toISOString(),
          };
        });
      } else {
        plantilla = { ...datos, id: `cls-${Date.now()}`, status: "ACTIVA" };
        plantillasNuevas = [...almacen.plantillas, plantilla];
      }

      let generadas: SesionAdmin[] = [];
      if (formulario.desde && formulario.hasta) {
        generadas = generarSesiones(
          plantilla,
          leerFecha(formulario.desde),
          leerFecha(formulario.hasta),
          sesionesNuevas
        );
        sesionesNuevas = [...sesionesNuevas, ...generadas];
      }

      const siguiente: AlmacenAdmin = {
        plantillas: plantillasNuevas,
        sesiones: sesionesNuevas,
      };
      guardarAlmacen(siguiente);
      setAlmacen(siguiente);

      setExito(
        generadas.length > 0
          ? `Clase guardada. Sesiones generadas: ${generadas.length}`
          : "Clase guardada"
      );
      setEditandoId(null);
      setFormulario(FORMULARIO_VACIO);
    } catch {
      setErrorServidor(MENSAJE_SERVIDOR);
    } finally {
      setGuardando(false);
    }
  }

  const mensajeClase = (clave: keyof Errores) =>
    errores[clave] ? (
      <p className={styles.errorCampo} id={`error-${clave}`}>
        {errores[clave]}
      </p>
    ) : null;

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
                  opcion.nombre === "Clases y reservas"
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
            <h2>Administración de clases</h2>
            <span className={styles.etiqueta}>PROTOTIPO</span>
          </div>

          <section className={styles.tarjetaFormulario}>
            <h3>{editandoId ? "Formulario · Editando clase" : "Formulario"}</h3>

            {exito && (
              <p role="status" className={styles.exito}>
                {exito}
              </p>
            )}
            {conflicto && (
              <p role="alert" className={styles.conflicto}>
                {conflicto}
              </p>
            )}
            {errorServidor && (
              <p role="alert" className={styles.error}>
                {errorServidor}
              </p>
            )}

            <form className={styles.formulario} onSubmit={guardar} noValidate>
              <div className={styles.rejilla}>
                <div className={styles.campo}>
                  <label htmlFor="nombre">Nombre de clase</label>
                  <input
                    id="nombre"
                    list="nombres-clases"
                    value={formulario.nombre}
                    maxLength={80}
                    placeholder="Seleccionar o escribir..."
                    aria-invalid={!!errores.nombre}
                    aria-describedby={errores.nombre ? "error-nombre" : undefined}
                    onChange={(e) => cambiar("nombre", e.target.value, "nombre")}
                  />
                  <datalist id="nombres-clases">
                    {nombresClases.map((n) => (
                      <option value={n} key={n} />
                    ))}
                  </datalist>
                  {mensajeClase("nombre")}
                </div>

                <div className={styles.campo}>
                  <label htmlFor="entrenador">Entrenador</label>
                  <select
                    id="entrenador"
                    value={formulario.entrenadorId}
                    aria-invalid={!!errores.entrenador}
                    aria-describedby={
                      errores.entrenador ? "error-entrenador" : undefined
                    }
                    onChange={(e) =>
                      cambiar("entrenadorId", e.target.value, "entrenador")
                    }
                  >
                    <option value="">Seleccionar...</option>
                    {ENTRENADORES.map((e) => (
                      <option value={e.id} key={e.id}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                  {mensajeClase("entrenador")}
                </div>

                <div className={styles.campo}>
                  <label htmlFor="sala">Sala</label>
                  <select
                    id="sala"
                    value={formulario.salaId}
                    aria-invalid={!!errores.sala}
                    aria-describedby={errores.sala ? "error-sala" : undefined}
                    onChange={(e) =>
                      cambiar("salaId", e.target.value, "sala", "cupo")
                    }
                  >
                    <option value="">Seleccionar...</option>
                    {SALAS.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.nombre} (capacidad {s.capacidad})
                      </option>
                    ))}
                  </select>
                  {mensajeClase("sala")}
                </div>

                <div className={styles.campo}>
                  <label htmlFor="dia">Día y hora</label>
                  <div className={styles.par}>
                    <select
                      id="dia"
                      value={formulario.dia}
                      aria-invalid={!!errores.dia}
                      aria-describedby={errores.dia ? "error-dia" : undefined}
                      onChange={(e) => cambiar("dia", e.target.value, "dia")}
                    >
                      <option value="">Día...</option>
                      {DIAS.map((d) => (
                        <option value={d.valor} key={d.valor}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      id="hora"
                      type="time"
                      aria-label="Hora de inicio"
                      value={formulario.hora}
                      aria-invalid={!!errores.hora}
                      aria-describedby={errores.hora ? "error-hora" : undefined}
                      onChange={(e) =>
                        cambiar("hora", e.target.value, "hora")
                      }
                    />
                  </div>
                  {mensajeClase("dia")}
                  {mensajeClase("hora")}
                </div>

                <div className={styles.campo}>
                  <label htmlFor="duracion">Duración y cupo</label>
                  <div className={styles.par}>
                    <select
                      id="duracion"
                      value={formulario.duracion}
                      aria-invalid={!!errores.duracion}
                      aria-describedby={
                        errores.duracion ? "error-duracion" : undefined
                      }
                      onChange={(e) =>
                        cambiar("duracion", e.target.value, "duracion", "hora")
                      }
                    >
                      <option value="">Duración...</option>
                      {DURACIONES.map((d) => (
                        <option value={d} key={d}>
                          {d} min
                        </option>
                      ))}
                    </select>
                    <input
                      id="cupo"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={50}
                      step={1}
                      placeholder="Cupo (1–50)"
                      aria-label="Cupo máximo"
                      value={formulario.cupo}
                      aria-invalid={!!errores.cupo}
                      aria-describedby={errores.cupo ? "error-cupo" : undefined}
                      onChange={(e) => cambiar("cupo", e.target.value, "cupo")}
                    />
                  </div>
                  {mensajeClase("duracion")}
                  {mensajeClase("cupo")}
                </div>

                <div className={styles.campo}>
                  <label htmlFor="desde">Sesiones programadas</label>
                  <div className={styles.par}>
                    <input
                      id="desde"
                      type="date"
                      aria-label="Generar sesiones desde"
                      value={formulario.desde}
                      aria-invalid={!!errores.rango}
                      aria-describedby={errores.rango ? "error-rango" : "ayuda-rango"}
                      onChange={(e) => cambiar("desde", e.target.value, "rango")}
                    />
                    <input
                      id="hasta"
                      type="date"
                      aria-label="Generar sesiones hasta"
                      value={formulario.hasta}
                      aria-invalid={!!errores.rango}
                      aria-describedby={errores.rango ? "error-rango" : "ayuda-rango"}
                      onChange={(e) => cambiar("hasta", e.target.value, "rango")}
                    />
                  </div>
                  {mensajeClase("rango")}
                  {!errores.rango && (
                    <p className={styles.ayuda} id="ayuda-rango">
                      Opcional: genera las sesiones del rango (máximo 28 días).
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.accionesFormulario}>
                {editandoId && (
                  <button
                    type="button"
                    className={styles.secundario}
                    onClick={cancelarEdicion}
                    disabled={guardando}
                  >
                    Cancelar edición
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.guardar}
                  disabled={guardando || !almacen}
                >
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </section>

          <section className={styles.tarjeta}>
            <h3>Clases registradas</h3>
            {almacen === null || ahora === null ? (
              <p role="status" className={styles.estado}>
                Cargando clases...
              </p>
            ) : plantillas.length === 0 ? (
              <p role="status" className={styles.estado}>
                No hay clases registradas
              </p>
            ) : (
              <div className={styles.tablaContenedor}>
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th>Clase</th>
                      <th>Entrenador</th>
                      <th>Sala</th>
                      <th>Día</th>
                      <th>Hora</th>
                      <th>Duración</th>
                      <th>Cupo</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plantillas.map((p) => (
                      <tr key={p.id}>
                        <td className={styles.destacado}>{p.name}</td>
                        <td>
                          {ENTRENADORES.find((e) => e.id === p.trainerId)?.nombre}
                        </td>
                        <td>{SALAS.find((s) => s.id === p.roomId)?.nombre}</td>
                        <td>{nombreDia(p.weekday)}</td>
                        <td>{p.startTime}</td>
                        <td>{p.durationMinutes} min</td>
                        <td>{p.capacity}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.enlaceBoton}
                            onClick={() => editar(p)}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={styles.tarjeta}>
            <h3>Calendario de sesiones</h3>
            {almacen === null || ahora === null ? (
              <p role="status" className={styles.estado}>
                Cargando sesiones...
              </p>
            ) : sesiones.length === 0 ? (
              <p role="status" className={styles.estado}>
                Aún no hay sesiones generadas
              </p>
            ) : (
              <div className={styles.tablaContenedor}>
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th>Clase</th>
                      <th>Fecha</th>
                      <th>Horario</th>
                      <th>Sala</th>
                      <th>Entrenador</th>
                      <th>Cupos</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sesiones.map((s) => {
                      const estado = estadoEfectivo(s, ahora);
                      return (
                        <tr key={s.id}>
                          <td className={styles.destacado}>{s.name}</td>
                          <td>{mostrarFecha(new Date(s.startsAt))}</td>
                          <td>
                            {mostrarHora(new Date(s.startsAt))} –{" "}
                            {mostrarHora(new Date(s.endsAt))}
                          </td>
                          <td>{s.roomName}</td>
                          <td>{s.trainerName}</td>
                          <td>
                            {s.confirmedReservations} / {s.capacity}
                          </td>
                          <td>
                            <span
                              className={`${styles.insignia} ${styles[`estado${estado}`]}`}
                            >
                              {etiquetaEstado(estado)}
                            </span>
                          </td>
                          <td>
                            <Link
                              href={`/admin/sesiones/${s.id}`}
                              className={styles.enlaceBoton}
                            >
                              Gestionar
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
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

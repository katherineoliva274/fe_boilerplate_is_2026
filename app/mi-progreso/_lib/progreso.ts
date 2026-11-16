export type Marca = { id: string; exerciseId: string; weightKg: string; reps: string };
export type Registro = {
  id: string;
  recordDate: string;
  weightKg: number;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  marks: { exerciseId: string; weightKg: number; reps: number }[];
};
export const STORAGE_KEY = "gkds_h24_progreso_prototipo";
export const EJERCICIOS = [
  { id: "sentadilla", name: "Sentadilla con barra" },
  { id: "press-banca", name: "Press de banca" },
  { id: "remo", name: "Remo con mancuerna" },
  { id: "peso-muerto", name: "Peso muerto" },
  { id: "press-militar", name: "Press militar" },
  { id: "dominadas", name: "Dominadas" },
  { id: "curl", name: "Curl de bíceps" },
  { id: "zancadas", name: "Zancadas" },
];
export function diaLocal(fecha = new Date()): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}
export function fechaVisible(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}
export function leerRegistros(): Registro[] {
  if (typeof window === "undefined") return [];
  try {
    const json = window.localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r): r is Registro => Boolean(r) && typeof r === "object" && typeof r.id === "string" && typeof r.recordDate === "string" && typeof r.weightKg === "number" && Array.isArray(r.marks));
  } catch {
    return [];
  }
}
export function escribirRegistros(registros: Registro[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}
export function nombreEjercicio(id: string): string {
  return EJERCICIOS.find((e) => e.id === id)?.name ?? "Ejercicio";
}
export function numeroVisible(valor: number | null): string {
  return valor === null ? "—" : valor.toFixed(2);
}

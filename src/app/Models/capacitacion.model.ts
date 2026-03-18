export interface Capacitacion {
  id?: number;
  nombre: string;
  descripcion: string;
  numeroDeClases: string;
  duracion: string;
  imagen?: string | null;               // Lo agregamos porque está en la entidad
  modulos?: Modulo[];        // Relación con módulos si deseas traerlos
  observacion?: string;
}

export interface UploadResultDto {
  totalFilasLeidas: number;
  insertadas: number;
  rechazadas: number;
  warnings: number;
  errores: Capacitacion[]; // filas bloqueantes
  avisos: Capacitacion[];  // warnings
  mensaje: string;
}

export enum EstadoCurso {
  Inscrito = 'Inscrito',
  Finalizado = 'Finalizado',
  En_Proceso = 'En_Proceso',
  Cancelado = 'Cancelado'
}

export interface Modulo{
  id?: number;
  duracion: string;
  descripcion: string;
  capacitacionId: number;        // Relación con Capacitacion
}

export interface Inscripcion {
  id?: number;
  fechaDeInscripcion: string;    // Angular maneja LocalDate como string
  estadoCurso: EstadoCurso;      // Importar enum
  cursoId: number;
  usuarioId: number;
}

export interface Progreso {
  id?: number;
  progresoDelCurso: string;
  modulosCompletados: string;
  tiempoInvertido: string;
  cursoId: number;
  usuarioId: number;
}

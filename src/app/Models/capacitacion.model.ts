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

export interface CapacitacionDTO extends Capacitacion {}

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
  archivoPdfUrl?: string | null;
  capacitacionId: number;        // Relación con Capacitacion
}

export interface ModuloDTO extends Modulo {}

export interface Evaluacion {
  id?: number;
  titulo: string;
  descripcion: string;
  puntajeMinimo: number;
  activa: boolean;
  moduloId: number;
}

export interface EvaluacionDTO extends Evaluacion {}

export interface IntentoEvaluacion {
  id?: number;
  evaluacionId: number;
  usuarioId: number;
  puntajeObtenido: number;
  aprobado: boolean;
  fechaPresentacion?: string;
}

export interface IntentoEvaluacionDTO extends IntentoEvaluacion {}

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

export interface ProgresoDTO extends Progreso {}

export interface CloudinaryUploadResponse {
  url: string;
}

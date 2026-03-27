export interface ModuloDTO {
  id?: number;
  duracion: string;
  descripcion: string;
  archivoPdfUrl?: string | null;
  capacitacionId?: number;
  evaluacion?: ModuloEvaluacionDTO | null;
}

export interface ModuloEvaluacionDTO {
  titulo: string;
  preguntas: ModuloPreguntaDTO[];
  progresoUsuarios?: Record<string, ProgresoUsuarioEvaluacionDTO>;
}

export interface ModuloPreguntaDTO {
  texto: string;
  tipo: 'opcion_multiple';
  opciones: string[];
  respuestaCorrecta: string;
}

export interface ProgresoUsuarioEvaluacionDTO {
  puntaje: number;
  completado100: boolean;
  ultimaActualizacion: string;
}

export interface EvaluacionDTO {
  id?: number;
  titulo: string;
  descripcion: string;
  puntajeMinimo: number;
  activa: boolean;
  moduloId?: number;
  tipo?: 'manual' | 'multiple';
  preguntas?: EvaluacionPregunta[];
}

export interface EvaluacionPregunta {
  id?: string;
  enunciado: string;
  opciones: EvaluacionOpcion[];
}

export interface EvaluacionOpcion {
  id?: string;
  texto: string;
  esCorrecta?: boolean;
}

export interface IntentoEvaluacionDTO {
  id?: number;
  evaluacionId?: number;
  usuarioId: number;
  puntajeObtenido: number;
  aprobado?: boolean;
  fechaPresentacion?: string;
}

export interface ProgresoDTO {
  id?: number;
  progresoDelCurso: string;
  modulosCompletados: string;
  tiempoInvertido: string;
  cursoId: number;
  usuarioId: number;
}

export interface UploadPdfResponseDTO {
  url?: string;
  secure_url?: string;
  secureUrl?: string;
  archivoPdfUrl?: string;
  pdfUrl?: string;
}

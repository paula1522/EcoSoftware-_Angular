export interface ModuloDTO {
  id?: number;
  duracion: string;
  descripcion: string;
  archivoPdfUrl?: string | null;
  capacitacionId?: number;
}

export interface EvaluacionDTO {
  id?: number;
  titulo: string;
  descripcion: string;
  puntajeMinimo: number;
  activa: boolean;
  moduloId?: number;
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

export interface ModeloRecoleccion {
  idRecoleccion: number;
  solicitudId: number;
  recolectorId: number;
  rutaId?: number | null;

  estado: EstadoRecoleccion;
  fechaRecoleccion?: string;  // yyyy-MM-ddTHH:mm:ss
  ordenParada?: number;
  observaciones?: string;
  evidencia?: string;
  fechaCreacionRecoleccion?: string; 
}

export enum EstadoRecoleccion {
  Pendiente = 'Pendiente',
  En_Progreso = 'En_Progreso',
  Completada = 'Completada',
  Fallida = 'Fallida',
  Cancelada = 'Cancelada'
}
export interface ModeloRecoleccion {
  idRecoleccion: number;
  solicitudId?: number;
  recolectorId?: number;
  rutaId?: number | null;
  estado: string;
  fechaRecoleccion?: string | null; 
  ordenParada?: number | null;
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


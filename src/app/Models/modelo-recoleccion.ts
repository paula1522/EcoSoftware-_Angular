export interface ModeloRecoleccion {
  tipoResiduo: string;
  idRecoleccion: number;
  solicitudId: number;
  recolectorId: number;
  rutaId?: number | null;

  estado: EstadoRecoleccion; // ✅ usar enum

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
export enum EstadoRecoleccion {
  Pendiente = 'Pendiente',
  En_Progreso = 'En_Progreso',
  Completada = 'Completada',
  Fallida = 'Fallida',
  Cancelada = 'Cancelada'
}

export interface ModeloRecoleccion {
  idRecoleccion: number;
  solicitudId: number;
  recolectorId: number;
  rutaId?: number | null;
  estado: EstadoRecoleccion;
  fechaRecoleccion?: string;
  ordenParada?: number;
  observaciones?: string;
  evidencia?: string;
  fechaCreacionRecoleccion?: string;
}


export interface Recoleccion {
  idRecoleccion: number;
  estado: EstadoRecoleccion;
  ordenParada?: number;
  solicitud: {
    idSolicitud: number;
    direccion: string;
    latitude: number;
    longitude: number;
  };
}
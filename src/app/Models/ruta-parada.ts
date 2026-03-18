export interface RutaParada {
    idParada: number;
  rutaId?: number;
  recoleccionId?: number;
  orden: number;
  estado: string;
  fechaAtencion?: string | null;
  latitude: number;
  longitude: number;
  
}

export enum EstadoParada {
  Pendiente = 'Pendiente',
  Completada = 'Completada',
  Fallida = 'Fallida'
}

export enum EstadoRuta {
  PLANIFICADA = 'PLANIFICADA',
  EN_PROGRESO = 'EN_PROGRESO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA'
}


export interface RutaRecoleccion {
  idRuta: number;
  nombre: string;
  estado: EstadoRuta;
  recoleccionIds: number[];
  recolectorId: number;
  distanciaTotal: number;
  tiempoEstimado: number;
  geometriaRuta: string;
  fechaCreacion: string; // OffsetDateTime -> ISO string
}

export interface Punto {
  lat: number;
  lng: number;
  ordenParada: number;
  tipoResiduo?: string;
  estado?: string;
  evidencia?: string;
}
export interface RutaParaMapa {
  idRuta: number;
  nombre: string;
  estado: string;
  puntos: Punto[];
  distanciaTotal?: number;
  tiempoEstimado?: number;
}
import { EstadoRecoleccion } from "./modelo-recoleccion";

export enum EstadoRuta {
  PLANIFICADA = 'PLANIFICADA',
  EN_PROGRESO = 'EN_PROGRESO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA'
}

export interface Parada {
  recoleccionId: number;
  ordenParada: number;
  latitud: number;
  longitud: number;
  estado: EstadoRecoleccion; 
}

export interface RutaRecoleccion {
  idRuta: number;
  nombre: string;
  estado: EstadoRuta;
  recoleccionIds?: number[];
  recolectorId: number;
  distanciaTotal: number;
  tiempoEstimado: number;
  geometriaRuta: string;
  fechaCreacion: string;
  paradas: Parada[];
}

export interface CrearRutaDTO {
  nombre: string;
  recoleccionIds: number[];
}

export interface RutaParaMapa {
  idRuta: number;
  nombre: string;
  estado: string;
  paradas: Parada[];
  geometriaRuta?: string;
  distanciaTotal?: number;
  tiempoEstimado?: number;
}
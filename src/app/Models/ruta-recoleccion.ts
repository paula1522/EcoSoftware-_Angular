import { RutaParada } from "../Models/ruta-parada";

export interface RutaRecoleccion {
  idRuta: number;
  recolectorId?: number;
  paradas: RutaParada[];
  nombre: string;
  descripcion?: string;
  zonasCubiertas?: string;
  fechaCreacion?: string; // ISO date
}

export interface CrearRuta {
  nombre: string;
  descripcion?: string;
  zonasCubiertas?: string;
  recoleccionesSeleccionadas: number[]; // ids
  idRecoleccionInicio?: number | null;
}

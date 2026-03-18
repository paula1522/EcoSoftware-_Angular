export interface PuntoReciclaje {
  id: number;
  nombre: string;
  direccion: string;      // mapeado desde "ubicacion"
  horario: string;
  tipo_residuo: string;
  descripcion: string;    // mapeado desde "otro"
  latitud: number | null;
  longitud: number | null;
  imagen: string | null;
  usuario_id: number;
}

export interface PuntoReciclaje {
  id: number;
  nombre: string;
  direccion: string;
  horario: string;
  tipoResiduo: string;
  descripcion: string;
  latitud: number | null;
  longitud: number | null;
  imagen: string | null;
  usuarioId: number | null;
  tipo_residuo?: string;
  usuario_id?: number | null;
  ubicacion?: string;
}

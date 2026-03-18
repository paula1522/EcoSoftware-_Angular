// src/app/enums/localidad.enum.ts

export enum Localidad {
  Usaquen = 'Usaquen',
  Chapinero = 'Chapinero',
  Santa_Fe = 'Santa_Fe',
  San_Cristobal = 'San_Cristobal',
  Usme = 'Usme',
  Tunjuelito = 'Tunjuelito',
  Bosa = 'Bosa',
  Kennedy = 'Kennedy',
  Fontibon = 'Fontibon',
  Engativa = 'Engativa',
  Suba = 'Suba',
  Barrios_Unidos = 'Barrios_Unidos',
  Teusaquillo = 'Teusaquillo',
  Los_Martires = 'Los_Martires',
  Antonio_Nariño = 'Antonio_Nariño',
  Puente_Aranda = 'Puente_Aranda',
  Candelaria = 'Candelaria',
  Rafael_Uribe_Uribe = 'Rafael_Uribe_Uribe',
  Ciudad_Bolivar = 'Ciudad_Bolivar',
  Sumapaz = 'Sumapaz'
}

export enum EstadoPeticion {
  Pendiente = 'Pendiente',
  Aceptada = 'Aceptada',
  Cancelada = 'Cancelada',
  Rechazada = 'Rechazada'
}


export enum TipoResiduo {
  Plastico = 'Plastico',
  Papel = 'Papel',
  Vidrio = 'Vidrio',
  Metal = 'Metal',
  Organico = 'Organico',
  Electronico = 'Electronico',
  Otro = 'Otro'
}





export interface ServiceModel {
  idSolicitud?: number;         // Se genera en backend, opcional al crear
  usuarioId: number;            // Obligatorio
  aceptadaPorId?: number | null;       // Opcional, null al crear
  tipoResiduo: TipoResiduo;
  cantidad: string;
  estadoPeticion?: EstadoPeticion; // Opcional, backend asigna Pendiente
  descripcion: string;
  localidad: Localidad;
  ubicacion: string;
  evidencia?: string;           // Opcional
  fechaCreacionSolicitud?: string; // Opcional, backend puede asignar
  fechaProgramada: string;
  recoleccionId?: number;       // Opcional
}


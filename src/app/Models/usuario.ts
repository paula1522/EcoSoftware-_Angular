// src/app/usuario_models/usuario.model.ts
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
export interface UsuarioModel {
  idUsuario?: number;
  rolId?: number;           // ID del rol (1 = admin, 2 = ciudadano, etc.)
  nombre: string;
  contrasena: string;
  correo: string;
  cedula: string;
  telefono: string;
  nit?: string;
  direccion?: string;
  barrio?: string;
  localidad?: Localidad;
  zona_de_trabajo?: string;
  horario?: string;
  certificaciones?: string;
  imagen_perfil?: string;
  cantidad_minima?: number;
  estado?: boolean;
  documento?: string;
  camara_comercio?: string;
  rut?: string;
  fechaCreacion?: string;
  estadoRegistro?: EstadoRegistro; // Nuevo campo para el estado del registro

  // Campos adicionales del front
  tipoMaterial?: string[];       // reciclador / empresa
  otrosMateriales?: string;      // reciclador / empresa
  representanteLegal?: string;   // empresa
  rol?: string
}

export enum TipoDeMaterial {

  Plastico = 'Plastico',
  Papel = 'Papel',
  Vidrio = 'Vidrio',
  Metal = 'Metal',
  Organico = 'Organico',
  Electronico = 'Electronico',
  Otro = 'Otro'
}


export enum EstadoRegistro {
    PENDIENTE_DOCUMENTACION,
    PENDIENTE_REVISAR,
    APROBADO,
    RECHAZADO

}

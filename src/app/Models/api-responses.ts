export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthResponse {
  mensaje: string;
  token: string;
  correo: string;
  rol: string;
  idUsuario: number;
}

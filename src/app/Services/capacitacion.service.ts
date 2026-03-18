import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { from, Observable } from 'rxjs';

// ✅ Importa tus modelos
import { Capacitacion, EstadoCurso, Modulo, Inscripcion, Progreso, UploadResultDto } from '../Models/capacitacion.model';


@Injectable({
  providedIn: 'root'
})
export class CapacitacionesService {

  private apiUrl = 'https://ecosoftware-spring-boot.azurewebsites.net/api/capacitaciones';

  constructor(private http: HttpClient) {}

  // ===========================
  // CAPACITACIONES
  // ===========================
  crearCapacitacion(dto: Capacitacion): Observable<Capacitacion> {
    return this.http.post<Capacitacion>(this.apiUrl, dto);
  }

  actualizarCapacitacion(id: number, dto: Capacitacion): Observable<Capacitacion> {
    return this.http.put<Capacitacion>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarCapacitacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obtenerCapacitacionPorId(id: number): Observable<Capacitacion> {
    return this.http.get<Capacitacion>(`${this.apiUrl}/${id}`);
  }

  listarTodasCapacitaciones(): Observable<Capacitacion[]> {
    return this.http.get<Capacitacion[]>(this.apiUrl);
  }

  obtenerMisCapacitaciones(usuarioId: number){
  return this.http.get<Capacitacion[]>(
    `${this.apiUrl}/mis-capacitaciones/${usuarioId}`
  );
}

  // ===========================
  // CARGA MASIVA EXCEL
  // ===========================
  cargarCapacitacionesDesdeExcel(file: File): Observable<UploadResultDto> {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post<UploadResultDto>(`${this.apiUrl}/cargar-excel`, formData);
}

  validarCapacitacion(nombre?: string, descripcion?: string): Observable<boolean> {
  let params = new HttpParams();
  if (nombre) params = params.set('nombre', nombre);
  if (descripcion) params = params.set('descripcion', descripcion);
  return this.http.get<boolean>(`${this.apiUrl}/validar`, { params });
}
validarCapacitacionPorNombre(nombre: string): Observable<boolean> {
  return this.http.get<boolean>(`${this.apiUrl}/validar`, { params: { nombre } });
}

// valida el excel sin intentar cargarlo (llama al endpoint /validar-excel)
validarExcel(file: File): Observable<Capacitacion[]> {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post<Capacitacion[]>(`${this.apiUrl}/validar-excel`, formData);
}

obtenerCapacitacionPorNombre(nombre: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/buscarPorNombre`, { params: { nombre } });
}
  generarPlantillaExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/plantilla`, { responseType: 'blob' });
  }

  // ===========================
  // MODULOS
  // ===========================
  crearModulo(dto: Modulo): Observable<Modulo> {
    return this.http.post<Modulo>(`${this.apiUrl}/modulos`, dto);
  }

  actualizarModulo(id: number, dto: Modulo): Observable<Modulo> {
    return this.http.put<Modulo>(`${this.apiUrl}/modulos/${id}`, dto);
  }

  eliminarModulo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/modulos/${id}`);
  }

  listarModulosPorCapacitacion(capacitacionId: number): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(`${this.apiUrl}/${capacitacionId}/modulos`);
  }

  // Cargar módulos por Excel
  cargarModulosDesdeExcel(capacitacionId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.apiUrl}/${capacitacionId}/modulos/cargar-excel`,
      formData,
      { responseType: 'text' }
    );
  }

  generarPlantillaModulosExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/modulos/plantilla`, { responseType: 'blob' });
  }

  // ===========================
  // INSCRIPCIONES
  // ===========================
  inscribirse(usuarioId: number, cursoId: number): Observable<Inscripcion> {
    let params = new HttpParams()
      .set('usuarioId', usuarioId)
      .set('cursoId', cursoId);
    // Cambia null por {} en el body
    return this.http.post<Inscripcion>(`${this.apiUrl}/inscripciones`, {}, { params });
  }

  actualizarEstadoInscripcion(id: number, estado: EstadoCurso): Observable<Inscripcion> {
    let params = new HttpParams().set('estado', estado);
    return this.http.put<Inscripcion>(`${this.apiUrl}/inscripciones/${id}`, null, { params });
  }

  listarInscripcionesPorUsuario(usuarioId: number): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.apiUrl}/inscripciones/usuario/${usuarioId}`);
  }

  listarInscripcionesPorCurso(cursoId: number): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.apiUrl}/inscripciones/curso/${cursoId}`);
  }

  // ===========================
  // PROGRESO
  // ===========================
  registrarProgreso(dto: Progreso): Observable<Progreso> {
    return this.http.post<Progreso>(`${this.apiUrl}/progreso`, dto);
  }

  actualizarProgreso(id: number, dto: Progreso): Observable<Progreso> {
    return this.http.put<Progreso>(`${this.apiUrl}/progreso/${id}`, dto);
  }

  listarProgresosPorUsuario(usuarioId: number): Observable<Progreso[]> {
    return this.http.get<Progreso[]>(`${this.apiUrl}/progreso/usuario/${usuarioId}`);
  }

  listarProgresosPorCurso(cursoId: number): Observable<Progreso[]> {
    return this.http.get<Progreso[]>(`${this.apiUrl}/progreso/curso/${cursoId}`);
  }

}

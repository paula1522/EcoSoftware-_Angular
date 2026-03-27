import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModeloRecoleccion, EstadoRecoleccion } from '../Models/modelo-recoleccion';

@Injectable({
  providedIn: 'root'
})
export class RecoleccionService {

  private readonly URL = 'https://ecosoftware-spring-boot.azurewebsites.net/api/recolecciones';

  constructor(private http: HttpClient) {}

  obtenerPorId(id: number): Observable<ModeloRecoleccion> {
    return this.http.get<ModeloRecoleccion>(`${this.URL}/${id}`);
  }

  // Listar solo recolecciones activas (no canceladas)
  listarActivas(): Observable<ModeloRecoleccion[]> {
    return this.http.get<ModeloRecoleccion[]>(`${this.URL}/activas`);
  }

  // Listar recolecciones del recolector autenticado
  listarMisRecolecciones(): Observable<ModeloRecoleccion[]> {
    return this.http.get<ModeloRecoleccion[]>(`${this.URL}/mis-recolecciones`);
  }

  // Listar recolecciones de un recolector específico (requiere permisos)
  listarPorRecolector(id: number): Observable<ModeloRecoleccion[]> {
    return this.http.get<ModeloRecoleccion[]>(`${this.URL}/recolector/${id}`);
  }

  // Listar todas las recolecciones (incluye canceladas; normalmente solo admin)
  listarTodas(): Observable<ModeloRecoleccion[]> {
    return this.http.get<ModeloRecoleccion[]>(this.URL);
  }

  // Listar recolecciones de una ruta específica (activas)
  listarPorRuta(rutaId: number): Observable<ModeloRecoleccion[]> {
    return this.http.get<ModeloRecoleccion[]>(`${this.URL}/ruta/${rutaId}`);
  }

  // Listar todas las recolecciones del recolector autenticado (incluye canceladas)
listarMisRecoleccionesTodas(): Observable<ModeloRecoleccion[]> {
  return this.http.get<ModeloRecoleccion[]>(`${this.URL}/mis-recolecciones/todas`);
}

// Listar recolecciones del ciudadano autenticado (basado en sus solicitudes)
listarMisRecoleccionesCiudadano(): Observable<ModeloRecoleccion[]> {
  return this.http.get<ModeloRecoleccion[]>(`${this.URL}/mis-recolecciones-ciudadano`);
}

  // Cambiar el estado de una recolección (validado por backend)
  actualizarEstado(id: number, estado: EstadoRecoleccion): Observable<ModeloRecoleccion> {
    const params = new HttpParams().set('estado', estado);
    return this.http.put<ModeloRecoleccion>(`${this.URL}/${id}/estado`, null, { params });
  }

  
  actualizarRecoleccion(id: number, recoleccion: Partial<ModeloRecoleccion>): Observable<ModeloRecoleccion> {
    return this.http.put<ModeloRecoleccion>(`${this.URL}/${id}`, recoleccion);
  }

  eliminarLogicamente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.URL}/${id}`);
  }

  // Métodos de conveniencia para cambios de estado comunes
  completarRecoleccion(id: number): Observable<ModeloRecoleccion> {
    return this.actualizarEstado(id, EstadoRecoleccion.Completada);
  }

  marcarFallida(id: number): Observable<ModeloRecoleccion> {
    return this.actualizarEstado(id, EstadoRecoleccion.Fallida);
  }
}
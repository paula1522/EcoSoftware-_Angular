import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModeloRecoleccion, EstadoRecoleccion } from '../Models/modelo-recoleccion';

@Injectable({
  providedIn: 'root'
})
export class RecoleccionService {

  private readonly URL = 'http://localhost:8082/api/recolecciones';

  constructor(private http: HttpClient) {}

  obtenerPorId(id: number): Observable<ModeloRecoleccion> {
    return this.http.get<ModeloRecoleccion>(`${this.URL}/${id}`);
  }

  listarActivas(): Observable<ModeloRecoleccion[]> {
    return this.http.get<ModeloRecoleccion[]>(`${this.URL}/activas`);
  }

  listarMisRecolecciones(): Observable<ModeloRecoleccion[]> {
    return this.http.get<ModeloRecoleccion[]>(`${this.URL}/mis-recolecciones`);
  }

  listarPorRecolector(id: number): Observable<ModeloRecoleccion[]> {
    return this.http.get<ModeloRecoleccion[]>(`${this.URL}/recolector/${id}`);
  }

  listarTodas(): Observable<ModeloRecoleccion[]> {
    return this.http.get<ModeloRecoleccion[]>(this.URL);
  }

  listarPorRuta(rutaId: number): Observable<ModeloRecoleccion[]> {
    return this.http.get<ModeloRecoleccion[]>(`${this.URL}/ruta/${rutaId}`);
  }

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
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RutaRecoleccion } from '../Models/ruta-recoleccion';

@Injectable({
  providedIn: 'root'
})
export class RutaRecoleccionService {

  private baseUrl = 'http://localhost:8082/api/rutas';

  constructor(private http: HttpClient) {}

  crearRuta(dto: Partial<RutaRecoleccion>): Observable<RutaRecoleccion> {
  return this.http.post<RutaRecoleccion>(`${this.baseUrl}`, dto);
}


  getRutaById(id: number): Observable<RutaRecoleccion> {
    return this.http.get<RutaRecoleccion>(`${this.baseUrl}/${id}`);
  }

  getRutas(): Observable<RutaRecoleccion[]> {
    return this.http.get<RutaRecoleccion[]>(`${this.baseUrl}`);
  }

  getRutasPorRecolector(recolectorId: number): Observable<RutaRecoleccion[]> {
    return this.http.get<RutaRecoleccion[]>(`${this.baseUrl}/recolector/${recolectorId}`);
  }

  actualizarRuta(id: number, dto: RutaRecoleccion): Observable<RutaRecoleccion> {
    return this.http.put<RutaRecoleccion>(`${this.baseUrl}/${id}`, dto);
  }

  eliminarRuta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  asignarRecolecciones(rutaId: number, recoleccionIds: number[]): Observable<RutaRecoleccion> {
    return this.http.post<RutaRecoleccion>(
      `${this.baseUrl}/${rutaId}/recolecciones`,
      recoleccionIds
    );
  }
}

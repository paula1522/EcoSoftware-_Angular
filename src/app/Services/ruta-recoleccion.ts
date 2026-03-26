import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EstadoRuta, RutaRecoleccion } from '../Models/ruta-recoleccion';

@Injectable({
  providedIn: 'root'
})
export class RutaRecoleccionService {

  private readonly URL = 'http://localhost:8082/api/rutas';

  constructor(private http: HttpClient) {}

  crearRuta(ruta: Partial<RutaRecoleccion>): Observable<RutaRecoleccion> {
    return this.http.post<RutaRecoleccion>(this.URL, ruta);
  }

  obtenerPorId(id: number): Observable<RutaRecoleccion> {
    return this.http.get<RutaRecoleccion>(`${this.URL}/${id}`);
  }

  listarTodas(): Observable<RutaRecoleccion[]> {
    return this.http.get<RutaRecoleccion[]>(this.URL);
  }

  listarPorEstado(estado: EstadoRuta): Observable<RutaRecoleccion[]> {
    return this.http.get<RutaRecoleccion[]>(`${this.URL}/estado/${estado}`);
  }

  listarMisRutas(): Observable<RutaRecoleccion[]> {
    return this.http.get<RutaRecoleccion[]>(`${this.URL}/mis-rutas`);
  }

  iniciarRuta(id: number): Observable<RutaRecoleccion> {
    return this.http.put<RutaRecoleccion>(`${this.URL}/${id}/iniciar`, {});
  }

  finalizarRuta(id: number): Observable<RutaRecoleccion> {
    return this.http.put<RutaRecoleccion>(`${this.URL}/${id}/finalizar`, {});
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RutaParada } from '../Models/ruta-parada';

@Injectable({
  providedIn: 'root'
})
export class RutaParadaService {

  private baseUrl = 'http://localhost:8082/api/paradas';

  constructor(private http: HttpClient) {}

  agregarParada(rutaId: number, recoleccionId: number, lat: number, lng: number): Observable<RutaParada> {
    const body = {
      recoleccionId,
      latitude: lat,
      longitude: lng
    };

    return this.http.post<RutaParada>(
      `${this.baseUrl}/ruta/${rutaId}`,
      body
    );
  }

  listarParadas(rutaId: number): Observable<RutaParada[]> {
    return this.http.get<RutaParada[]>(`${this.baseUrl}/ruta/${rutaId}`);
  }

  moverArriba(paradaId: number): Observable<RutaParada> {
    return this.http.put<RutaParada>(`${this.baseUrl}/${paradaId}/arriba`, {});
  }

  moverAbajo(paradaId: number): Observable<RutaParada> {
    return this.http.put<RutaParada>(`${this.baseUrl}/${paradaId}/abajo`, {});
  }

  actualizarEstado(paradaId: number, estado: string): Observable<RutaParada> {
    return this.http.put<RutaParada>(
      `${this.baseUrl}/${paradaId}/estado?estado=${estado}`,
      {}
    );
  }
}

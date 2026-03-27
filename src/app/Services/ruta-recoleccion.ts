import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EstadoRuta, RutaRecoleccion, CrearRutaDTO } from '../Models/ruta-recoleccion';

@Injectable({
  providedIn: 'root'
})
export class RutaRecoleccionService {

  private readonly URL = 'http://localhost:8082/api/rutas';

  constructor(private http: HttpClient) {}

  crearRuta(dto: CrearRutaDTO): Observable<RutaRecoleccion> {
    return this.http.post<RutaRecoleccion>(this.URL, dto);
  }

  actualizarRuta(id: number, data: Partial<RutaRecoleccion>): Observable<RutaRecoleccion> {
    return this.http.put<RutaRecoleccion>(`${this.URL}/${id}`, data);
  }

  eliminarRuta(id: number): Observable<void> {
  return this.http.delete<void>(`${this.URL}/${id}`);
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


  listarConFiltros(filtros: any): Observable<RutaRecoleccion[]> {
  const params = new HttpParams({ fromObject: filtros });
  return this.http.get<RutaRecoleccion[]>(`${this.URL}/admin`, { params });
}

descargarPDF(filtros: any): Observable<Blob> {
  const params = new HttpParams({ fromObject: filtros });
  return this.http.get(`${this.URL}/export/pdf`, {
    params,
    responseType: 'blob',
  });
}

descargarExcel(filtros: any): Observable<Blob> {
  const params = new HttpParams({ fromObject: filtros });
  return this.http.get(`${this.URL}/export/excel`, {
    params,
    responseType: 'blob',
  });
}

  
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CiudadanoDashboardEstado {
  estado?: string;
  nombre?: string;
  cantidad?: number | string;
}

export interface CiudadanoDashboardTiempo {
  mes?: string | number;
  cantidad?: number | string;
}

export interface CiudadanoDashboardResiduo {
  tipoResiduo?: string;
  tipo?: string;
  material?: string;
  cantidad?: number | string;
}

export interface CiudadanoDashboardImpacto {
  metrica?: string;
  valor?: number | string;
  unidad?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CiudadanoDashboardService {
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/ciudadano/dashboard`;

  constructor(private readonly http: HttpClient) {}

  obtenerSolicitudesPorEstado(): Observable<CiudadanoDashboardEstado[]> {
    return this.http.get<CiudadanoDashboardEstado[]>(`${this.baseUrl}/solicitudes-estado`);
  }

  obtenerSolicitudesEnTiempo(): Observable<CiudadanoDashboardTiempo[]> {
    return this.http.get<CiudadanoDashboardTiempo[]>(`${this.baseUrl}/solicitudes-tiempo`);
  }

  obtenerResiduosPorTipo(): Observable<CiudadanoDashboardResiduo[]> {
    return this.http.get<CiudadanoDashboardResiduo[]>(`${this.baseUrl}/residuos-por-tipo`);
  }

  obtenerImpactoAmbiental(): Observable<CiudadanoDashboardImpacto[]> {
    return this.http.get<CiudadanoDashboardImpacto[]>(`${this.baseUrl}/impacto-ambiental`);
  }
}
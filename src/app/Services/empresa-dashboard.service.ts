import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EmpresaDashboardEstado {
  estado?: string;
  nombre?: string;
  cantidad?: number | string;
}

export interface EmpresaDashboardMes {
  mes?: string | number;
  cantidad?: number | string;
}

export interface EmpresaDashboardMaterial {
  tipo?: string;
  tipoMaterial?: string;
  material?: string;
  cantidad?: number | string;
}

export interface EmpresaDashboardTiempoPromedio {
  mes?: string | number;
  cantidad?: number | string;
  total?: number | string;
  kilos?: number | string;
  peso?: number | string;
  promedioHoras?: number | string;
  tiempoPromedioHoras?: number | string;
  promedio?: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class EmpresaDashboardService {
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/empresa/dashboard`;

  constructor(private readonly http: HttpClient) {}

  obtenerSolicitudesPorEstado(): Observable<EmpresaDashboardEstado[]> {
    return this.http.get<EmpresaDashboardEstado[]>(`${this.baseUrl}/solicitudes-estado`);
  }

  obtenerSolicitudesMensuales(): Observable<EmpresaDashboardMes[]> {
    return this.http.get<EmpresaDashboardMes[]>(`${this.baseUrl}/solicitudes-mensuales`);
  }

  obtenerMaterialesPorTipo(): Observable<EmpresaDashboardMaterial[]> {
    return this.http.get<EmpresaDashboardMaterial[]>(`${this.baseUrl}/materiales-tipo`);
  }

  obtenerMaterialGestionadoPorMes(): Observable<EmpresaDashboardTiempoPromedio[]> {
    return this.http.get<EmpresaDashboardTiempoPromedio[]>(`${this.baseUrl}/material-gestionado-mes`);
  }
}
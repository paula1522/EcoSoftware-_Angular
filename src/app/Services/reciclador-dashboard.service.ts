import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RecicladorDashboardPeriodo {
  periodo?: string;
  mes?: string;
  cantidad?: number | string;
}

export interface RecicladorDashboardEstado {
  estado?: string;
  nombre?: string;
  cantidad?: number | string;
}

export interface RecicladorDashboardCumplimiento {
  metrica?: string;
  porcentaje?: number | string;
  completadas?: number | string;
  total?: number | string;
}

export interface RecicladorDashboardMaterial {
  tipo?: string;
  tipoResiduo?: string;
  material?: string;
  cantidad?: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class RecicladorDashboardService {
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/reciclador/dashboard`;

  constructor(private readonly http: HttpClient) {}

  obtenerRecoleccionesPorPeriodo(): Observable<RecicladorDashboardPeriodo[]> {
    return this.http.get<RecicladorDashboardPeriodo[]>(`${this.baseUrl}/recolecciones-periodo`);
  }

  obtenerRecoleccionesPorEstado(): Observable<RecicladorDashboardEstado[]> {
    return this.http.get<RecicladorDashboardEstado[]>(`${this.baseUrl}/recolecciones-estado`);
  }

  obtenerCumplimiento(): Observable<RecicladorDashboardCumplimiento[]> {
    return this.http.get<RecicladorDashboardCumplimiento[]>(`${this.baseUrl}/cumplimiento`);
  }

  obtenerMaterialRecolectado(): Observable<RecicladorDashboardMaterial[]> {
    return this.http.get<RecicladorDashboardMaterial[]>(`${this.baseUrl}/material-recolectado`);
  }
}
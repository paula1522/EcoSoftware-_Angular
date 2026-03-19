import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PuntoReciclaje {
  id?: number;
  nombre: string;
  direccion: string;
  latitud: number | string;
  longitud: number | string;
  tipoResiduo?: string;
  horario?: string;
  descripcion?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export type PuntosResponse = ApiResponse<PuntoReciclaje[]>;
export type PuntoResponse = ApiResponse<PuntoReciclaje>;
export type GenericResponse<T = unknown> = ApiResponse<T>;

@Injectable({ providedIn: 'root' })
export class PuntosReciclajeService {
  private readonly apiBaseUrl = environment.apiUrl.replace(/\/$/, '');
  private readonly baseUrl = `${this.apiBaseUrl}/api/puntos`;
  private readonly refreshSubject = new Subject<void>();
  readonly refresh$ = this.refreshSubject.asObservable();
  private puntosCache$?: Observable<PuntosResponse>;

  constructor(private readonly http: HttpClient) {}

  private emitRefresh(): void {
    this.refreshSubject.next();
    this.invalidarCachePuntos();
  }

  private invalidarCachePuntos(): void {
    this.puntosCache$ = undefined;
  }

  /** Obtiene todos los puntos de reciclaje disponibles (con caché). */
  getPuntos(): Observable<PuntosResponse> {
    if (!this.puntosCache$) {
      this.puntosCache$ = this.http.get<PuntosResponse>(this.baseUrl).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.puntosCache$;
  }

  /** Crea un nuevo punto en el backend. */
  crearPunto(punto: Omit<PuntoReciclaje, 'id'>): Observable<PuntoResponse> {
    return this.http.post<PuntoResponse>(this.baseUrl, punto).pipe(
      tap(() => this.emitRefresh())
    );
  }

  /** Actualiza un punto existente. */
  actualizarPunto(id: number, punto: Partial<PuntoReciclaje>): Observable<PuntoResponse> {
    return this.http.put<PuntoResponse>(`${this.baseUrl}/${id}`, punto).pipe(
      tap(() => this.emitRefresh())
    );
  }

  /** Elimina un punto por id. */
  eliminarPunto(id: number): Observable<GenericResponse<null>> {
    return this.http.delete<GenericResponse<null>>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.emitRefresh())
    );
  }

  /** Permite forzar manualmente un refresco de puntos. */
  solicitarRefresco(): void {
    this.emitRefresh();
  }
}

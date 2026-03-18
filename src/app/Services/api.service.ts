import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Servicio base para centralizar peticiones HTTP y manejo de errores.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  /**
   * Realiza una petición GET.
   */
  get<T>(url: string, options?: object): Observable<T> {
    return this.http.get<T>(url, options).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Realiza una petición POST.
   */
  post<T>(url: string, body: any, options?: object): Observable<T> {
    return this.http.post<T>(url, body, options).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Realiza una petición PUT.
   */
  put<T>(url: string, body: any, options?: object): Observable<T> {
    return this.http.put<T>(url, body, options).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Realiza una petición DELETE.
   */
  delete<T>(url: string, options?: object): Observable<T> {
    return this.http.delete<T>(url, options).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Maneja errores HTTP.
   */
  private handleError(error: HttpErrorResponse) {
    // Manejo centralizado de errores
    return throwError(() => error);
  }
}

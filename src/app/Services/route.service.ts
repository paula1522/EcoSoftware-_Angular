import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OSRMTripResponse {
  trips: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
    legs: any[];
  }>;
  waypoints: Array<{
    location: [number, number];
    waypoint_index: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class RouteService {
  private readonly osrmUrl = environment.osrmUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la ruta óptima que pasa por todos los puntos en el orden dado.
   * @param coords Array de [lat, lng]
   */
  getRutaOptimizada(coords: [number, number][]): Observable<OSRMTripResponse> {
    const coordsStr = coords.map(c => `${c[1]},${c[0]}`).join(';');
    const url = `${this.osrmUrl}/trip/v1/driving/${coordsStr}`;
    const params = new HttpParams()
      .set('overview', 'full')
      .set('geometries', 'geojson')
      .set('steps', 'true')
      .set('roundtrip', 'false')
      .set('source', 'first')
      .set('destination', 'last');
    return this.http.get<OSRMTripResponse>(url, { params });
  }
}
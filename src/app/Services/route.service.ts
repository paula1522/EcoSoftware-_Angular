import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OSRMTripResponse {
  trips: {
    geometry: {
      coordinates: number[][];
    };
    distance: number;
    duration: number;
  }[];
  waypoints: {
    waypoint_index: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private readonly BASE_URL = 'https://router.project-osrm.org';

  constructor(private http: HttpClient) {}

  getRutaOptimizada(coordenadas: [number, number][]): Observable<OSRMTripResponse> {
    if (!coordenadas || coordenadas.length < 2) {
      throw new Error('Se necesitan al menos 2 puntos');
    }
    const coordsString = coordenadas
      .map(c => `${c[1]},${c[0]}`) // lng,lat
      .join(';');
    const params = new HttpParams()
      .set('overview', 'full')
      .set('geometries', 'geojson');
    return this.http.get<OSRMTripResponse>(
      `${this.BASE_URL}/trip/v1/driving/${coordsString}`,
      { params }
    );
  }
}
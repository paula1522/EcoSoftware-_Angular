import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface OsrmNearestResponse {
  waypoints?: Array<{ location: [number, number] }>;
}

@Injectable({
  providedIn: 'root',
})
export class OsrmService {
  constructor(private readonly http: HttpClient) {}

  public calcularRuta<T>(
    origin: { lat: number; lng: number },
    dest: { lat: number; lng: number },
    alternatives = 2
  ): Observable<T> {
    const params = new HttpParams()
      .set('origin', `${origin.lng},${origin.lat}`)
      .set('dest', `${dest.lng},${dest.lat}`)
      .set('overview', 'full')
      .set('geometries', 'geojson')
      .set('steps', 'true')
      .set('alternatives', String(alternatives));

    return this.http.get<T>('/api/route', { params });
  }

  public nearest(lat: number, lng: number, number = 1): Observable<OsrmNearestResponse> {
    const params = new HttpParams()
      .set('lat', String(lat))
      .set('lng', String(lng))
      .set('number', String(number));

    return this.http.get<OsrmNearestResponse>('/api/nearest', { params });
  }
}

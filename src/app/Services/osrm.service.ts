import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OsrmNearestResponse {
  waypoints?: Array<{ location: [number, number] }>;
}

@Injectable({
  providedIn: 'root',
})
export class OsrmService {
  private readonly baseApiUrl = environment.osrmUrl.replace(/\/$/, '');

  constructor(private readonly http: HttpClient) {}

  public calcularRuta<T>(
    origin: { lat: number; lng: number },
    dest: { lat: number; lng: number },
    alternatives = 2
  ): Observable<T> {
    const params = new HttpParams()
      .set('overview', 'full')
      .set('geometries', 'geojson')
      .set('steps', 'true')
      .set('alternatives', alternatives > 0 ? 'true' : 'false');

    return this.http.get<T>(
      `${this.baseApiUrl}/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}`,
      { params }
    );
  }

  public nearest(lat: number, lng: number, number = 1): Observable<OsrmNearestResponse> {
    const params = new HttpParams()
      .set('number', String(number));

    return this.http.get<OsrmNearestResponse>(
      `${this.baseApiUrl}/nearest/v1/driving/${lng},${lat}`,
      { params }
    );
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${(environment.apiBaseUrl || environment.apiUrl || '').replace(/\/$/, '')}/api/auth`;
  private TOKEN_KEY = 'jwt_token';
  private LEGACY_TOKEN_KEY = 'token';
  private USER_KEY = 'user_data';

  constructor(private http: HttpClient) {}

  /** 🔐 Iniciar sesión */
login(credentials: { correo: string; contrasena: string }): Observable<any> {
  return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
    tap(response => {
      this.setSession(response);
    })
  );
}

  /** 🚪 Cerrar sesión */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.LEGACY_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /** 🎟 Obtener token actual */
  getToken(): string | null {
    const raw = localStorage.getItem(this.TOKEN_KEY) || localStorage.getItem(this.LEGACY_TOKEN_KEY);
    return this.normalizeToken(raw);
  }

  /** 👤 Obtener usuario actual (correo, rol, etc.) */
  getUser(): any {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

 setSession(response: any) {
  const token = this.extractToken(response);
  if (token) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.LEGACY_TOKEN_KEY, token);
  }

  const userPayload = response?.data ?? response;
  localStorage.setItem(this.USER_KEY, JSON.stringify(userPayload));
}

  private extractToken(response: any): string | null {
    const candidates = [
      response?.token,
      response?.access_token,
      response?.jwt,
      response?.data?.token,
      response?.data?.access_token,
      response?.data?.jwt,
    ];

    for (const candidate of candidates) {
      const normalized = this.normalizeToken(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }

  private normalizeToken(raw: unknown): string | null {
    if (typeof raw !== 'string') {
      return null;
    }

    let token = raw.trim();
    if (!token) {
      return null;
    }

    if (token.toLowerCase().startsWith('bearer ')) {
      token = token.slice(7).trim();
    }

    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      token = token.slice(1, -1).trim();
    }

    return token || null;
  }

  getUserId(): number | null {
    const user = this.getUser();
    return user ? user.idUsuario : null;
  }

  /** 🧠 Saber si hay sesión activa */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** 🎭 Obtener rol del usuario */
  getUserRole(): string | null {
    const user = this.getUser();
    return user?.rol || null;
  }

  isLoggedIn(): boolean {
  return !!this.getToken();

}
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Noticia } from '../Models/noticia';

@Injectable({
  providedIn: 'root'
})
export class NoticiaService {

  private readonly apiUrl = 'http://localhost:8082/api/noticias';

  constructor(private http: HttpClient) {}

  listarNoticias(): Observable<Noticia[]> {
    return this.http.get<Noticia[]>(this.apiUrl);
  }
}

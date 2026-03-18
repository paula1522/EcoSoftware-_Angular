// cloudinary.service.ts - VERSIÓN CORREGIDA
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  // Reemplaza con tus datos REALES de Cloudinary
  private cloudName = 'dr8s6kjpp'; // Tu cloud name
  private uploadPreset = 'ecosoftware_unsigned'; // Debe existir en tu dashboard
  private apiUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`;

  constructor(private http: HttpClient) {}

  // Método mejorado con manejo de tipos
  subirArchivo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    // Opcional: agregar parámetros adicionales
    formData.append('folder', 'ecosoftware/perfiles'); // Organiza en carpetas
    
    return this.http.post(this.apiUrl, formData);
  }

  // Método específico para imágenes con optimización
  subirImagen(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'ecosoftware/perfiles');
    formData.append('transformation', 'w_500,h_500,c_fill'); // Redimensiona
    
    return this.http.post(this.apiUrl, formData);
  }

  
}
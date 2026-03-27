// cloudinary.service.ts - VERSIÓN CORREGIDA
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  // Cloud name unificado del proyecto
  private cloudName = 'dhl2ixdsr';
  private uploadPreset = 'ecosoftware_unsigned'; // Debe existir en tu dashboard
  private apiUrlAuto = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;
  private apiUrlImage = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

  constructor(private http: HttpClient) {}

  // Método mejorado con manejo de tipos
  subirArchivo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    // Opcional: agregar parámetros adicionales
    formData.append('folder', 'ecosoftware/perfiles'); // Organiza en carpetas
    
    return this.http.post(this.apiUrlAuto, formData);
  }

  // Método específico para imágenes con optimización
  subirImagen(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'ecosoftware/perfiles');
    formData.append('transformation', 'w_500,h_500,c_fill'); // Redimensiona
    
    return this.http.post(this.apiUrlImage, formData);
  }

  
}
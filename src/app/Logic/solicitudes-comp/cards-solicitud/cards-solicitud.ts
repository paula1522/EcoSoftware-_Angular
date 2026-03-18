import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Service } from '../../../Services/solicitud.service';
import { ServiceModel } from '../../../Models/solicitudes.model';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { Boton } from "../../../shared/botones/boton/boton";
import { UsuarioService } from '../../../Services/usuario.service';
import { UsuarioModel } from '../../../Models/usuario';
import { AuthService } from '../../../auth/auth.service';
import { LocalidadNombrePipe } from "../../../core/pipes/LocalidadNombrePipe";

@Component({
  selector: 'app-cards-solicitud',
  standalone: true,              // 👈 importante si estás usando standalone
  imports: [CommonModule, COMPARTIR_IMPORTS, Boton, LocalidadNombrePipe],       // 👈 aquí agregamos CommonModule para usar *ngFor y *ngIf
  templateUrl: './cards-solicitud.html',
  styleUrls: ['./cards-solicitud.css']
})
export class CardsSolicitud implements OnInit {

  solicitudes: ServiceModel[] = [];
  idCiudadano: UsuarioModel [] = [];
  usuarioActual: UsuarioModel | null = null;
  idUsuarioActual: number | null = null;

  constructor(private service: Service, private usuario: UsuarioService, private authService: AuthService) {
    
  }

  ngOnInit(): void {
    this.obtenerUsuarioActual();
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    if (this.idUsuarioActual === null) {
      console.log('No hay usuario logueado');
      return;
    }
    this.service.listarPorUsuario(this.idUsuarioActual).subscribe({
      next: (data) => {
        this.solicitudes = data.map(s => ({
          ...s,
          idUsuario: this.idCiudadano
        }));
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
      }
    });
  }

  obtenerUsuarioActual(): void {
    this.usuarioActual = this.authService.getUser();
    if (this.usuarioActual) {
      this.idUsuarioActual = this.usuarioActual.idUsuario ?? null;
    } else {
      console.log('No hay usuario logueado');
    }
  }
}


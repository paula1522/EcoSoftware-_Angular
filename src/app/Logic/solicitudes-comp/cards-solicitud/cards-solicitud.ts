import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Service } from '../../../Services/solicitud.service';
import { ServiceModel } from '../../../Models/solicitudes.model';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { Boton } from "../../../shared/botones/boton/boton";
import { UsuarioService } from '../../../Services/usuario.service';
import { UsuarioModel, Localidad } from '../../../Models/usuario';
import { AuthService } from '../../../auth/auth.service';
import { LocalidadNombrePipe } from "../../../core/pipes/LocalidadNombrePipe";
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-cards-solicitud',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    COMPARTIR_IMPORTS,
    Boton,
    LocalidadNombrePipe,
    Modal
  ],
  templateUrl: './cards-solicitud.html',
  styleUrls: ['./cards-solicitud.css']
})
export class CardsSolicitud implements OnInit {

  solicitudes: ServiceModel[] = [];
  usuarioActual: UsuarioModel | null = null;
  idUsuarioActual: number | null = null;

  // 🔥 SELECT LOCALIDADES
  localidades = Object.values(Localidad);

  // 🔥 MODALES
  modalEditarAbierto = false;
  modalCancelarAbierto = false;
  modalVerAbierto = false;

  solicitudSeleccionada: ServiceModel | null = null;

  constructor(
    private service: Service,
    private usuario: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerUsuarioActual();
    this.cargarSolicitudes();
  }

  obtenerUsuarioActual(): void {
    this.usuarioActual = this.authService.getUser();

    if (this.usuarioActual) {
      this.idUsuarioActual = this.usuarioActual.idUsuario ?? null;
    } else {
      console.log('No hay usuario logueado');
    }
  }

  cargarSolicitudes(): void {
    if (this.idUsuarioActual == null) return;

    this.service.listarPorUsuario(this.idUsuarioActual).subscribe({
      next: (data) => this.solicitudes = data,
      error: (err) => console.error('Error al cargar solicitudes:', err)
    });
  }

  // 🔹 ABRIR MODALES
  abrirModalEditar(s: ServiceModel) {
    this.solicitudSeleccionada = { ...s }; // copia segura
    this.modalEditarAbierto = true;
  }

  abrirModalCancelar(s: ServiceModel) {
    this.solicitudSeleccionada = s;
    this.modalCancelarAbierto = true;
  }

  abrirModalVer(s: ServiceModel) {
    this.solicitudSeleccionada = s;
    this.modalVerAbierto = true;
  }

  // 🔹 CERRAR MODALES
  cerrarModalEditar() {
    this.modalEditarAbierto = false;
    this.solicitudSeleccionada = null;
  }

  cerrarModalCancelar() {
    this.modalCancelarAbierto = false;
    this.solicitudSeleccionada = null;
  }

  cerrarModalVer() {
    this.modalVerAbierto = false;
    this.solicitudSeleccionada = null;
  }



  // ===============================
// EDITAR SOLICITUD
// ===============================
guardarCambios(): void {
  if (!this.solicitudSeleccionada) return;

  const id = this.solicitudSeleccionada.idSolicitud;

  if (!id) {
    console.error('ID inválido');
    return;
  }

  this.service.actualizarSolicitud(id, this.solicitudSeleccionada).subscribe({
    next: () => {
      console.log('Solicitud actualizada correctamente');
      this.cargarSolicitudes();
      this.cerrarModalEditar();
    },
    error: (err) => console.error('Error al actualizar', err)
  });
}


// ===============================
// CANCELAR SOLICITUD (YA CASI LO TENÍAS)
// ===============================
confirmarCancelar(): void {
  if (!this.solicitudSeleccionada) return;

  const id = this.solicitudSeleccionada.idSolicitud;

  if (!id) {
    console.error('ID inválido');
    return;
  }

  this.service.cancelarSolicitud(id).subscribe({
    next: () => {
      console.log('Solicitud cancelada correctamente');
      this.cargarSolicitudes();
      this.cerrarModalCancelar();
    },
    error: (err) => console.error('Error al cancelar solicitud', err)
  });
}
// FILTRO
estadoSeleccionado: string = '';

// Lista filtrada
get solicitudesFiltradas(): ServiceModel[] {
  if (!this.estadoSeleccionado) return this.solicitudes;

  return this.solicitudes.filter(s =>
    s.estadoPeticion === this.estadoSeleccionado
  );
}

// PAGINACIÓN
paginaActual: number = 1;
itemsPorPagina: number = 5;

// Lista paginada
get solicitudesPaginadas(): ServiceModel[] {
  const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
  const fin = inicio + this.itemsPorPagina;
  return this.solicitudesFiltradas.slice(inicio, fin);
}

// Total páginas
get totalPaginas(): number {
  return Math.ceil(this.solicitudesFiltradas.length / this.itemsPorPagina);
}

// Cambiar página
cambiarPagina(p: number) {
  if (p < 1 || p > this.totalPaginas) return;
  this.paginaActual = p;
}
}
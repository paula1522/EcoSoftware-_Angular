import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Service } from '../../../Services/solicitud.service';
import { ServiceModel, TipoResiduo } from '../../../Models/solicitudes.model';
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

  //SELECT LOCALIDADES
  localidades = Object.values(Localidad);

  //MODALES
  modalEditarAbierto = false;
  modalCancelarAbierto = false;
  modalVerAbierto = false;


  // Filtros
estadoSeleccionado: string = '';
tipoResiduoSeleccionado: TipoResiduo | '' = '';
  tiposResiduo: TipoResiduo[] = Object.values(TipoResiduo);

// Ordenamiento
campoOrden: keyof ServiceModel = 'idSolicitud';
ascendente: boolean = true;

  solicitudSeleccionada: ServiceModel | null = null;
    ordenSeleccionado: 'reciente' | 'antiguo' = 'reciente';


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


// Lista filtrada
get solicitudesFiltradas(): ServiceModel[] {
  let filtradas = this.solicitudes;

  // Filtrar por estado
  if (this.estadoSeleccionado) {
    filtradas = filtradas.filter(s => s.estadoPeticion === this.estadoSeleccionado);
  }

  // Filtrar por tipo de residuo
  if (this.tipoResiduoSeleccionado) {
    filtradas = filtradas.filter(s => s.tipoResiduo === this.tipoResiduoSeleccionado);
  }
  

  

  // ORDEN POR FECHA DE CREACIÓN
    filtradas.sort((a, b) => {
      const fechaA = a.fechaCreacionSolicitud ? new Date(a.fechaCreacionSolicitud).getTime() : 0;
      const fechaB = b.fechaCreacionSolicitud ? new Date(b.fechaCreacionSolicitud).getTime() : 0;
      return this.ordenSeleccionado === 'reciente' ? fechaB - fechaA : fechaA - fechaB;
    });

  return filtradas;
}
// PAGINACIÓN
paginaActual: number = 1;
itemsPorPagina: number = 16;

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
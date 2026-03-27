import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { SolicitudRecoleccionService } from '../../../Services/solicitud.service';
import { 
  SolicitudRecoleccion, 
  EstadoPeticion, 
  Localidad, 
  TipoResiduo 
} from '../../../Models/solicitudes.model';
import { Boton } from "../../../shared/botones/boton/boton";
import { Modal } from "../../../shared/modal/modal";
import { Alerta } from '../../../shared/alerta/alerta';
import { LocalidadNombrePipe } from "../../../core/pipes/LocalidadNombrePipe";

@Component({
  selector: 'app-card-a-r-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule, Boton, Modal, Alerta, LocalidadNombrePipe],
  templateUrl: './card-a-r-solicitud.html',
  styleUrls: ['./card-a-r-solicitud.css']
})
export class CardARSolicitud implements OnInit {
  @Input() solicitudes: SolicitudRecoleccion[] = [];
  @Output() solicitudAceptada = new EventEmitter<number>();
  @ViewChild('modalRechazo') modalRechazo!: Modal;
  @ViewChild('modalVer') modalVer!: Modal;  // nuevo modal de ver

  selectedSolicitud: SolicitudRecoleccion | null = null;
  motivosDisponibles: string[] = [
    'Datos incorrectos',
    'Solicitud duplicada',
    'Información incompleta',
    'No cumple requisitos',
    'Revisión administrativa'
  ];
  selectedMotivos: { [id: number]: string } = {};

  mostrarAlerta: boolean = false;
  mensajeAlerta: string = '';
  tipoAlerta: 'success' | 'error' | 'warning' | 'info' = 'info';

  loadingAccept: { [key: number]: boolean } = {};
  readonly EstadoPeticion = EstadoPeticion;

  // Filtros
  localidades = Object.values(Localidad);
  tiposResiduo = Object.values(TipoResiduo);
  localidadSeleccionada: Localidad | '' = '';
  tipoResiduoSeleccionado: TipoResiduo | '' = '';
  fechaProgramadaDesde: string = '';
  fechaProgramadaHasta: string = '';
  ordenFecha: 'asc' | 'desc' = 'desc';

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 8;

  constructor(private solicitudService: SolicitudRecoleccionService) {}

  ngOnInit(): void {
    if (!this.solicitudes || this.solicitudes.length === 0) {
      this.cargarSolicitudesPendientes();
    }
  }

  private handleHttpError(error: any): string {
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    return `Error ${error.status}: ${error.statusText}`;
  }

  mostrarAlertaMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;
  }

  cargarSolicitudesPendientes(): void {
    this.solicitudService.listarPorEstado(EstadoPeticion.Pendiente).subscribe({
      next: (data) => {
        this.solicitudes = data;
        this.paginaActual = 1;
      },
      error: (err) => this.mostrarAlertaMensaje(`Error al cargar solicitudes: ${this.handleHttpError(err)}`, 'error')
    });
  }

  getSelectedMotivo(id: number | undefined): string {
    if (!id) return '';
    return this.selectedMotivos[id] || '';
  }

  setSelectedMotivo(id: number | undefined, value: string) {
    if (!id) return;
    this.selectedMotivos[id] = value;
  }

  // ============== FILTROS Y PAGINACIÓN ==============
  get solicitudesFiltradas(): SolicitudRecoleccion[] {
    let filtradas = [...this.solicitudes];

    if (this.localidadSeleccionada) {
      filtradas = filtradas.filter(s => s.localidad === this.localidadSeleccionada);
    }
    if (this.tipoResiduoSeleccionado) {
      filtradas = filtradas.filter(s => s.tipoResiduo === this.tipoResiduoSeleccionado);
    }
    if (this.fechaProgramadaDesde) {
      const desde = new Date(this.fechaProgramadaDesde);
      desde.setHours(0, 0, 0, 0);
      filtradas = filtradas.filter(s => {
        if (!s.fechaProgramada) return false;
        return new Date(s.fechaProgramada) >= desde;
      });
    }
    if (this.fechaProgramadaHasta) {
      const hasta = new Date(this.fechaProgramadaHasta);
      hasta.setHours(23, 59, 59, 999);
      filtradas = filtradas.filter(s => {
        if (!s.fechaProgramada) return false;
        return new Date(s.fechaProgramada) <= hasta;
      });
    }

    filtradas.sort((a, b) => {
      const fechaA = a.fechaProgramada ? new Date(a.fechaProgramada).getTime() : 0;
      const fechaB = b.fechaProgramada ? new Date(b.fechaProgramada).getTime() : 0;
      return this.ordenFecha === 'desc' ? fechaB - fechaA : fechaA - fechaB;
    });

    return filtradas;
  }

  get solicitudesPaginadas(): SolicitudRecoleccion[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.solicitudesFiltradas.slice(inicio, inicio + this.itemsPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.solicitudesFiltradas.length / this.itemsPorPagina);
  }

  cambiarPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaActual = p;
  }

  limpiarFiltros(): void {
    this.localidadSeleccionada = '';
    this.tipoResiduoSeleccionado = '';
    this.fechaProgramadaDesde = '';
    this.fechaProgramadaHasta = '';
    this.ordenFecha = 'desc';
    this.paginaActual = 1;
  }

  // ============== ACCIONES ==============
  verSolicitud(solicitud: SolicitudRecoleccion): void {
    this.selectedSolicitud = solicitud;
    if (this.modalVer) this.modalVer.isOpen = true;
  }

  cerrarModalVer(): void {
    if (this.modalVer) this.modalVer.isOpen = false;
    this.selectedSolicitud = null;
  }

  aceptarSolicitud(solicitud: SolicitudRecoleccion): void {
    const id = solicitud.idSolicitud!;
    if (this.loadingAccept[id]) return;

    if (solicitud.estadoPeticion !== EstadoPeticion.Pendiente) {
      this.mostrarAlertaMensaje('Esta solicitud ya no está pendiente', 'warning');
      return;
    }

    this.loadingAccept[id] = true;

    this.solicitudService.aceptarSolicitud(id)
      .pipe(finalize(() => delete this.loadingAccept[id]))
      .subscribe({
        next: () => {
          this.mostrarAlertaMensaje(`Solicitud #${id} aceptada correctamente`, 'success');
          this.solicitudes = this.solicitudes.filter(s => s.idSolicitud !== id);
          this.solicitudAceptada.emit(id);
        },
        error: (err) => {
          this.mostrarAlertaMensaje(`Error al aceptar la solicitud: ${this.handleHttpError(err)}`, 'error');
          this.cargarSolicitudesPendientes(); // recargar por si hay cambios
        }
      });
  }

  abrirModalRechazo(solicitud: SolicitudRecoleccion) {
    this.selectedSolicitud = solicitud;
    if (this.modalRechazo) this.modalRechazo.isOpen = true;
  }

  cerrarModalRechazo() {
    if (this.modalRechazo) this.modalRechazo.isOpen = false;
    this.selectedSolicitud = null;
  }

  confirmarRechazo() {
    if (!this.selectedSolicitud) return;

    const id = this.selectedSolicitud.idSolicitud!;
    const motivo = this.selectedMotivos[id];
    if (!motivo || !motivo.trim()) {
      this.mostrarAlertaMensaje('Seleccione un motivo de rechazo antes de continuar.', 'warning');
      return;
    }

    this.solicitudService.rechazarSolicitud(id, motivo).subscribe({
      next: () => {
        delete this.selectedMotivos[id];
        this.cerrarModalRechazo();
        this.cargarSolicitudesPendientes();
        this.mostrarAlertaMensaje(`Solicitud #${id} rechazada correctamente`, 'success');
      },
      error: (err) => this.mostrarAlertaMensaje(`Error al rechazar la solicitud: ${this.handleHttpError(err)}`, 'error')
    });
  }
}
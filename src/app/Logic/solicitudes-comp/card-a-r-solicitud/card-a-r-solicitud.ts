import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudRecoleccionService } from '../../../Services/solicitud.service';
import { SolicitudRecoleccion, EstadoPeticion } from '../../../Models/solicitudes.model'; // ✅ Importamos EstadoPeticion
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
  @ViewChild('modalRechazo') modalRechazo!: Modal;

  selectedSolicitud: SolicitudRecoleccion | null = null;
  motivosDisponibles: string[] = [
    'Datos incorrectos',
    'Solicitud duplicada',
    'Información incompleta',
    'No cumple requisitos',
    'Revisión administrativa'
  ];
  selectedMotivos: { [id: number]: string } = {};

  // PROPIEDADES PARA ALERTAS
  mostrarAlerta: boolean = false;
  mensajeAlerta: string = '';
  tipoAlerta: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(private solicitudService: SolicitudRecoleccionService) {}

  ngOnInit(): void {
    if (!this.solicitudes || this.solicitudes.length === 0) {
      this.cargarSolicitudesPendientes();
    }
  }

  mostrarAlertaMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;
  }

  cargarSolicitudesPendientes(): void {
    // ✅ Cambiar 'Pendiente' por EstadoPeticion.Pendiente
    this.solicitudService.listarPorEstado(EstadoPeticion.Pendiente).subscribe({
      next: (data) => { this.solicitudes = data; },
      error: (err) => this.mostrarAlertaMensaje(`Error al cargar solicitudes: ${err.message || err.statusText}`, 'error')
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

  ver(s: SolicitudRecoleccion) { console.log('VER', s); }

  aceptarSolicitud(solicitud: SolicitudRecoleccion): void {
    this.solicitudService.aceptarSolicitud(solicitud.idSolicitud!).subscribe({
      next: () => {
        this.mostrarAlertaMensaje(`Solicitud #${solicitud.idSolicitud} aceptada correctamente`, 'success');
        this.cargarSolicitudesPendientes();
      },
      error: (err) => this.mostrarAlertaMensaje(`Error al aceptar la solicitud: ${err.message || err.statusText}`, 'error')
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
      error: (err) => this.mostrarAlertaMensaje(`Error al rechazar la solicitud: ${err.message || err.statusText}`, 'error')
    });
  }
}
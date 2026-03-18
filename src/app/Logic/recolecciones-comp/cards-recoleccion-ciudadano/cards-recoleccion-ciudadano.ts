import { Component, OnInit, ViewChild } from '@angular/core';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { ModeloRecoleccion, EstadoRecoleccion } from '../../../Models/modelo-recoleccion';
import { Boton } from '../../../shared/botones/boton/boton';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-cards-recoleccion-ciudadano',
  imports: [COMPARTIR_IMPORTS, Boton, Modal],
  templateUrl: './cards-recoleccion-ciudadano.html',
  styleUrl: './cards-recoleccion-ciudadano.css'
})
export class CardsRecoleccionCiudadano implements OnInit {

  recolecciones: ModeloRecoleccion[] = [];
  cargando = true;
  error = '';
  EstadoRecoleccion = EstadoRecoleccion;
  recoleccionSeleccionada: ModeloRecoleccion | null = null;
  fechaProgramadaEditable: string = '';
  estadoEditable: EstadoRecoleccion = EstadoRecoleccion.Pendiente;

  @ViewChild('modalVerRecoleccion') modalVerRecoleccion!: Modal;
  @ViewChild('modalEdicion') modalEdicion!: Modal;
  @ViewChild('modalCancelar') modalCancelar!: Modal; // Nuevo modal

  constructor(private recoleccionService: RecoleccionService) {}

  ngOnInit(): void {
    this.cargarMisRecolecciones();
  }

  cargarMisRecolecciones(): void {
    this.recoleccionService.listarActivas().subscribe({
      next: data => {
        this.recolecciones = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar mis recolecciones';
        this.cargando = false;
      }
    });
  }

  mostrarBotones(estado: string): boolean {
    return estado !== 'Completada' && estado !== 'Cancelada';
  }

  cancelarRecoleccion(id: number) {
    this.recoleccionService.actualizarEstado(id, EstadoRecoleccion.Cancelada)
      .subscribe(() => {
        this.recolecciones = this.recolecciones.filter(r => r.idRecoleccion !== id);
      });
  }

  // Modal edición
  abrirModalEdicion(reco: ModeloRecoleccion) {
    this.recoleccionSeleccionada = { ...reco };
    this.estadoEditable = reco.estado as EstadoRecoleccion;
    this.fechaProgramadaEditable = reco.fechaRecoleccion
      ? new Date(reco.fechaRecoleccion).toISOString().slice(0, 16)
      : '';
    if (this.modalEdicion) this.modalEdicion.isOpen = true;
  }

  guardarEdicion() {
    if (!this.recoleccionSeleccionada) return;

    this.recoleccionSeleccionada.estado = this.estadoEditable;
    this.recoleccionSeleccionada.fechaRecoleccion = new Date(this.fechaProgramadaEditable).toISOString();

    this.recoleccionService.actualizarRecoleccion(
      this.recoleccionSeleccionada.idRecoleccion!,
      this.recoleccionSeleccionada
    ).subscribe({
      next: actualizada => {
        this.recolecciones = this.recolecciones.map(r =>
          r.idRecoleccion === actualizada.idRecoleccion ? actualizada : r
        );
        this.cerrarModalEdicion();
      },
      error: err => console.error('Error al actualizar', err)
    });
  }

  cerrarModalEdicion() {
    if (this.modalEdicion) this.modalEdicion.isOpen = false;
    this.recoleccionSeleccionada = null;
  }

  // Modal ver detalles
  abrirModalVerRecoleccion(reco: ModeloRecoleccion) {
    this.recoleccionSeleccionada = reco;
    if (this.modalVerRecoleccion) this.modalVerRecoleccion.isOpen = true;
  }

  cerrarModalVerRecoleccion() {
    if (this.modalVerRecoleccion) this.modalVerRecoleccion.isOpen = false;
    this.recoleccionSeleccionada = null;
  }

  // Modal cancelar
  abrirModalCancelar(reco: ModeloRecoleccion) {
    this.recoleccionSeleccionada = reco;
    if (this.modalCancelar) this.modalCancelar.isOpen = true;
  }

  cerrarModalCancelar() {
    if (this.modalCancelar) this.modalCancelar.isOpen = false;
    this.recoleccionSeleccionada = null;
  }

  confirmarCancelar() {
    if (!this.recoleccionSeleccionada) return;
    this.cancelarRecoleccion(this.recoleccionSeleccionada.idRecoleccion!);
    this.cerrarModalCancelar();
  }
}

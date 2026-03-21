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
  styleUrls: ['./cards-recoleccion-ciudadano.css']
})
export class CardsRecoleccionCiudadano implements OnInit {

  recolecciones: ModeloRecoleccion[] = [];
  cargando = true;
  error = '';
  EstadoRecoleccion = EstadoRecoleccion;
  recoleccionSeleccionada: ModeloRecoleccion | null = null;

  // Campos editables
  fechaProgramadaEditable: string = '';
  observacionesEditable: string = '';
  evidenciaEditable: string = '';

  // ===================== FILTROS =====================
  estadoSeleccionado: EstadoRecoleccion | '' = '';
  tipoResiduoSeleccionado: string | '' = '';

  // ===================== ORDENAMIENTO =====================
  ordenSeleccionado: 'reciente' | 'antiguo' = 'reciente';
  campoOrden: keyof ModeloRecoleccion = 'idRecoleccion';

  // ===================== PAGINACIÓN =====================
  paginaActual: number = 1;
  itemsPorPagina: number = 8;

  // ===================== MODALES =====================
  @ViewChild('modalVerRecoleccion') modalVerRecoleccion!: Modal;
  @ViewChild('modalEdicion') modalEdicion!: Modal;
  @ViewChild('modalCancelar') modalCancelar!: Modal;

  constructor(private recoleccionService: RecoleccionService) {}

  ngOnInit(): void {
    this.cargarMisRecolecciones();
  }

  // ===================== CARGAR RECOLECCIONES =====================
  cargarMisRecolecciones(): void {
    this.cargando = true;
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

  // ===================== CANCELAR RECOLECCIÓN =====================
  cancelarRecoleccion(id: number) {
    this.recoleccionService.actualizarEstado(id, EstadoRecoleccion.Cancelada)
      .subscribe(() => {
        this.recolecciones = this.recolecciones.filter(r => r.idRecoleccion !== id);
      });
  }

  // ===================== MODAL EDICIÓN =====================
  abrirModalEdicion(reco: ModeloRecoleccion) {
    this.recoleccionSeleccionada = { ...reco };
    this.fechaProgramadaEditable = reco.fechaRecoleccion
      ? new Date(reco.fechaRecoleccion).toISOString().slice(0, 16)
      : '';
    this.observacionesEditable = reco.observaciones || '';
    this.evidenciaEditable = reco.evidencia || '';

    if (this.modalEdicion) this.modalEdicion.isOpen = true;
  }

  guardarEdicion() {
    if (!this.recoleccionSeleccionada) return;

    const datosActualizar: Partial<ModeloRecoleccion> = {
      observaciones: this.observacionesEditable,
      evidencia: this.evidenciaEditable,
      fechaRecoleccion: this.fechaProgramadaEditable
        ? `${this.fechaProgramadaEditable}:00`
        : null
    };

    this.recoleccionService.actualizarRecoleccion(
      this.recoleccionSeleccionada.idRecoleccion,
      datosActualizar
    ).subscribe({
      next: actualizado => {
        console.log('Recolección actualizada', actualizado);
        this.recoleccionSeleccionada = actualizado;

        // Actualizar lista local
        this.recolecciones = this.recolecciones.map(r =>
          r.idRecoleccion === actualizado.idRecoleccion ? actualizado : r
        );

        alert('Actualización exitosa');
        this.cerrarModalEdicion();
      },
      error: err => {
        console.error('Error al actualizar', err);
        alert('No se pudo actualizar. Revisa la consola.');
      }
    });
  }

  cerrarModalEdicion() {
    if (this.modalEdicion) this.modalEdicion.isOpen = false;
    this.recoleccionSeleccionada = null;
    this.fechaProgramadaEditable = '';
    this.observacionesEditable = '';
    this.evidenciaEditable = '';
  }

  // ===================== MODAL VER =====================
  abrirModalVerRecoleccion(reco: ModeloRecoleccion) {
    this.recoleccionSeleccionada = reco;
    if (this.modalVerRecoleccion) this.modalVerRecoleccion.isOpen = true;
  }

  cerrarModalVerRecoleccion() {
    if (this.modalVerRecoleccion) this.modalVerRecoleccion.isOpen = false;
    this.recoleccionSeleccionada = null;
  }

  // ===================== MODAL CANCELAR =====================
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

  // ===================== FILTROS Y ORDENAMIENTO =====================
  get recoleccionesFiltradas(): ModeloRecoleccion[] {
    let filtradas = this.recolecciones;

    if (this.estadoSeleccionado) {
      filtradas = filtradas.filter(r => r.estado === this.estadoSeleccionado);
    }

    filtradas.sort((a, b) => {
      const fechaA = a.fechaCreacionRecoleccion ? new Date(a.fechaCreacionRecoleccion).getTime() : 0;
      const fechaB = b.fechaCreacionRecoleccion ? new Date(b.fechaCreacionRecoleccion).getTime() : 0;
      return this.ordenSeleccionado === 'reciente' ? fechaB - fechaA : fechaA - fechaB;
    });

    return filtradas;
  }

  get recoleccionesPaginadas(): ModeloRecoleccion[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.recoleccionesFiltradas.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.recoleccionesFiltradas.length / this.itemsPorPagina);
  }

  cambiarPagina(p: number) {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaActual = p;
  }
}
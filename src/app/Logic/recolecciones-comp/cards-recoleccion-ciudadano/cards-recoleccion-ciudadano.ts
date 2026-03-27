import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { Boton } from "../../../shared/botones/boton/boton";
import { Modal } from '../../../shared/modal/modal';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { ModeloRecoleccion, EstadoRecoleccion } from '../../../Models/modelo-recoleccion';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-cards-recoleccion-ciudadano',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    COMPARTIR_IMPORTS,
    Boton,
    Modal
  ],
  templateUrl: './cards-recoleccion-ciudadano.html',
  styleUrls: ['./cards-recoleccion-ciudadano.css']
})
export class CardsRecoleccionCiudadano implements OnInit {

  recolecciones: ModeloRecoleccion[] = [];
  cargando = true;
  error = '';
  EstadoRecoleccion = EstadoRecoleccion;

  // Filtros
  estadoSeleccionado: EstadoRecoleccion | '' = '';
  fechaDesde: string = '';
  fechaHasta: string = '';
  ordenFecha: 'asc' | 'desc' = 'desc';

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 4;

  // Modales
  @ViewChild('modalVerRecoleccion') modalVerRecoleccion!: Modal;
  @ViewChild('modalEdicion') modalEdicion!: Modal;
  @ViewChild('modalCancelar') modalCancelar!: Modal;

  recoleccionSeleccionada: ModeloRecoleccion | null = null;
  fechaProgramadaEditable: string = '';
  observacionesEditable: string = '';

  constructor(
    private recoleccionService: RecoleccionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarRecolecciones();
  }

  cargarRecolecciones(): void {
    this.cargando = true;
    // Usar el nuevo endpoint que devuelve recolecciones por solicitante
    this.recoleccionService.listarMisRecoleccionesCiudadano().subscribe({
      next: data => {
        this.recolecciones = data;
        this.cargando = false;
        this.paginaActual = 1;
      },
      error: err => {
        console.error('Error al cargar recolecciones:', err);
        this.error = 'No se pudieron cargar tus recolecciones.';
        this.cargando = false;
      }
    });
  }

  // ===============================
  // FILTROS Y ORDENAMIENTO
  // ===============================
  get recoleccionesFiltradas(): ModeloRecoleccion[] {
    let filtradas = [...this.recolecciones];

    if (this.estadoSeleccionado) {
      filtradas = filtradas.filter(r => r.estado === this.estadoSeleccionado);
    }

    if (this.fechaDesde) {
      const desde = new Date(this.fechaDesde);
      desde.setHours(0, 0, 0, 0);
      filtradas = filtradas.filter(r => {
        if (!r.fechaRecoleccion) return false;
        return new Date(r.fechaRecoleccion) >= desde;
      });
    }

    if (this.fechaHasta) {
      const hasta = new Date(this.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      filtradas = filtradas.filter(r => {
        if (!r.fechaRecoleccion) return false;
        return new Date(r.fechaRecoleccion) <= hasta;
      });
    }

    filtradas.sort((a, b) => {
      const fechaA = a.fechaCreacionRecoleccion ? new Date(a.fechaCreacionRecoleccion).getTime() : 0;
      const fechaB = b.fechaCreacionRecoleccion ? new Date(b.fechaCreacionRecoleccion).getTime() : 0;
      return this.ordenFecha === 'desc' ? fechaB - fechaA : fechaA - fechaB;
    });

    return filtradas;
  }

  get recoleccionesPaginadas(): ModeloRecoleccion[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.recoleccionesFiltradas.slice(inicio, inicio + this.itemsPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.recoleccionesFiltradas.length / this.itemsPorPagina);
  }

  cambiarPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaActual = p;
  }

  limpiarFiltros(): void {
    this.estadoSeleccionado = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.ordenFecha = 'desc';
    this.paginaActual = 1;
  }

  // ===============================
  // VISIBILIDAD DE BOTONES SEGÚN ESTADO
  // ===============================
  mostrarBoton(accion: string, estado: EstadoRecoleccion): boolean {
    switch (accion) {
      case 'editar':
        return estado === EstadoRecoleccion.Pendiente;
      case 'cancelar':
        return estado === EstadoRecoleccion.Pendiente;
      case 'completar':
        return estado === EstadoRecoleccion.En_Progreso;
      case 'fallida':
        return estado === EstadoRecoleccion.En_Progreso;
      case 'ver':
        return true;
      default:
        return false;
    }
  }

  // ===============================
  // MODAL VER
  // ===============================
  abrirModalVer(reco: ModeloRecoleccion): void {
    this.recoleccionSeleccionada = reco;
    this.modalVerRecoleccion.isOpen = true;
  }

  cerrarModalVer(): void {
    this.modalVerRecoleccion.isOpen = false;
    this.recoleccionSeleccionada = null;
  }

  // ===============================
  // MODAL EDITAR (solo para Pendiente)
  // ===============================
  abrirModalEdicion(reco: ModeloRecoleccion): void {
    if (reco.estado !== EstadoRecoleccion.Pendiente) {
      alert('Solo puedes editar recolecciones en estado Pendiente.');
      return;
    }
    this.recoleccionSeleccionada = { ...reco };
    this.fechaProgramadaEditable = reco.fechaRecoleccion
      ? new Date(reco.fechaRecoleccion).toISOString().slice(0, 16)
      : '';
    this.observacionesEditable = reco.observaciones || '';
    this.modalEdicion.isOpen = true;
  }

  cerrarModalEdicion(): void {
    this.modalEdicion.isOpen = false;
    this.recoleccionSeleccionada = null;
    this.fechaProgramadaEditable = '';
    this.observacionesEditable = '';
  }

  guardarEdicion(): void {
    if (!this.recoleccionSeleccionada) return;

    const datosActualizar: Partial<ModeloRecoleccion> = {
      observaciones: this.observacionesEditable,
      fechaRecoleccion: this.fechaProgramadaEditable
        ? `${this.fechaProgramadaEditable}:00`
        : undefined,
    };

    this.recoleccionService.actualizarRecoleccion(
      this.recoleccionSeleccionada.idRecoleccion!,
      datosActualizar
    ).subscribe({
      next: actualizado => {
        // Reemplazar en la lista local
        const index = this.recolecciones.findIndex(r => r.idRecoleccion === actualizado.idRecoleccion);
        if (index !== -1) this.recolecciones[index] = actualizado;
        alert('Recolección actualizada correctamente.');
        this.cerrarModalEdicion();
      },
      error: err => {
        console.error('Error al actualizar:', err);
        alert(err.error?.message || 'Error al actualizar la recolección.');
      }
    });
  }

  // ===============================
  // CANCELAR (solo para Pendiente)
  // ===============================
  abrirModalCancelar(reco: ModeloRecoleccion): void {
    if (reco.estado !== EstadoRecoleccion.Pendiente) {
      alert('Solo puedes cancelar recolecciones en estado Pendiente.');
      return;
    }
    this.recoleccionSeleccionada = reco;
    this.modalCancelar.isOpen = true;
  }

  cerrarModalCancelar(): void {
    this.modalCancelar.isOpen = false;
    this.recoleccionSeleccionada = null;
  }

  confirmarCancelar(): void {
    if (!this.recoleccionSeleccionada) return;
    this.recoleccionService.actualizarEstado(
      this.recoleccionSeleccionada.idRecoleccion!,
      EstadoRecoleccion.Cancelada
    ).subscribe({
      next: () => {
        alert('Recolección cancelada correctamente.');
        this.cargarRecolecciones(); // recargar lista
        this.cerrarModalCancelar();
      },
      error: err => {
        console.error('Error al cancelar:', err);
        alert(err.error?.message || 'Error al cancelar la recolección.');
      }
    });
  }

  // ===============================
  // COMPLETAR / FALLIDA (solo para En_Progreso)
  // ===============================
  completarRecoleccion(reco: ModeloRecoleccion): void {
    if (reco.estado !== EstadoRecoleccion.En_Progreso) return;
    if (confirm(`¿Completar la recolección #REC-${reco.idRecoleccion}?`)) {
      this.recoleccionService.actualizarEstado(reco.idRecoleccion!, EstadoRecoleccion.Completada)
        .subscribe({
          next: () => this.cargarRecolecciones(),
          error: err => alert(err.error?.message || 'Error al completar la recolección.')
        });
    }
  }

  marcarFallida(reco: ModeloRecoleccion): void {
    if (reco.estado !== EstadoRecoleccion.En_Progreso) return;
    if (confirm(`¿Marcar como fallida la recolección #REC-${reco.idRecoleccion}?`)) {
      this.recoleccionService.actualizarEstado(reco.idRecoleccion!, EstadoRecoleccion.Fallida)
        .subscribe({
          next: () => this.cargarRecolecciones(),
          error: err => alert(err.error?.message || 'Error al marcar como fallida.')
        });
    }
  }
}
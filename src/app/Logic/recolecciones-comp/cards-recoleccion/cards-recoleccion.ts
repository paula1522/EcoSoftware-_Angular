import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { ModeloRecoleccion, EstadoRecoleccion } from '../../../Models/modelo-recoleccion';
import { Boton } from '../../../shared/botones/boton/boton';
import { Modal } from '../../../shared/modal/modal';
import { FieldConfig, FormComp } from '../../../shared/form/form.comp/form.comp';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-cards-recoleccion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    COMPARTIR_IMPORTS,
    Boton,
    Modal,
    FormComp
  ],
  templateUrl: './cards-recoleccion.html',
  styleUrls: ['./cards-recoleccion.css']
})
export class CardsRecoleccion implements OnInit {
  recolecciones: ModeloRecoleccion[] = [];
  cargando = true;
  error = '';

  // Filtros
  estadoSeleccionado: EstadoRecoleccion | '' = '';
  fechaDesde: string = '';
  fechaHasta: string = '';
  ordenFecha: 'asc' | 'desc' = 'desc';

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 12;

  // Modal de edición
  @ViewChild('modalEditar') modalEditar!: Modal;
  recoleccionSeleccionada: ModeloRecoleccion | null = null;
  formEditarRecoleccion!: FormGroup;
  fieldsEditarRecoleccion: FieldConfig[] = [];
  fechaProgramadaValue: string = '';
  nuevaEvidenciaFile: File | null = null;
  evidenciaActualUrl: string = '';
  previewEvidenciaUrl: string | null = null;

  // Modal de ver
  @ViewChild('modalVer') modalVer!: Modal;
  recoleccionVer: ModeloRecoleccion | null = null;

  // Modal de confirmación (cancelar/completar/fallida)
  modalConfirmacionAbierto = false;
  accionConfirmacion: 'completar' | 'fallida' | 'cancelar' | 'iniciar' | null = null;
  recoleccionAccion: ModeloRecoleccion | null = null;

  EstadoRecoleccion = EstadoRecoleccion;

  constructor(private recoleccionService: RecoleccionService) {}

  ngOnInit(): void {
    this.cargarMisRecolecciones();
  }

  cargarMisRecolecciones(): void {
    this.cargando = true;
    this.recoleccionService.listarMisRecolecciones().subscribe({
      next: (data) => {
        this.recolecciones = data;
        this.cargando = false;
        this.paginaActual = 1;
      },
      error: (err) => {
        console.error('Error al cargar mis recolecciones', err);
        this.error = 'Error al cargar tus recolecciones.';
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
      const fechaA = a.fechaRecoleccion ? new Date(a.fechaRecoleccion).getTime() : 0;
      const fechaB = b.fechaRecoleccion ? new Date(b.fechaRecoleccion).getTime() : 0;
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
  // ACCIONES SOBRE RECOLECCIONES
  // ===============================
  accionVisible(accion: string, estado: EstadoRecoleccion): boolean {
    switch (accion) {
      case 'iniciar':
        return estado === EstadoRecoleccion.Pendiente;
      case 'completar':
        return estado === EstadoRecoleccion.En_Progreso;
      case 'fallida':
        return estado === EstadoRecoleccion.En_Progreso;
      case 'cancelar':
        return estado === EstadoRecoleccion.Pendiente;
      case 'editar':
        // Solo se puede editar si está Pendiente o En_Progreso
        return estado === EstadoRecoleccion.Pendiente || estado === EstadoRecoleccion.En_Progreso;
      case 'ver':
        return true;
      default:
        return false;
    }
  }

  // Modal Ver
  abrirModalVer(reco: ModeloRecoleccion): void {
    this.recoleccionVer = reco;
    this.modalVer.isOpen = true;
  }
  cerrarModalVer(): void {
    this.modalVer.isOpen = false;
    this.recoleccionVer = null;
  }

  // Modal Editar
  abrirModalEditar(reco: ModeloRecoleccion): void {
    if (reco.estado !== EstadoRecoleccion.Pendiente && reco.estado !== EstadoRecoleccion.En_Progreso) {
      alert('Solo puedes editar recolecciones pendientes o en progreso.');
      return;
    }
    this.recoleccionSeleccionada = { ...reco };
    this.evidenciaActualUrl = reco.evidencia || '';
    this.nuevaEvidenciaFile = null;
    this.previewEvidenciaUrl = null;
    this.initFormEditarRecoleccion(reco);
    this.modalEditar.isOpen = true;
  }

  cerrarModalEditar(): void {
    this.modalEditar.isOpen = false;
    this.recoleccionSeleccionada = null;
    this.formEditarRecoleccion?.reset();
    this.nuevaEvidenciaFile = null;
    this.evidenciaActualUrl = '';
    if (this.previewEvidenciaUrl) {
      URL.revokeObjectURL(this.previewEvidenciaUrl);
      this.previewEvidenciaUrl = null;
    }
  }

  initFormEditarRecoleccion(reco: ModeloRecoleccion): void {
    this.fieldsEditarRecoleccion = [
      { type: 'textarea', name: 'observaciones', label: 'Observaciones', cols: 12 },
    ];

    const group: any = {};
    this.fieldsEditarRecoleccion.forEach(f => {
      const fieldName = f.name!;
      const value = (reco as any)[fieldName] ?? '';
      group[fieldName] = new FormControl(value);
    });
    this.formEditarRecoleccion = new FormGroup(group);

    if (reco.fechaRecoleccion) {
      const fecha = new Date(reco.fechaRecoleccion);
      const year = fecha.getFullYear();
      const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const day = fecha.getDate().toString().padStart(2, '0');
      const hours = fecha.getHours().toString().padStart(2, '0');
      const minutes = fecha.getMinutes().toString().padStart(2, '0');
      this.fechaProgramadaValue = `${year}-${month}-${day}T${hours}:${minutes}`;
    } else {
      this.fechaProgramadaValue = '';
    }
  }

  onEvidenciaSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.nuevaEvidenciaFile = file;
      if (this.previewEvidenciaUrl) URL.revokeObjectURL(this.previewEvidenciaUrl);
      this.previewEvidenciaUrl = URL.createObjectURL(file);
    } else {
      alert('Por favor seleccione una imagen válida.');
      this.nuevaEvidenciaFile = null;
      this.previewEvidenciaUrl = null;
    }
  }

  async guardarEdicion(): Promise<void> {
    if (!this.recoleccionSeleccionada) return;

    const formValue = this.formEditarRecoleccion.value;
    let fechaProgramadaBackend = '';
    if (this.fechaProgramadaValue) {
      fechaProgramadaBackend = this.fechaProgramadaValue + ':00';
    }

    const datosActualizados: Partial<ModeloRecoleccion> = {
      observaciones: formValue.observaciones,
      fechaRecoleccion: fechaProgramadaBackend,
    };

    try {
      if (this.nuevaEvidenciaFile) {
        // Nota: el servicio actualmente no tiene método para subir evidencia a recolección.
        // Se puede agregar si es necesario. Por ahora solo actualizamos los otros campos.
        alert('La subida de evidencia aún no está implementada para recolecciones. Se actualizarán solo los demás campos.');
      }

      this.recoleccionService.actualizarRecoleccion(
        this.recoleccionSeleccionada.idRecoleccion!,
        datosActualizados
      ).subscribe({
        next: (actualizada) => {
          alert('Recolección actualizada correctamente.');
          this.cargarMisRecolecciones();
          this.cerrarModalEditar();
        },
        error: (err) => {
          console.error('Error al actualizar', err);
          alert(`Error: ${err.error?.message || err.statusText}`);
        }
      });
    } catch (err) {
      console.error('Error al actualizar', err);
      alert('Error al actualizar la recolección.');
    }
  }

  // Acciones con confirmación
  abrirModalConfirmacion(accion: 'iniciar' | 'completar' | 'fallida' | 'cancelar', reco: ModeloRecoleccion): void {
    this.accionConfirmacion = accion;
    this.recoleccionAccion = reco;
    this.modalConfirmacionAbierto = true;
  }

  cerrarModalConfirmacion(): void {
    this.modalConfirmacionAbierto = false;
    this.accionConfirmacion = null;
    this.recoleccionAccion = null;
  }

  ejecutarAccion(): void {
    if (!this.recoleccionAccion || !this.accionConfirmacion) return;

    const id = this.recoleccionAccion.idRecoleccion!;
    let nuevoEstado: EstadoRecoleccion | null = null;

    switch (this.accionConfirmacion) {
      case 'iniciar':
        nuevoEstado = EstadoRecoleccion.En_Progreso;
        break;
      case 'completar':
        nuevoEstado = EstadoRecoleccion.Completada;
        break;
      case 'fallida':
        nuevoEstado = EstadoRecoleccion.Fallida;
        break;
      case 'cancelar':
        nuevoEstado = EstadoRecoleccion.Cancelada;
        break;
    }

    if (nuevoEstado) {
      this.recoleccionService.actualizarEstado(id, nuevoEstado).subscribe({
        next: () => {
          this.cargarMisRecolecciones();
          this.cerrarModalConfirmacion();
        },
        error: (err) => {
          console.error(`Error al ${this.accionConfirmacion} recolección`, err);
          alert(`Error: ${err.error?.message || err.statusText}`);
        }
      });
    }
  }
}
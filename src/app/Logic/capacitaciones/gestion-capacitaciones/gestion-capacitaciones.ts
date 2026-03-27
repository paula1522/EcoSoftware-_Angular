import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CapacitacionDTO,
  ModuloDTO,
  EvaluacionDTO,
} from '../../../Models/capacitacion.model';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-gestion-capacitaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-capacitaciones.html',
  styleUrl: './gestion-capacitaciones.css',
})
export class GestionCapacitacionesComponent implements OnInit {
  private readonly maxPdfSizeBytes = 20 * 1024 * 1024;

  capacitaciones: CapacitacionDTO[] = [];
  modulos: ModuloDTO[] = [];
  evaluacionesPorModulo: Record<number, EvaluacionDTO[]> = {};

  loading = false;
  error = '';
  success = '';

  selectedCapacitacionId: number | null = null;

  capacitacionForm: CapacitacionDTO = {
    nombre: '',
    descripcion: '',
    numeroDeClases: '',
    duracion: '',
    imagen: null,
  };

  moduloForm: ModuloDTO = {
    descripcion: '',
    duracion: '',
    capacitacionId: 0,
    archivoPdfUrl: null,
  };

  evaluacionForm: EvaluacionDTO = {
    titulo: '',
    descripcion: '',
    puntajeMinimo: 70,
    activa: true,
    moduloId: 0,
  };

  editCapacitacionId: number | null = null;
  editModuloId: number | null = null;
  editEvaluacionId: number | null = null;
  targetModuloIdForEval: number | null = null;

  pdfFilesByModulo: Record<number, File | null> = {};
  pdfUploadingByModulo: Record<number, boolean> = {};
  imagenCapacitacionFile: File | null = null;

  constructor(
    private readonly capacitacionesService: CapacitacionesService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarCapacitaciones();
  }

  cargarCapacitaciones(): void {
    this.loading = true;
    this.error = '';

    this.capacitacionesService.listarTodasCapacitaciones().subscribe({
      next: (data) => {
        this.capacitaciones = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No fue posible cargar las capacitaciones.';
        this.loading = false;
      },
    });
  }

  seleccionarCapacitacion(capacitacion: CapacitacionDTO): void {
    this.selectedCapacitacionId = capacitacion.id ?? null;
    this.moduloForm.capacitacionId = capacitacion.id ?? 0;
    this.modulos = [];
    this.evaluacionesPorModulo = {};

    if (!capacitacion.id) {
      return;
    }

    this.capacitacionesService.listarModulosPorCapacitacion(capacitacion.id).subscribe({
      next: (modulos) => {
        this.modulos = modulos;
        modulos.forEach((m) => {
          if (m.id) {
            this.cargarEvaluacionesPorModulo(m.id);
          }
        });
      },
      error: () => {
        this.error = 'No fue posible cargar los modulos de la capacitacion.';
      },
    });
  }

  guardarCapacitacion(): void {
    this.clearMessages();

    if (!this.authService.isAuthenticated()) {
      this.error = 'Sesion no valida. Inicia sesion nuevamente.';
      return;
    }

    if (!this.isAdminUser()) {
      this.error = 'Tu rol actual no tiene permisos de administrador para crear capacitaciones.';
      return;
    }

    if (!this.capacitacionForm.nombre.trim() || !this.capacitacionForm.descripcion.trim()) {
      this.error = 'Nombre y descripcion son obligatorios.';
      return;
    }

    if (!String(this.capacitacionForm.numeroDeClases || '').trim() || !String(this.capacitacionForm.duracion || '').trim()) {
      this.error = 'Numero de clases y duracion son obligatorios.';
      return;
    }

    if (!/^\d+$/.test(String(this.capacitacionForm.numeroDeClases).trim())) {
      this.error = 'El numero de clases debe ser un valor numerico entero.';
      return;
    }

    const payload: CapacitacionDTO = {
      ...this.capacitacionForm,
      numeroDeClases: String(this.capacitacionForm.numeroDeClases || '').trim(),
      duracion: String(this.capacitacionForm.duracion || '').trim(),
    };

    const request$ = this.editCapacitacionId
      ? this.capacitacionesService.actualizarCapacitacion(this.editCapacitacionId, payload)
      : this.capacitacionesService.crearCapacitacion(payload);

    request$.subscribe({
      next: (capacitacionGuardada) => {
        const mensaje = this.editCapacitacionId
          ? 'Capacitacion actualizada correctamente.'
          : 'Capacitacion creada correctamente.';

        const idCapacitacion = capacitacionGuardada.id ?? this.editCapacitacionId;
        if (this.imagenCapacitacionFile && idCapacitacion) {
          this.capacitacionesService.subirImagenCapacitacion(idCapacitacion, this.imagenCapacitacionFile).subscribe({
            next: () => {
              this.success = `${mensaje} Imagen cargada correctamente.`;
              this.resetCapacitacionForm();
              this.cargarCapacitaciones();
            },
            error: (err) => {
              this.success = `${mensaje} La imagen no se pudo cargar.`;
              this.error = this.getBackendErrorMessage(err, 'Error cargando la imagen de la capacitacion.');
              this.resetCapacitacionForm();
              this.cargarCapacitaciones();
            },
          });
          return;
        }

        this.success = mensaje;
        this.resetCapacitacionForm();
        this.cargarCapacitaciones();
      },
      error: (err) => {
        this.error = this.getBackendErrorMessage(err, 'No fue posible guardar la capacitacion.');
      },
    });
  }

  onCapacitacionImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.imagenCapacitacionFile = file;
  }

  editarCapacitacion(item: CapacitacionDTO): void {
    this.editCapacitacionId = item.id ?? null;
    this.capacitacionForm = {
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion,
      numeroDeClases: item.numeroDeClases,
      duracion: item.duracion,
      imagen: item.imagen ?? null,
    };
  }

  eliminarCapacitacion(item: CapacitacionDTO): void {
    if (!item.id) {
      return;
    }

    const confirmacion = window.confirm(`¿Eliminar la capacitacion ${item.nombre}?`);
    if (!confirmacion) {
      return;
    }

    this.clearMessages();
    this.capacitacionesService.eliminarCapacitacion(item.id).subscribe({
      next: () => {
        this.success = 'Capacitacion eliminada correctamente.';
        if (this.selectedCapacitacionId === item.id) {
          this.selectedCapacitacionId = null;
          this.modulos = [];
          this.evaluacionesPorModulo = {};
        }
        this.cargarCapacitaciones();
      },
      error: (err) => {
        this.error = this.getBackendErrorMessage(err, 'No fue posible eliminar la capacitacion.');
      },
    });
  }

  guardarModulo(): void {
    this.clearMessages();

    if (!this.authService.isAuthenticated()) {
      this.error = 'Sesion no valida. Inicia sesion nuevamente.';
      return;
    }

    if (!this.isAdminUser()) {
      this.error = 'Tu rol actual no tiene permisos de administrador para gestionar modulos.';
      return;
    }

    if (!this.selectedCapacitacionId) {
      this.error = 'Selecciona una capacitacion para crear o editar modulos.';
      return;
    }

    if (!this.moduloForm.descripcion.trim() || !this.moduloForm.duracion.trim()) {
      this.error = 'Descripcion y duracion del modulo son obligatorias.';
      return;
    }

    const payload: ModuloDTO = {
      ...this.moduloForm,
      capacitacionId: this.selectedCapacitacionId,
      archivoPdfUrl: this.moduloForm.archivoPdfUrl ?? null,
    };

    const request$ = this.editModuloId
      ? this.capacitacionesService.actualizarModulo(this.editModuloId, payload)
      : this.capacitacionesService.crearModuloPorCapacitacion(this.selectedCapacitacionId, payload);

    request$.subscribe({
      next: () => {
        this.success = this.editModuloId
          ? 'Modulo actualizado correctamente.'
          : 'Modulo creado correctamente.';
        this.resetModuloForm();
        this.refrescarModulosSeleccionados();
      },
      error: (err) => {
        this.error = this.getBackendErrorMessage(err, 'No fue posible guardar el modulo.');
      },
    });
  }

  editarModulo(item: ModuloDTO): void {
    this.editModuloId = item.id ?? null;
    this.moduloForm = {
      id: item.id,
      descripcion: item.descripcion,
      duracion: item.duracion,
      capacitacionId: item.capacitacionId,
      archivoPdfUrl: item.archivoPdfUrl ?? null,
    };
  }

  eliminarModulo(item: ModuloDTO): void {
    if (!item.id) {
      return;
    }

    const confirmacion = window.confirm('¿Eliminar este modulo y su configuracion?');
    if (!confirmacion) {
      return;
    }

    this.clearMessages();
    this.capacitacionesService.eliminarModulo(item.id).subscribe({
      next: () => {
        this.success = 'Modulo eliminado correctamente.';
        delete this.evaluacionesPorModulo[item.id!];
        this.refrescarModulosSeleccionados();
      },
      error: (err) => {
        this.error = this.getBackendErrorMessage(err, 'No fue posible eliminar el modulo.');
      },
    });
  }

  onPdfSelected(moduloId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      this.error = 'Solo se permiten archivos PDF.';
      input.value = '';
      return;
    }

    if (file.size > this.maxPdfSizeBytes) {
      this.error = 'El PDF supera el tamano maximo permitido (20MB).';
      input.value = '';
      return;
    }

    this.pdfFilesByModulo[moduloId] = file;
  }

  subirPdfModulo(modulo: ModuloDTO): void {
    if (!modulo.id) {
      return;
    }

    const file = this.pdfFilesByModulo[modulo.id];
    if (!file) {
      this.error = 'Selecciona un PDF antes de subirlo.';
      return;
    }

    this.clearMessages();
    this.pdfUploadingByModulo[modulo.id] = true;

    this.capacitacionesService.subirPdfModulo(modulo.id, file).subscribe({
      next: () => {
        this.success = 'PDF del modulo subido correctamente.';
        this.pdfFilesByModulo[modulo.id!] = null;
        this.pdfUploadingByModulo[modulo.id!] = false;
        this.refrescarModulosSeleccionados();
      },
      error: (err) => {
        this.error = this.getBackendErrorMessage(err, 'No fue posible subir el PDF del modulo.');
        this.pdfUploadingByModulo[modulo.id!] = false;
      },
    });
  }

  prepararNuevaEvaluacion(moduloId: number): void {
    this.targetModuloIdForEval = moduloId;
    this.editEvaluacionId = null;
    this.evaluacionForm = {
      titulo: '',
      descripcion: '',
      puntajeMinimo: 70,
      activa: true,
      moduloId,
    };
  }

  editarEvaluacion(item: EvaluacionDTO): void {
    this.targetModuloIdForEval = item.moduloId;
    this.editEvaluacionId = item.id ?? null;
    this.evaluacionForm = {
      id: item.id,
      titulo: item.titulo,
      descripcion: item.descripcion,
      puntajeMinimo: item.puntajeMinimo,
      activa: item.activa,
      moduloId: item.moduloId,
    };
  }

  guardarEvaluacion(): void {
    this.clearMessages();

    if (!this.authService.isAuthenticated()) {
      this.error = 'Sesion no valida. Inicia sesion nuevamente.';
      return;
    }

    if (!this.isAdminUser()) {
      this.error = 'Tu rol actual no tiene permisos de administrador para gestionar evaluaciones.';
      return;
    }

    if (!this.targetModuloIdForEval) {
      this.error = 'Selecciona un modulo para gestionar evaluaciones.';
      return;
    }

    if (!this.evaluacionForm.titulo.trim() || !this.evaluacionForm.descripcion.trim()) {
      this.error = 'Titulo y descripcion de la evaluacion son obligatorios.';
      return;
    }

    if (this.evaluacionForm.puntajeMinimo < 0 || this.evaluacionForm.puntajeMinimo > 100) {
      this.error = 'El puntaje minimo debe estar entre 0 y 100.';
      return;
    }

    const payload: EvaluacionDTO = {
      ...this.evaluacionForm,
      moduloId: this.targetModuloIdForEval,
      puntajeMinimo: Number(this.evaluacionForm.puntajeMinimo),
    };

    const request$ = this.editEvaluacionId
      ? this.capacitacionesService.actualizarEvaluacion(this.editEvaluacionId, payload)
      : this.capacitacionesService.crearEvaluacion(this.targetModuloIdForEval, payload);

    request$.subscribe({
      next: () => {
        this.success = this.editEvaluacionId
          ? 'Evaluacion actualizada correctamente.'
          : 'Evaluacion creada correctamente.';
        this.resetEvaluacionForm();
        this.cargarEvaluacionesPorModulo(this.targetModuloIdForEval!);
      },
      error: (err) => {
        this.error = this.getBackendErrorMessage(err, 'No fue posible guardar la evaluacion.');
      },
    });
  }

  eliminarEvaluacion(item: EvaluacionDTO): void {
    if (!item.id) {
      return;
    }

    const confirmacion = window.confirm('¿Eliminar esta evaluacion?');
    if (!confirmacion) {
      return;
    }

    this.clearMessages();
    this.capacitacionesService.eliminarEvaluacion(item.id).subscribe({
      next: () => {
        this.success = 'Evaluacion eliminada correctamente.';
        this.cargarEvaluacionesPorModulo(item.moduloId);
      },
      error: (err) => {
        this.error = this.getBackendErrorMessage(err, 'No fue posible eliminar la evaluacion.');
      },
    });
  }

  moduloTienePdf(modulo: ModuloDTO): boolean {
    return !!modulo.archivoPdfUrl;
  }

  moduloTieneEvaluaciones(moduloId: number | undefined): boolean {
    if (!moduloId) {
      return false;
    }
    return (this.evaluacionesPorModulo[moduloId] || []).length > 0;
  }

  trackByCapacitacion(_: number, item: CapacitacionDTO): number {
    return item.id ?? 0;
  }

  trackByModulo(_: number, item: ModuloDTO): number {
    return item.id ?? 0;
  }

  trackByEvaluacion(_: number, item: EvaluacionDTO): number {
    return item.id ?? 0;
  }

  private cargarEvaluacionesPorModulo(moduloId: number): void {
    this.capacitacionesService.listarEvaluacionesPorModulo(moduloId).subscribe({
      next: (data) => {
        this.evaluacionesPorModulo[moduloId] = data;
      },
      error: () => {
        this.evaluacionesPorModulo[moduloId] = [];
      },
    });
  }

  private refrescarModulosSeleccionados(): void {
    const id = this.selectedCapacitacionId;
    if (!id) {
      return;
    }

    this.capacitacionesService.listarModulosPorCapacitacion(id).subscribe({
      next: (modulos) => {
        this.modulos = modulos;
        modulos.forEach((m) => {
          if (m.id) {
            this.cargarEvaluacionesPorModulo(m.id);
          }
        });
      },
      error: () => {
        this.error = 'No fue posible actualizar la lista de modulos.';
      },
    });
  }

  private resetCapacitacionForm(): void {
    this.editCapacitacionId = null;
    this.imagenCapacitacionFile = null;
    this.capacitacionForm = {
      nombre: '',
      descripcion: '',
      numeroDeClases: '',
      duracion: '',
      imagen: null,
    };
  }

  private resetModuloForm(): void {
    this.editModuloId = null;
    this.moduloForm = {
      descripcion: '',
      duracion: '',
      capacitacionId: this.selectedCapacitacionId ?? 0,
      archivoPdfUrl: null,
    };
  }

  private resetEvaluacionForm(): void {
    const moduloId = this.targetModuloIdForEval ?? 0;
    this.editEvaluacionId = null;
    this.evaluacionForm = {
      titulo: '',
      descripcion: '',
      puntajeMinimo: 70,
      activa: true,
      moduloId,
    };
  }

  private clearMessages(): void {
    this.error = '';
    this.success = '';
  }

  private getBackendErrorMessage(error: any, fallback: string): string {
    const status = Number(error?.status || 0);
    const backendMessage =
      error?.error?.message ||
      error?.error?.error ||
      (typeof error?.error === 'string' ? error.error : '') ||
      '';

    if (status === 401) {
      return backendMessage || 'Sesion no valida o expirada. Inicia sesion nuevamente.';
    }

    if (status === 403) {
      return backendMessage || 'No tienes permisos para esta accion con tu rol actual.';
    }

    if (status === 400 && backendMessage) {
      return backendMessage;
    }

    if (status >= 500) {
      return backendMessage || 'Ocurrio un error interno del servidor.';
    }

    return backendMessage || fallback;
  }

  private isAdminUser(): boolean {
    const role = (this.authService.getUserRole() || '').toLowerCase();
    return role === 'administrador' || role === 'admin' || role === 'role_admin';
  }
}

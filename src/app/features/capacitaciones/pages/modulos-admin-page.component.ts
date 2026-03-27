import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { CapacitacionDTO } from '../../../Models/capacitacion.model';
import { CapacitacionesModulosApiService } from '../api/capacitaciones-modulos-api.service';
import { ModuloDTO } from '../models/capacitaciones-modulos.models';
import { ModuloFormComponent } from '../components/modulo-form.component';
import { SubirPdfModuloComponent } from '../components/subir-pdf-modulo.component';
import { EvaluacionesModuloAdminComponent } from '../components/evaluaciones-modulo-admin.component';

@Component({
  selector: 'app-modulos-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    ModuloFormComponent,
    SubirPdfModuloComponent,
    EvaluacionesModuloAdminComponent,
  ],
  template: `
    <section class="card shadow-sm border-0 mt-4">
      <div class="card-body">
        <h5 class="mb-3">Módulos o clases por capacitación</h5>

        <div class="mb-3">
          <label class="form-label">Selecciona una capacitación</label>
          <select class="form-select" [value]="selectedCapacitacionId || ''" (change)="onSelectCapacitacion($event)">
            <option value="">-- Seleccione --</option>
            <option *ngFor="let c of capacitaciones" [value]="c.id">{{ c.nombre }}</option>
          </select>
        </div>

        <small class="text-danger" *ngIf="error">{{ error }}</small>

        <app-modulo-form
          *ngIf="selectedCapacitacionId"
          [initialValue]="editingModulo"
          [loading]="saving"
          [titulo]="editingModulo ? 'Editar módulo' : 'Crear módulo'"
          (save)="guardarModulo($event)"
          (cancel)="cancelarEdicion()">
        </app-modulo-form>

        <div class="mt-3" *ngIf="loading">Cargando módulos...</div>

        <div class="mt-3" *ngIf="!loading && selectedCapacitacionId && modulos.length === 0">
          <div class="alert alert-warning py-2">No hay módulos para esta capacitación.</div>
        </div>

        <div class="accordion mt-3" *ngIf="modulos.length > 0">
          <div class="accordion-item" *ngFor="let modulo of modulos; let i = index">
            <h2 class="accordion-header" [id]="'heading-' + modulo.id">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" [attr.data-bs-target]="'#collapse-' + modulo.id">
                <span class="me-2">Módulo {{ i + 1 }}:</span>
                <strong>{{ modulo.descripcion }}</strong>
              </button>
            </h2>

            <div [id]="'collapse-' + modulo.id" class="accordion-collapse collapse">
              <div class="accordion-body">
                <div class="d-flex flex-wrap justify-content-between gap-2 mb-2">
                  <div class="small text-muted">
                    Duración: {{ modulo.duracion }} |
                    Estado PDF: {{ modulo.archivoPdfUrl ? 'PDF cargado' : 'PDF pendiente' }}
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary btn-sm" (click)="editarModulo(modulo)">Editar</button>
                    <button class="btn btn-outline-danger btn-sm" (click)="eliminarModulo(modulo)">Eliminar</button>
                  </div>
                </div>

                <app-subir-pdf-modulo
                  [moduloId]="modulo.id || null"
                  [currentUrl]="modulo.archivoPdfUrl"
                  [maxSizeMb]="20"
                  (pdfSubido)="onPdfSubido(modulo, $event)">
                </app-subir-pdf-modulo>

                <app-evaluaciones-modulo-admin [moduloId]="modulo.id || null"></app-evaluaciones-modulo-admin>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class ModulosAdminPageComponent implements OnInit {
  capacitaciones: CapacitacionDTO[] = [];
  selectedCapacitacionId: number | null = null;

  modulos: ModuloDTO[] = [];
  loading = false;
  saving = false;
  error = '';

  editingModulo: ModuloDTO | null = null;

  constructor(
    private readonly capacitacionesService: CapacitacionesService,
    private readonly api: CapacitacionesModulosApiService
  ) {}

  ngOnInit(): void {
    this.capacitacionesService.listarTodasCapacitaciones().subscribe({
      next: (data) => (this.capacitaciones = data),
      error: () => (this.error = 'No se pudo cargar la lista de capacitaciones.'),
    });
  }

  onSelectCapacitacion(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const id = Number(target.value);

    this.selectedCapacitacionId = Number.isNaN(id) || id <= 0 ? null : id;
    this.editingModulo = null;

    if (this.selectedCapacitacionId) {
      this.cargarModulos();
    } else {
      this.modulos = [];
    }
  }

  cargarModulos(): void {
    if (!this.selectedCapacitacionId) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.api.listarModulosPorCapacitacion(this.selectedCapacitacionId).subscribe({
      next: (data) => {
        this.modulos = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar los módulos.';
        this.loading = false;
      },
    });
  }

  guardarModulo(modulo: ModuloDTO): void {
    if (!this.selectedCapacitacionId) {
      return;
    }

    this.saving = true;
    this.error = '';

    const payload: ModuloDTO = {
      descripcion: modulo.descripcion,
      duracion: modulo.duracion,
      capacitacionId: this.selectedCapacitacionId,
      archivoPdfUrl: modulo.archivoPdfUrl ?? null,
    };

    const request$ = this.editingModulo?.id
      ? this.api.actualizarModulo(this.editingModulo.id, { ...payload, id: this.editingModulo.id })
      : this.api.crearModuloPorCapacitacion(this.selectedCapacitacionId, payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.editingModulo = null;
        this.cargarModulos();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'No se pudo guardar el módulo.';
      },
    });
  }

  editarModulo(modulo: ModuloDTO): void {
    this.editingModulo = { ...modulo };
  }

  cancelarEdicion(): void {
    this.editingModulo = null;
  }

  eliminarModulo(modulo: ModuloDTO): void {
    if (!modulo.id) {
      return;
    }

    if (!window.confirm('¿Eliminar este módulo?')) {
      return;
    }

    this.api.eliminarModulo(modulo.id).subscribe({
      next: () => this.cargarModulos(),
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo eliminar el módulo.';
      },
    });
  }

  onPdfSubido(modulo: ModuloDTO, url: string): void {
    this.modulos = this.modulos.map((m) => (m.id === modulo.id ? { ...m, archivoPdfUrl: url } : m));
  }
}

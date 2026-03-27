import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { CapacitacionDTO } from '../../../Models/capacitacion.model';
import { CapacitacionesModulosApiService } from '../api/capacitaciones-modulos-api.service';
import { ModuloDTO } from '../models/capacitaciones-modulos.models';
import { ModuloFormComponent } from '../components/modulo-form.component';
import { SubirPdfModuloComponent } from '../components/subir-pdf-modulo.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-modulos-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    ModuloFormComponent,
    SubirPdfModuloComponent,
  ],
  template: `
    <section class="mod-admin-shell">

      <div class="card shadow-sm border-0 mt-3 mod-admin-content">
        <div class="card-body">
          <h5 class="mb-3">Módulos por capacitación</h5>

          <div class="mb-3" *ngIf="!lockCapacitacion">
            <label class="form-label">Selecciona una capacitación</label>
            <select class="form-select form-select-lg" [value]="selectedCapacitacionId || ''" (change)="onSelectCapacitacion($event)">
              <option value="">-- Seleccione --</option>
              <option *ngFor="let c of capacitaciones" [value]="c.id">{{ c.nombre }}</option>
            </select>
          </div>

          <div class="alert alert-success py-2" *ngIf="lockCapacitacion && selectedCapacitacionId">
            Capacitación seleccionada automáticamente para gestionar módulos y evaluaciones.
          </div>

          <small class="text-danger" *ngIf="error">{{ error }}</small>

          <app-modulo-form
            *ngIf="selectedCapacitacionId"
            [initialValue]="editingModulo"
            [resetToken]="formResetToken"
            [loading]="saving"
            [titulo]="editingModulo ? 'Editar módulo' : 'Crear módulo'"
            (save)="guardarModulo($event)"
            (cancel)="cancelarEdicion()">
          </app-modulo-form>

          <div class="mt-3" *ngIf="loading">Cargando módulos...</div>

          <div class="mt-3" *ngIf="!loading && selectedCapacitacionId && modulos.length === 0">
            <div class="alert alert-warning py-2">No hay módulos para esta capacitación.</div>
            <div class="small text-muted">Después de crear el primer módulo, aquí aparecerá la opción para subir su PDF.</div>
          </div>

          <div class="accordion mt-3" *ngIf="modulos.length > 0">
            <div class="accordion-item" *ngFor="let modulo of modulos; let i = index">
              <h2 class="accordion-header" [id]="'heading-' + modulo.id">
                <button class="accordion-button" type="button" disabled>
                  <span class="me-2">Módulo {{ i + 1 }}:</span>
                  <strong>{{ modulo.descripcion }}</strong>
                </button>
              </h2>

              <div [id]="'collapse-' + modulo.id" class="accordion-collapse show">
                <div class="accordion-body">
                  <div class="d-flex flex-wrap justify-content-between gap-2 mb-2">
                    <div class="small text-muted">
                      Duración: {{ modulo.duracion }} |
                      Estado PDF: {{ modulo.archivoPdfUrl ? 'PDF cargado' : 'PDF pendiente' }} |
                      Evaluación: {{ modulo.evaluacion?.preguntas?.length || 0 }} pregunta(s)
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .mod-admin-shell {
        max-width: 1200px;
        margin: 1rem auto;
        padding: 0 0.5rem 1rem;
      }

      .mod-admin-hero {
        background: linear-gradient(125deg, #f8fffb 0%, #edf7f0 52%, #ecf5ff 100%);
        border: 1px solid #dbece0;
      }

      .mod-admin-content {
        border: 1px solid #deeadf;
      }

      .mod-admin-eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        color: #2b7a42;
        font-size: 0.76rem;
      }
    `,
  ],
})
export class ModulosAdminPageComponent implements OnInit, OnChanges {
  @Input() preselectedCapacitacionId: number | null = null;

  capacitaciones: CapacitacionDTO[] = [];
  selectedCapacitacionId: number | null = null;
  lockCapacitacion = false;

  modulos: ModuloDTO[] = [];
  loading = false;
  saving = false;
  error = '';

  editingModulo: ModuloDTO | null = null;
  formResetToken = 0;

  constructor(
    private readonly capacitacionesService: CapacitacionesService,
    private readonly api: CapacitacionesModulosApiService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.capacitacionesService.listarTodasCapacitaciones().subscribe({
      next: (data) => {
        this.capacitaciones = data;

        const preselectFromInput = Number(this.preselectedCapacitacionId);
        const preselectFromQuery = Number(this.route.snapshot.queryParamMap.get('capacitacionId'));

        this.lockCapacitacion = !Number.isNaN(preselectFromQuery) && preselectFromQuery > 0;

        const preselectId = !Number.isNaN(preselectFromInput) && preselectFromInput > 0
          ? preselectFromInput
          : preselectFromQuery;

        if (!Number.isNaN(preselectId) && preselectId > 0) {
          this.selectedCapacitacionId = preselectId;
          this.cargarModulos();
        }
      },
      error: () => (this.error = 'No se pudo cargar la lista de capacitaciones.'),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preselectedCapacitacionId']) {
      const nextId = Number(this.preselectedCapacitacionId);
      if (!Number.isNaN(nextId) && nextId > 0 && this.selectedCapacitacionId !== nextId) {
        this.selectedCapacitacionId = nextId;
        this.cargarModulos();
      }
    }
  }

  onSelectCapacitacion(event: Event): void {
    if (this.lockCapacitacion) {
      return;
    }

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

  guardarModulo(event: { modulo: ModuloDTO; pdfFile: File | null }): void {
    if (!this.selectedCapacitacionId) {
      return;
    }

    this.saving = true;
    this.error = '';

    const modulo = event.modulo;
    const pdfFile = event.pdfFile;

    const payload: ModuloDTO = {
      descripcion: modulo.descripcion,
      duracion: modulo.duracion,
      capacitacionId: this.selectedCapacitacionId,
      archivoPdfUrl: modulo.archivoPdfUrl ?? null,
      evaluacion: modulo.evaluacion ?? null,
    };

    const request$ = this.editingModulo?.id
      ? this.api.actualizarModulo(this.editingModulo.id, { ...payload, id: this.editingModulo.id })
      : this.api.crearModuloPorCapacitacion(this.selectedCapacitacionId, payload);

    request$.subscribe({
      next: (savedModulo) => {
        const moduloId = savedModulo?.id;

        if (pdfFile && moduloId) {
          this.api.subirPdfModulo(moduloId, pdfFile).subscribe({
            next: () => {
              this.saving = false;
              this.editingModulo = null;
              this.formResetToken += 1;
              this.cargarModulos();
            },
            error: (err) => {
              this.saving = false;
              this.error = err?.error?.message || 'El módulo se creó, pero no se pudo subir el PDF.';
              this.editingModulo = null;
              this.formResetToken += 1;
              this.cargarModulos();
            },
          });
          return;
        }

        this.saving = false;
        this.editingModulo = null;
        this.formResetToken += 1;
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

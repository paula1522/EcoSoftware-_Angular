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

      <header class="card border-0 shadow-sm mod-admin-hero">
        <div class="card-body mod-admin-hero__body">
          <div class="mod-admin-hero__main">
            <p class="mod-admin-eyebrow">Panel de contenidos</p>
            <h3>{{ getCapacitacionNombre() }}</h3>
            <p class="mod-admin-hero__copy">Organiza los módulos, mantén el material PDF actualizado y deja las evaluaciones listas desde un panel más claro y enfocado en esta capacitación.</p>
          </div>

          <div class="mod-admin-stats" *ngIf="selectedCapacitacionId">
            <article class="mod-admin-stat-card mod-admin-stat-card--emerald">
              <span class="mod-admin-stat-card__icon"><i class="bi bi-collection-play"></i></span>
              <div class="mod-admin-stat-card__content">
                <span>Total de módulos</span>
                <strong>{{ modulos.length }}</strong>
              </div>
            </article>
            <article class="mod-admin-stat-card mod-admin-stat-card--mint">
              <span class="mod-admin-stat-card__icon"><i class="bi bi-file-earmark-pdf"></i></span>
              <div class="mod-admin-stat-card__content">
                <span>PDFs publicados</span>
                <strong>{{ countPdfCargados() }}</strong>
              </div>
            </article>
            <article class="mod-admin-stat-card mod-admin-stat-card--sky">
              <span class="mod-admin-stat-card__icon"><i class="bi bi-patch-check"></i></span>
              <div class="mod-admin-stat-card__content">
                <span>Módulos con evaluación</span>
                <strong>{{ countEvaluaciones() }}</strong>
              </div>
            </article>
          </div>
        </div>
      </header>

      <section class="card border-0 shadow-sm mod-admin-content">
        <div class="card-body mod-admin-content__body">
          <div class="mod-admin-toolbar">
            <div>
              <h5>Módulos por capacitación</h5>
              <p>{{ selectedCapacitacionId ? 'Estás gestionando ' + getCapacitacionNombre() + '.' : 'Cargando la capacitación seleccionada...' }}</p>
            </div>
          </div>

          <div class="alert alert-danger py-2" *ngIf="error">{{ error }}</div>

          <section class="mod-admin-form-wrap" *ngIf="selectedCapacitacionId">
            <div class="mod-admin-form-wrap__head">
              <div>
                <h6>{{ editingModulo ? 'Editar módulo existente' : 'Crear nuevo módulo' }}</h6>
                <p>{{ editingModulo ? 'Actualiza contenido, PDF y evaluación sin salir del panel.' : 'Crea un módulo con una estructura clara y una evaluación lista para publicar.' }}</p>
              </div>
            </div>

            <app-modulo-form
              [initialValue]="editingModulo"
              [resetToken]="formResetToken"
              [loading]="saving"
              [titulo]="editingModulo ? 'Editar módulo' : 'Crear módulo'"
              (save)="guardarModulo($event)"
              (cancel)="cancelarEdicion()">
            </app-modulo-form>
          </section>

          <div class="mod-admin-loading" *ngIf="loading">Cargando módulos...</div>

          <div class="mod-admin-empty" *ngIf="!loading && selectedCapacitacionId && modulos.length === 0">
            <strong>No hay módulos para esta capacitación.</strong>
            <span>Después de crear el primero, aquí verás cada módulo con su PDF y su evaluación correspondiente.</span>
          </div>

          <div class="module-admin-selector" *ngIf="modulos.length > 0">
            <button
              type="button"
              class="module-admin-selector__button"
              *ngFor="let modulo of modulos; let i = index; trackBy: trackByModulo"
              [class.module-admin-selector__button--active]="isModuloAbierto(modulo)"
              (click)="toggleModuloAbierto(modulo)">
              <span class="module-admin-selector__index">Módulo {{ i + 1 }}</span>
              <strong>{{ modulo.descripcion }}</strong>
            </button>
          </div>

          <article class="module-admin-card" *ngIf="moduloAbierto as moduloActivo">
            <div class="module-admin-card__head">
              <div>
                <span class="module-admin-card__index">Módulo activo</span>
                <h6>{{ moduloActivo.descripcion }}</h6>
              </div>

              <div class="module-admin-card__actions">
                <button class="btn btn-outline-primary btn-sm" (click)="editarModulo(moduloActivo)">Editar</button>
                <button class="btn btn-outline-danger btn-sm" (click)="eliminarModulo(moduloActivo)">Eliminar</button>
              </div>
            </div>

            <div class="module-admin-card__chips">
              <span>Duración: {{ moduloActivo.duracion }}</span>
              <span>{{ moduloActivo.archivoPdfUrl ? 'PDF cargado' : 'PDF pendiente' }}</span>
              <span>{{ moduloActivo.evaluacion?.preguntas?.length || 0 }} pregunta(s)</span>
            </div>

            <p class="module-admin-card__copy">
              {{ moduloActivo.evaluacion?.preguntas?.length ? 'La evaluación ya está configurada y lista para ser respondida por el usuario.' : 'Aún puedes enriquecer este módulo agregando una evaluación de opción múltiple.' }}
            </p>

            <app-subir-pdf-modulo
              [moduloId]="moduloActivo.id || null"
              [currentUrl]="moduloActivo.archivoPdfUrl"
              [maxSizeMb]="20"
              (pdfSubido)="onPdfSubido(moduloActivo, $event)">
            </app-subir-pdf-modulo>
          </article>
        </div>
      </section>
    </section>
  `,
  styles: [
    `
      .mod-admin-shell {
        max-width: 1200px;
        margin: 1rem auto;
        padding: 0 0.75rem 2rem;
        display: grid;
        gap: 1.25rem;
      }

      .mod-admin-hero {
        background:
          radial-gradient(circle at top right, rgba(123, 197, 146, 0.28), transparent 24%),
          radial-gradient(circle at bottom left, rgba(131, 197, 255, 0.18), transparent 22%),
          linear-gradient(128deg, #fbfffc 0%, #f1fbf5 52%, #eef6ff 100%);
        border: 1px solid #dbece0;
        border-radius: 36px;
        overflow: hidden;
      }

      .mod-admin-content {
        border: 1px solid #deeadf;
        border-radius: 32px;
      }

      .mod-admin-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.45rem 0.8rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid rgba(179, 222, 191, 0.9);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 800;
        color: #2b7a42;
        font-size: 0.76rem;
        width: fit-content;
      }

      .mod-admin-hero__body,
      .mod-admin-content__body {
        display: grid;
        gap: 1.25rem;
        padding: 1.4rem;
      }

      .mod-admin-hero__body {
        grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
        align-items: start;
        gap: 1.2rem;
      }

      .mod-admin-hero__main {
        display: grid;
        gap: 0.75rem;
        max-width: 780px;
      }

      .mod-admin-hero h3,
      .mod-admin-toolbar h5,
      .mod-admin-form-wrap__head h6,
      .module-admin-card__head h6 {
        margin: 0;
        color: #163927;
      }

      .mod-admin-hero h3 {
        font-size: clamp(1.8rem, 1.4rem + 0.9vw, 2.6rem);
        line-height: 1.06;
        max-width: 18ch;
      }

      .mod-admin-hero__copy,
      .mod-admin-toolbar p,
      .mod-admin-form-wrap__head p,
      .module-admin-card__copy {
        margin: 0;
        color: #617a6d;
        line-height: 1.55;
        max-width: 70ch;
      }

      .mod-admin-stats {
        display: grid;
        gap: 0.85rem;
        align-self: stretch;
      }

      .mod-admin-stat-card {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 0.9rem;
        padding: 1rem 1.05rem;
        border-radius: 26px;
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid #dbe7df;
        box-shadow: 0 14px 30px rgba(22, 58, 39, 0.07);
        position: relative;
        overflow: hidden;
      }

      .mod-admin-stat-card::after {
        content: '';
        position: absolute;
        inset: auto -18px -18px auto;
        width: 88px;
        height: 88px;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(18, 70, 45, 0.08) 0%, rgba(18, 70, 45, 0) 72%);
      }

      .mod-admin-stat-card__icon {
        width: 58px;
        height: 58px;
        border-radius: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;
        color: #17462d;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
      }

      .mod-admin-stat-card__content {
        position: relative;
        z-index: 1;
        text-align: left;
      }

      .mod-admin-stat-card--emerald .mod-admin-stat-card__icon {
        background: linear-gradient(135deg, #dbf6e2 0%, #bfeccb 100%);
      }

      .mod-admin-stat-card--mint .mod-admin-stat-card__icon {
        background: linear-gradient(135deg, #e1f8ff 0%, #cbefe7 100%);
      }

      .mod-admin-stat-card--sky .mod-admin-stat-card__icon {
        background: linear-gradient(135deg, #ebf1ff 0%, #d8e5ff 100%);
      }

      .mod-admin-stats span,
      .module-admin-card__index {
        display: block;
        font-size: 0.82rem;
        color: #6a8376;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 800;
      }

      .mod-admin-stats strong {
        display: block;
        margin-top: 0.2rem;
        font-size: 1.95rem;
        color: #173928;
        line-height: 1;
      }

      .mod-admin-toolbar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }

      .mod-admin-form-wrap {
        display: grid;
        gap: 1rem;
      }

      .mod-admin-form-wrap__head {
        padding: 1.1rem 1.2rem;
        border-radius: 24px;
        border: 1px solid #dfeadf;
        background: linear-gradient(180deg, #f9fcfa 0%, #f4f8f5 100%);
      }

      .mod-admin-loading,
      .mod-admin-empty {
        padding: 1.1rem 1.2rem;
        border-radius: 24px;
        border: 1px dashed #c9d8cd;
        background: #fbfdfb;
        color: #61796c;
      }

      .mod-admin-empty strong,
      .mod-admin-empty span {
        display: block;
      }

      .module-admin-selector {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .module-admin-selector__button {
        display: grid;
        gap: 0.2rem;
        min-width: 210px;
        padding: 0.9rem 1rem;
        border: 1px solid #d8e5dd;
        border-radius: 20px;
        background: #fff;
        text-align: left;
        color: #183a27;
        transition: 0.2s ease;
      }

      .module-admin-selector__button strong {
        font-size: 0.95rem;
      }

      .module-admin-selector__index {
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 800;
        color: #6a8376;
      }

      .module-admin-selector__button--active {
        border-color: #7ab18a;
        background: #eef8f1;
        box-shadow: 0 14px 28px rgba(25, 90, 51, 0.08);
      }

      .module-admin-card {
        display: grid;
        gap: 1rem;
        padding: 1.2rem;
        border-radius: 28px;
        border: 1px solid #dce8e0;
        background: #ffffff;
        box-shadow: 0 18px 34px rgba(17, 49, 31, 0.06);
      }

      .module-admin-card__head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }

      .module-admin-card__actions,
      .module-admin-card__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }

      .module-admin-card__chips span {
        padding: 0.55rem 0.85rem;
        border-radius: 999px;
        background: #f0f6f2;
        color: #2a5640;
        font-size: 0.84rem;
        font-weight: 700;
      }

      @media (max-width: 991px) {
        .mod-admin-hero__body {
          grid-template-columns: 1fr;
        }

        .mod-admin-hero h3 {
          max-width: none;
        }

        .mod-admin-stats {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 767px) {
        .mod-admin-shell {
          padding: 0 0.5rem 1.5rem;
        }

        .mod-admin-hero__body,
        .mod-admin-content__body {
          padding: 1rem;
        }

        .mod-admin-toolbar,
        .module-admin-card__head {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class ModulosAdminPageComponent implements OnInit, OnChanges {
  @Input() preselectedCapacitacionId: number | null = null;

  capacitaciones: CapacitacionDTO[] = [];
  selectedCapacitacionId: number | null = null;

  modulos: ModuloDTO[] = [];
  moduloAbierto: ModuloDTO | null = null;
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
    this.selectedCapacitacionId = this.resolveSelectedCapacitacionId();

    if (!this.selectedCapacitacionId) {
      this.error = 'No se recibió una capacitación para gestionar sus módulos.';
      return;
    }

    this.cargarModulos();

    this.capacitacionesService.listarTodasCapacitaciones().subscribe({
      next: (data) => {
        this.capacitaciones = data;
      },
      error: () => (this.error = 'No se pudo cargar la lista de capacitaciones.'),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preselectedCapacitacionId']) {
      const nextId = this.resolveSelectedCapacitacionId();
      if (nextId && this.selectedCapacitacionId !== nextId) {
        this.selectedCapacitacionId = nextId;
        this.error = '';
        this.cargarModulos();
      }
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
        this.syncModuloAbierto(data);
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
    this.syncModuloAbierto(this.modulos);
  }

  getCapacitacionNombre(): string {
    return this.capacitaciones.find((item) => item.id === this.selectedCapacitacionId)?.nombre || 'la capacitación seleccionada';
  }

  countPdfCargados(): number {
    return this.modulos.filter((modulo) => !!String(modulo.archivoPdfUrl || '').trim()).length;
  }

  countEvaluaciones(): number {
    return this.modulos.filter((modulo) => (modulo.evaluacion?.preguntas?.length || 0) > 0).length;
  }

  toggleModuloAbierto(modulo: ModuloDTO): void {
    this.moduloAbierto = this.isModuloAbierto(modulo) ? null : modulo;
  }

  isModuloAbierto(modulo: ModuloDTO): boolean {
    return !!this.moduloAbierto && this.moduloAbierto.id === modulo.id;
  }

  private resolveSelectedCapacitacionId(): number | null {
    const preselectFromInput = Number(this.preselectedCapacitacionId);
    if (!Number.isNaN(preselectFromInput) && preselectFromInput > 0) {
      return preselectFromInput;
    }

    const preselectFromQuery = Number(this.route.snapshot.queryParamMap.get('capacitacionId'));
    if (!Number.isNaN(preselectFromQuery) && preselectFromQuery > 0) {
      return preselectFromQuery;
    }

    return null;
  }

  trackByModulo(_: number, modulo: ModuloDTO): number | string {
    return modulo.id || modulo.descripcion;
  }

  private syncModuloAbierto(modulos: ModuloDTO[]): void {
    if (!modulos.length) {
      this.moduloAbierto = null;
      return;
    }

    if (!this.moduloAbierto?.id) {
      this.moduloAbierto = modulos[0];
      return;
    }

    this.moduloAbierto = modulos.find((modulo) => modulo.id === this.moduloAbierto?.id) || modulos[0];
  }
}

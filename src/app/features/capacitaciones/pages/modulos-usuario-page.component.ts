import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { CapacitacionDTO } from '../../../Models/capacitacion.model';
import { CapacitacionesModulosApiService } from '../api/capacitaciones-modulos-api.service';
import { ModuloDTO, ProgresoDTO } from '../models/capacitaciones-modulos.models';
import { EvaluacionesModuloUsuarioComponent } from '../components/evaluaciones-modulo-usuario.component';
import { ProgresoCursoComponent } from '../components/progreso-curso.component';

@Component({
  selector: 'app-modulos-usuario-page',
  standalone: true,
  imports: [CommonModule, EvaluacionesModuloUsuarioComponent, ProgresoCursoComponent],
  template: `
    <section>
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body">
          <h5 class="mb-3">Mis capacitaciones</h5>

          <small class="text-danger" *ngIf="error">{{ error }}</small>

          <div class="list-group" *ngIf="cursos.length > 0">
            <button
              type="button"
              class="list-group-item list-group-item-action"
              [class.active]="cursoSeleccionadoId === curso.id"
              *ngFor="let curso of cursos"
              (click)="seleccionarCurso(curso)">
              <div class="d-flex justify-content-between">
                <strong>{{ curso.nombre }}</strong>
                <span>{{ curso.duracion }}</span>
              </div>
              <small>{{ curso.descripcion }}</small>
            </button>
          </div>

          <div class="alert alert-warning py-2" *ngIf="!loadingCursos && cursos.length === 0">
            No tienes capacitaciones inscritas.
          </div>
        </div>
      </div>

      <app-progreso-curso [progreso]="progresoCurso"></app-progreso-curso>

      <div class="accordion mt-3" *ngIf="modulos.length > 0">
        <div class="accordion-item" *ngFor="let modulo of modulos; let i = index">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" [attr.data-bs-target]="'#mod-' + modulo.id">
              <span class="me-2">Módulo {{ i + 1 }}:</span>
              <strong>{{ modulo.descripcion }}</strong>
            </button>
          </h2>

          <div class="accordion-collapse collapse" [id]="'mod-' + modulo.id">
            <div class="accordion-body">
              <div class="small text-muted mb-2">Duración: {{ modulo.duracion }}</div>

              <div class="mb-3">
                <button class="btn btn-outline-primary btn-sm" (click)="abrirPdf(modulo.archivoPdfUrl)">
                  Previsualizar PDF
                </button>
                <button class="btn btn-outline-secondary btn-sm ms-2" (click)="descargarPdf(modulo.archivoPdfUrl)">
                  Descargar PDF
                </button>
                <span class="ms-2 badge" [class.bg-success]="modulo.archivoPdfUrl" [class.bg-warning]="!modulo.archivoPdfUrl">
                  {{ modulo.archivoPdfUrl ? 'PDF disponible' : 'Sin PDF' }}
                </span>
              </div>

              <app-evaluaciones-modulo-usuario
                [moduloId]="modulo.id || null"
                [usuarioId]="usuarioId"
                (intentoRegistrado)="actualizarProgreso()">
              </app-evaluaciones-modulo-usuario>
            </div>
          </div>
        </div>
      </div>

      <div class="alert alert-warning py-2" *ngIf="cursoSeleccionadoId && modulos.length === 0 && !loadingModulos">
        Esta capacitación no tiene módulos publicados.
      </div>
    </section>
  `,
})
export class ModulosUsuarioPageComponent implements OnInit {
  usuarioId: number | null = null;

  cursos: CapacitacionDTO[] = [];
  cursoSeleccionadoId: number | null = null;

  modulos: ModuloDTO[] = [];
  progresoCurso: ProgresoDTO | null = null;

  loadingCursos = false;
  loadingModulos = false;
  error = '';

  constructor(
    private readonly authService: AuthService,
    private readonly capacitacionesService: CapacitacionesService,
    private readonly api: CapacitacionesModulosApiService
  ) {}

  ngOnInit(): void {
    this.usuarioId = this.authService.getUserId();
    this.cargarCursosInscritos();
  }

  cargarCursosInscritos(): void {
    if (!this.usuarioId) {
      this.error = 'No se encontró sesión activa.';
      return;
    }

    this.loadingCursos = true;
    this.error = '';

    this.capacitacionesService.obtenerMisCapacitaciones(this.usuarioId).subscribe({
      next: (data) => {
        this.cursos = data;
        this.loadingCursos = false;
        if (data.length > 0) {
          this.seleccionarCurso(data[0]);
        }
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar tus capacitaciones.';
        this.loadingCursos = false;
      },
    });
  }

  seleccionarCurso(curso: CapacitacionDTO): void {
    this.cursoSeleccionadoId = curso.id ?? null;
    this.modulos = [];
    this.progresoCurso = null;

    if (!this.cursoSeleccionadoId) {
      return;
    }

    this.cargarModulosCurso(this.cursoSeleccionadoId);
    this.actualizarProgreso();
  }

  cargarModulosCurso(cursoId: number): void {
    this.loadingModulos = true;
    this.api.listarModulosPorCapacitacion(cursoId).subscribe({
      next: (data) => {
        this.modulos = data.map((m) => ({
          ...m,
          archivoPdfUrl: this.normalizePdfUrl(m.archivoPdfUrl),
        }));
        this.loadingModulos = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar los módulos.';
        this.loadingModulos = false;
      },
    });
  }

  actualizarProgreso(): void {
    if (!this.usuarioId || !this.cursoSeleccionadoId) {
      return;
    }

    this.api.obtenerProgresoUsuarioPorCurso(this.usuarioId, this.cursoSeleccionadoId).subscribe({
      next: (progreso) => (this.progresoCurso = progreso),
      error: () => (this.progresoCurso = null),
    });
  }

  abrirPdf(url: string | null | undefined): void {
    if (!url) {
      this.error = 'Este módulo aún no tiene PDF.';
      return;
    }

    const originalUrl = this.normalizePdfUrl(url);
    if (!originalUrl) {
      this.error = 'No se recibió una URL válida para el PDF.';
      return;
    }

    const viewerUrl = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(originalUrl)}`;

    const win = window.open(viewerUrl, '_blank', 'noopener');
    if (!win) {
      this.error = 'No se pudo abrir la previsualización del PDF. Revisa si el navegador bloqueó la ventana emergente.';
    }
  }

  descargarPdf(url: string | null | undefined): void {
    if (!url) {
      this.error = 'Este módulo aún no tiene PDF para descargar.';
      return;
    }

    const normalizedUrl = this.normalizePdfUrl(url);
    if (!normalizedUrl) {
      this.error = 'No se recibió una URL válida para el PDF.';
      return;
    }

    const link = document.createElement('a');
    link.href = normalizedUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }

  private normalizePdfUrl(url: string | null | undefined): string | null {
    const raw = String(url || '').trim();
    if (!raw) {
      return null;
    }

    if (!raw.includes('res.cloudinary.com')) {
      return raw;
    }

    if (raw.includes('/image/upload/')) {
      return raw.replace('/image/upload/', '/raw/upload/');
    }

    return raw;
  }
}

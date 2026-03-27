import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { CapacitacionDTO } from '../../../Models/capacitacion.model';
import { CapacitacionesModulosApiService } from '../api/capacitaciones-modulos-api.service';
import { ModuloDTO } from '../models/capacitaciones-modulos.models';

@Component({
  selector: 'app-modulos-usuario-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="modulos-page">
      <header class="hero card border-0 shadow-sm mb-3">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <h4 class="mb-0">Módulos de mi capacitación</h4>
            <button type="button" class="btn btn-outline-success btn-sm" (click)="volverAMisCapacitaciones()">
              Volver a la lista de capacitaciones inscritas
            </button>
          </div>
          <p class="mb-0 text-muted">Explora cada módulo, revisa el material PDF y completa las evaluaciones para avanzar en tu ruta formativa.</p>
        </div>
      </header>

      <div class="alert alert-danger py-2" *ngIf="error">{{ error }}</div>

      <div class="card border-0 shadow-sm mb-3" *ngIf="cursoSeleccionado">
        <div class="card-body">
          <div class="d-flex flex-wrap align-items-center gap-3">
            <img
              [src]="cursoSeleccionado.imagen || 'assets/default-capacitacion.jpg'"
              [alt]="cursoSeleccionado.nombre"
              class="curso-cover"
            />
            <div class="flex-grow-1">
              <h5 class="mb-1">{{ cursoSeleccionado.nombre }}</h5>
              <p class="text-muted mb-0">{{ cursoSeleccionado.descripcion || 'Capacitación inscrita en tu ruta de aprendizaje.' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm mb-3" *ngIf="cursoSeleccionadoId">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <strong>Progreso</strong>
            <small>{{ formulariosCompletados100 }} / {{ totalFormularios }}</small>
          </div>
          <div class="progress" style="height: 10px;">
            <div
              class="progress-bar bg-success"
              role="progressbar"
              [style.width.%]="porcentajeProgresoFormularios"
              [attr.aria-valuenow]="porcentajeProgresoFormularios"
              aria-valuemin="0"
              aria-valuemax="100">
            </div>
          </div>
          <small class="text-muted mt-2 d-inline-block">{{ porcentajeProgresoFormularios }}% completado</small>
        </div>
      </div>

      <div class="alert alert-info py-2" *ngIf="loadingCursos || loadingModulos">
        Cargando información...
      </div>

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

              <div class="mt-2" *ngIf="modulo.evaluacion as ev">
                <h6 class="mb-2">{{ ev.titulo }}</h6>

                <div class="border rounded p-2 mb-2" *ngFor="let p of ev.preguntas; let pi = index">
                  <div class="small fw-semibold mb-2">{{ pi + 1 }}. {{ p.texto }}</div>

                  <div class="form-check mb-1" *ngFor="let opcion of p.opciones; let oi = index">
                    <input
                      class="form-check-input"
                      type="radio"
                      [name]="'mod-' + (modulo.id || 0) + '-preg-' + pi"
                      [checked]="seleccionesPorModulo[modulo.id || 0]?.[pi] === opcion"
                      [disabled]="estaModuloCompletado100(modulo)"
                      (change)="seleccionarOpcionModulo(modulo.id || 0, pi, opcion)"
                    />
                    <label class="form-check-label small">{{ opcion }}</label>
                  </div>
                </div>

                <button class="btn btn-success btn-sm" [disabled]="estaModuloCompletado100(modulo)" (click)="calificarModulo(modulo)">
                  Enviar evaluación
                </button>

                <div class="small mt-2" *ngIf="resultadoPorModulo[modulo.id || 0] as r">
                  Resultado: {{ r.puntaje }}% ({{ r.correctas }}/{{ r.total }})
                </div>

                <div class="small mt-1 text-success" *ngIf="estaModuloCompletado100(modulo)">
                  Formulario completado al 100%.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="alert alert-warning py-2" *ngIf="!loadingCursos && cursos.length === 0">
        No tienes capacitaciones inscritas.
      </div>

      <div class="alert alert-warning py-2" *ngIf="cursoSeleccionadoId && modulos.length === 0 && !loadingModulos && !loadingCursos">
        Esta capacitación no tiene módulos publicados.
      </div>
    </section>
  `,
  styles: [
    `
      .modulos-page .hero h4 {
        color: #14532d;
      }

      .modulos-page .hero {
        border-radius: 16px;
        background: linear-gradient(120deg, #ffffff 0%, #f4fbf6 58%, #edf8f1 100%);
      }

      .modulos-page .curso-cover {
        width: 108px;
        height: 74px;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid #d7e9dc;
      }
    `,
  ],
})
export class ModulosUsuarioPageComponent implements OnInit {
  @Input() capacitacionIdInput: number | null = null;
  @Input() modoEmbebido = false;
  @Output() volverListaCards = new EventEmitter<void>();

  usuarioId: number | null = null;

  cursos: CapacitacionDTO[] = [];
  cursoSeleccionado: CapacitacionDTO | null = null;
  cursoSeleccionadoId: number | null = null;
  capacitacionIdInicial: number | null = null;

  modulos: ModuloDTO[] = [];

  loadingCursos = false;
  loadingModulos = false;
  error = '';
  seleccionesPorModulo: Record<number, Record<number, string>> = {};
  resultadoPorModulo: Record<number, { puntaje: number; correctas: number; total: number }> = {};
  formulariosCompletados100 = 0;
  totalFormularios = 0;
  porcentajeProgresoFormularios = 0;

  constructor(
    private readonly location: Location,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly capacitacionesService: CapacitacionesService,
    private readonly api: CapacitacionesModulosApiService
  ) {}

  ngOnInit(): void {
    const cursoIdFromRoute = Number(this.route.snapshot.queryParamMap.get('capacitacionId'));
    const cursoId = this.capacitacionIdInput ?? (Number.isFinite(cursoIdFromRoute) && cursoIdFromRoute > 0 ? cursoIdFromRoute : null);
    this.capacitacionIdInicial = cursoId;

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
          const cursoInicial = this.capacitacionIdInicial
            ? data.find((c) => c.id === this.capacitacionIdInicial) || data[0]
            : data[0];
          this.seleccionarCurso(cursoInicial);
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
    this.cursoSeleccionado = curso;
    this.modulos = [];

    if (!this.cursoSeleccionadoId) {
      return;
    }

    this.cargarModulosCurso(this.cursoSeleccionadoId);
  }

  volverAMisCapacitaciones(): void {
    if (this.modoEmbebido) {
      this.volverListaCards.emit();
      return;
    }

    this.location.back();
  }

  cargarModulosCurso(cursoId: number): void {
    this.loadingModulos = true;
    this.api.listarModulosPorCapacitacion(cursoId).subscribe({
      next: (data) => {
        this.modulos = data;
        this.recalcularProgresoFormularios();
        this.loadingModulos = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar los módulos.';
        this.loadingModulos = false;
      },
    });
  }

  abrirPdf(url: string | null | undefined): void {
    if (!url) {
      this.error = 'Este módulo aún no tiene PDF.';
      return;
    }

    const originalUrl = String(url || '').trim();
    if (!originalUrl) {
      this.error = 'No se recibió una URL válida para el PDF.';
      return;
    }

    const viewerUrl = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(originalUrl)}`;

    const win = window.open(viewerUrl, '_blank', 'noopener');
    if (!win) {
      window.location.href = viewerUrl;
    }
  }

  descargarPdf(url: string | null | undefined): void {
    if (!url) {
      this.error = 'Este módulo aún no tiene PDF para descargar.';
      return;
    }

    const exactUrl = String(url || '').trim();
    if (!exactUrl) {
      this.error = 'No se recibió una URL válida para el PDF.';
      return;
    }

    const link = document.createElement('a');
    link.href = exactUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }

  seleccionarOpcionModulo(moduloId: number, preguntaIndex: number, opcion: string): void {
    const modulo = this.modulos.find((m) => m.id === moduloId);
    if (modulo && this.estaModuloCompletado100(modulo)) {
      return;
    }

    const actual = this.seleccionesPorModulo[moduloId] || {};
    this.seleccionesPorModulo[moduloId] = {
      ...actual,
      [preguntaIndex]: opcion,
    };
  }

  calificarModulo(modulo: ModuloDTO): void {
    const ev = modulo.evaluacion;
    if (!this.usuarioId || !modulo.id || !ev || !Array.isArray(ev.preguntas) || ev.preguntas.length === 0) {
      this.error = 'Este módulo no tiene evaluación disponible.';
      return;
    }

    if (this.estaModuloCompletado100(modulo)) {
      this.error = 'Este formulario ya fue completado al 100% y se encuentra bloqueado.';
      return;
    }

    const respuestas = this.seleccionesPorModulo[modulo.id] || {};
    const total = ev.preguntas.length;

    for (let i = 0; i < total; i += 1) {
      if (!respuestas[i]) {
        this.error = 'Debes responder todas las preguntas antes de enviar.';
        return;
      }
    }

    let correctas = 0;
    for (let i = 0; i < total; i += 1) {
      if (respuestas[i] === ev.preguntas[i].respuestaCorrecta) {
        correctas += 1;
      }
    }

    const puntaje = Math.round((correctas / total) * 100);
    this.resultadoPorModulo[modulo.id] = { puntaje, correctas, total };
    this.error = '';

    const userIdKey = String(this.usuarioId);
    const progresoUsuarios = {
      ...(ev.progresoUsuarios || {}),
      [userIdKey]: {
        puntaje,
        completado100: puntaje === 100,
        ultimaActualizacion: new Date().toISOString(),
      },
    };

    const moduloActualizado: ModuloDTO = {
      ...modulo,
      evaluacion: {
        ...ev,
        progresoUsuarios,
      },
    };

    this.api.actualizarModulo(modulo.id, moduloActualizado).subscribe({
      next: (saved) => {
        this.modulos = this.modulos.map((m) => (m.id === modulo.id ? { ...m, ...saved, evaluacion: saved.evaluacion || moduloActualizado.evaluacion } : m));
        this.recalcularProgresoFormularios();
      },
      error: () => {
        this.error = 'No se pudo guardar el progreso de la evaluación en la base de datos.';
      },
    });
  }

  estaModuloCompletado100(modulo: ModuloDTO): boolean {
    if (!this.usuarioId) {
      return false;
    }

    const progress = modulo.evaluacion?.progresoUsuarios?.[String(this.usuarioId)];
    return !!progress?.completado100;
  }

  private recalcularProgresoFormularios(): void {
    if (!this.usuarioId) {
      this.totalFormularios = 0;
      this.formulariosCompletados100 = 0;
      this.porcentajeProgresoFormularios = 0;
      return;
    }

    const evaluables = this.modulos.filter((m) => !!m.evaluacion && Array.isArray(m.evaluacion?.preguntas) && (m.evaluacion?.preguntas?.length || 0) > 0);
    const completos = evaluables.filter((m) => m.evaluacion?.progresoUsuarios?.[String(this.usuarioId)]?.completado100).length;

    this.totalFormularios = evaluables.length;
    this.formulariosCompletados100 = completos;
    this.porcentajeProgresoFormularios = this.totalFormularios > 0 ? Math.round((completos / this.totalFormularios) * 100) : 0;
  }
}

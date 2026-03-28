import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
    <section class="modulos-page" [class.modulos-page--embedded]="modoEmbebido">
      <div class="page-toolbar">
        <button
          type="button"
          class="page-back-button"
          (click)="volverAMisCapacitaciones()"
          title="Volver a mis capacitaciones"
          aria-label="Volver a mis capacitaciones">
          <i class="bi bi-arrow-left"></i>
        </button>
      </div>

      <div class="alert alert-danger py-2" *ngIf="error">{{ error }}</div>

      <section class="course-overview" *ngIf="cursoSeleccionado">
        <div class="course-overview__main card border-0 shadow-sm">
          <div class="card-body course-overview__body">
            <div class="course-overview__media-wrap">
              <img
                [src]="cursoSeleccionado.imagen || 'assets/default-capacitacion.jpg'"
                [alt]="cursoSeleccionado.nombre"
                class="curso-cover"
              />
              <span class="course-overview__floating-badge">Capacitación activa</span>
            </div>

            <div class="course-overview__text">
              <span class="course-overview__label">Ruta formativa en curso</span>
              <h4>{{ cursoSeleccionado.nombre }}</h4>
              <p>{{ cursoSeleccionado.descripcion || 'Capacitación inscrita en tu ruta de aprendizaje.' }}</p>

              <div class="course-overview__stats">
                <div class="course-overview__stat">
                  <strong>{{ modulos.length }}</strong>
                  <span>Módulos</span>
                </div>
                <div class="course-overview__stat">
                  <strong>{{ totalFormularios }}</strong>
                  <span>Evaluaciones</span>
                </div>
                <div class="course-overview__stat">
                  <strong>{{ formulariosCompletados100 }}</strong>
                  <span>Completadas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="course-progress card border-0 shadow-sm" *ngIf="cursoSeleccionadoId">
          <div class="card-body course-progress__body">
            <div class="course-progress__ring-wrap">
              <svg viewBox="0 0 140 140" class="course-progress__ring" aria-hidden="true">
                <circle class="course-progress__ring-track" cx="70" cy="70" r="54"></circle>
                <circle class="course-progress__ring-fill" cx="70" cy="70" r="54" [style.stroke-dashoffset]="getProgresoCircunferenciaOffset()"></circle>
              </svg>
              <div class="course-progress__ring-center">
                <strong>{{ porcentajeProgresoFormularios }}%</strong>
              </div>
            </div>

            <div class="course-progress__summary">
              <strong>Progreso en evaluaciones</strong>
              <span>Avance general: {{ porcentajeProgresoFormularios }}%</span>
              <p>{{ formulariosCompletados100 }} de {{ totalFormularios }} completadas</p>
            </div>

            <div class="course-progress__status">
              <span>Estado del curso</span>
              <strong>{{ porcentajeProgresoFormularios === 100 ? 'Completado' : 'En progreso' }}</strong>
            </div>
          </div>
        </div>
      </section>

      <div class="modulos-loading" *ngIf="loadingCursos || loadingModulos">
        Cargando información...
      </div>

      <div class="module-selector" *ngIf="modulos.length > 0">
        <button
          type="button"
          class="module-selector__button"
          *ngFor="let modulo of modulos; let i = index"
          [class.module-selector__button--active]="isModuloAbierto(modulo)"
          (click)="toggleModuloDetalle(modulo)">
          <span class="module-selector__index">Módulo {{ i + 1 }}</span>
          <strong>{{ modulo.descripcion }}</strong>
        </button>
      </div>

      <article class="module-card" *ngIf="moduloAbierto as modulo">
        <div class="module-card__head">
          <div>
            <span class="module-card__index">Módulo activo</span>
            <h5>{{ modulo.descripcion }}</h5>
            <p>{{ modulo.duracion }}</p>
          </div>

          <span class="module-card__status" [class.module-card__status--done]="estaModuloCompletado100(modulo)" [class.module-card__status--warn]="!modulo.archivoPdfUrl">
            {{ getEstadoModulo(modulo) }}
          </span>
        </div>

        <div class="module-card__actions">
          <button class="btn btn-outline-primary" type="button" (click)="togglePdfPreview(modulo.id || 0, modulo.archivoPdfUrl)">
            {{ isPreviewOpen(modulo.id || 0) ? 'Ocultar PDF' : 'Previsualizar PDF' }}
          </button>
          <button class="btn btn-outline-secondary" type="button" (click)="descargarPdf(modulo.archivoPdfUrl)">
            Descargar PDF
          </button>
        </div>

        <div class="module-card__preview" *ngIf="isPreviewOpen(modulo.id || 0) && getPdfPreviewUrl(modulo.archivoPdfUrl) as safePreviewUrl">
          <div class="module-card__preview-head">
            <div>
              <strong>Material del módulo</strong>
              <span>Previsualización embebida del PDF</span>
            </div>
          </div>
          <iframe [src]="safePreviewUrl" [title]="'PDF del módulo ' + (getModuloIndice(modulo) + 1)"></iframe>
        </div>

        <div class="module-card__no-pdf" *ngIf="isPreviewOpen(modulo.id || 0) && !modulo.archivoPdfUrl">
          Este módulo aún no tiene un PDF publicado.
        </div>

        <section class="evaluation-panel" *ngIf="modulo.evaluacion as ev; else moduloSinEvaluacion">
          <div class="evaluation-panel__head">
            <div>
              <span class="evaluation-panel__label">Evaluación</span>
              <h6>{{ ev.titulo }}</h6>
            </div>

            <div class="evaluation-panel__score" *ngIf="getPuntajeModulo(modulo) !== null">
              {{ getPuntajeModulo(modulo) }}%
            </div>
          </div>

          <div class="evaluation-panel__approved" *ngIf="estaModuloCompletado100(modulo)">
            <i class="bi bi-patch-check-fill"></i>
            <div>
              <strong>Evaluación aprobada</strong>
              <span>Ya alcanzaste el 100%. Esta evaluación quedó bloqueada y no puede volver a responderse.</span>
            </div>
          </div>

          <div class="question-block" *ngFor="let p of ev.preguntas; let pi = index">
            <div class="question-block__title">{{ pi + 1 }}. {{ p.texto }}</div>

            <label
              class="option-pill"
              *ngFor="let opcion of p.opciones; let oi = index"
              [class.option-pill--selected]="seleccionesPorModulo[modulo.id || 0]?.[pi] === opcion"
              [class.option-pill--disabled]="estaModuloCompletado100(modulo)">
              <input
                type="radio"
                [name]="'mod-' + (modulo.id || 0) + '-preg-' + pi"
                [checked]="seleccionesPorModulo[modulo.id || 0]?.[pi] === opcion"
                [disabled]="estaModuloCompletado100(modulo)"
                (change)="seleccionarOpcionModulo(modulo.id || 0, pi, opcion)"
              />
              <span class="option-pill__index">{{ oi + 1 }}</span>
              <span class="option-pill__text">{{ opcion }}</span>
            </label>
          </div>

          <div class="evaluation-panel__footer">
            <button class="btn btn-success" [disabled]="estaModuloCompletado100(modulo)" (click)="calificarModulo(modulo)">
              {{ estaModuloCompletado100(modulo) ? 'Evaluación aprobada' : 'Enviar evaluación' }}
            </button>

            <div class="evaluation-panel__result" *ngIf="resultadoPorModulo[modulo.id || 0] as r">
              Resultado: {{ r.puntaje }}% ({{ r.correctas }}/{{ r.total }})
            </div>

            <div class="evaluation-panel__result evaluation-panel__result--success" *ngIf="estaModuloCompletado100(modulo)">
              Ya fue aprobada con 100% y quedó bloqueada.
            </div>
          </div>
        </section>

        <ng-template #moduloSinEvaluacion>
          <div class="evaluation-panel evaluation-panel--empty">
            Este módulo aún no tiene evaluación publicada.
          </div>
        </ng-template>
      </article>

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
      .modulos-page {
        display: grid;
        gap: 1rem;
      }

      .modulos-page--embedded {
        margin-top: -5.3rem;
      }

      .page-toolbar {
        display: flex;
        justify-content: flex-start;
        position: relative;
        z-index: 4;
      }

      .page-back-button {
        width: 48px;
        height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #d7e6dc;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.96);
        color: #1c653a;
        box-shadow: 0 14px 26px rgba(18, 67, 37, 0.08);
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      }

      .page-back-button:hover {
        transform: translateY(-1px);
        border-color: #8dca9c;
        box-shadow: 0 18px 32px rgba(18, 67, 37, 0.12);
      }

      .page-back-button i {
        font-size: 1.15rem;
      }

      .module-card {
        border-radius: 28px;
      }

      .course-overview__label,
      .evaluation-panel__label,
      .module-card__index {
        display: inline-block;
        margin-bottom: 0.35rem;
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-weight: 800;
        color: #2c7744;
      }

      .course-overview__text h4,
      .module-card h5,
      .evaluation-panel h6 {
        margin: 0;
        color: #163927;
      }

      .course-overview__text p,
      .module-card p,
      .module-card__preview-head span {
        margin: 0.45rem 0 0;
        color: #60796c;
        line-height: 1.55;
      }

      .course-overview {
        display: grid;
        grid-template-columns: minmax(0, 1.7fr) minmax(290px, 0.95fr);
        gap: 0.9rem;
      }

      .course-overview__body {
        display: flex;
        gap: 1rem;
        align-items: stretch;
      }

      .course-overview__main,
      .course-progress {
        border-radius: 28px;
      }

      .course-overview__media-wrap {
        position: relative;
        width: min(38%, 250px);
        min-width: 220px;
        flex-shrink: 0;
      }

      .curso-cover {
        width: 100%;
        height: 100%;
        min-height: 220px;
        object-fit: cover;
        border-radius: 24px;
        border: 1px solid #d7e9dc;
      }

      .course-overview__floating-badge {
        position: absolute;
        left: 16px;
        bottom: 16px;
        padding: 0.5rem 0.85rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.92);
        color: #19653a;
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .course-overview__text {
        display: grid;
        gap: 0.9rem;
        flex: 1;
        min-width: 0;
      }

      .course-overview__stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .course-overview__stat {
        padding: 0.9rem 0.95rem;
        border-radius: 20px;
        background: #f5faf6;
        border: 1px solid #dbe9e0;
      }

      .course-overview__stat strong {
        display: block;
        color: #18452c;
        font-size: 1.05rem;
      }

      .course-overview__stat span {
        color: #5f786b;
        font-size: 0.84rem;
      }

      .course-progress__body {
        display: grid;
        gap: 0.85rem;
        justify-items: center;
        height: 100%;
        align-content: center;
      }

      .course-progress__ring-wrap {
        position: relative;
        width: 142px;
        height: 142px;
      }

      .course-progress__ring {
        width: 142px;
        height: 142px;
        transform: rotate(-90deg);
      }

      .course-progress__ring-track,
      .course-progress__ring-fill {
        fill: none;
        stroke-width: 12;
      }

      .course-progress__ring-track {
        stroke: #e5efe8;
      }

      .course-progress__ring-fill {
        stroke: url(#progressGradient);
        stroke: #2f8d50;
        stroke-linecap: round;
        stroke-dasharray: 339.292;
        transition: stroke-dashoffset 0.35s ease;
      }

      .course-progress__ring-center {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        text-align: center;
      }

      .course-progress__ring-center strong {
        display: block;
        color: #143826;
        font-size: 1.7rem;
        line-height: 1;
      }

      .course-progress__summary {
        display: grid;
        gap: 0.2rem;
        text-align: center;
      }

      .course-progress__summary strong {
        color: #163927;
      }

      .course-progress__summary span {
        color: #60796c;
        font-size: 0.92rem;
        font-weight: 700;
      }

      .course-progress__summary p {
        margin: 0;
        color: #698276;
        font-size: 0.84rem;
      }

      .course-progress__status {
        width: 100%;
        padding: 0.95rem 1rem;
        border-radius: 18px;
        background: #f5faf6;
        border: 1px solid #dde9e1;
        text-align: center;
      }

      .course-progress__status span {
        display: block;
        color: #698276;
        font-size: 0.78rem;
        margin-bottom: 0.2rem;
      }

      .course-progress__status strong {
        color: #18452c;
        font-size: 1rem;
      }

      .modulos-loading,
      .module-card__no-pdf,
      .evaluation-panel--empty {
        padding: 1rem 1.1rem;
        border-radius: 22px;
        border: 1px dashed #c9d8cd;
        background: #fbfdfb;
        color: #5f786a;
      }

      .module-selector {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .module-selector__button {
        display: grid;
        gap: 0.2rem;
        min-width: 210px;
        padding: 0.9rem 1rem;
        border: 1px solid #d8e4dc;
        border-radius: 20px;
        background: #ffffff;
        text-align: left;
        color: #163927;
        transition: 0.2s ease;
      }

      .module-selector__index {
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 800;
        color: #6a8376;
      }

      .module-selector__button--active {
        border-color: #79b48a;
        background: #eef8f1;
        box-shadow: 0 12px 24px rgba(53, 121, 71, 0.08);
      }

      .module-card {
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
        border: 1px solid #dce9e0;
        background: #ffffff;
        box-shadow: 0 18px 36px rgba(21, 51, 33, 0.06);
      }

      .module-card__head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
      }

      .module-card__status {
        padding: 0.55rem 0.9rem;
        border-radius: 999px;
        background: #e9f4ec;
        color: #1b663d;
        font-weight: 700;
        font-size: 0.84rem;
      }

      .module-card__status--done {
        background: #d9efe0;
      }

      .module-card__status--warn {
        background: #f8e1d5;
        color: #924a22;
      }

      .module-card__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .module-card__preview {
        overflow: hidden;
        border-radius: 24px;
        border: 1px solid #dbe7df;
      }

      .module-card__preview-head {
        padding: 0.95rem 1rem;
        background: #f4f8f5;
        border-bottom: 1px solid #dfeae3;
      }

      .module-card iframe {
        width: 100%;
        min-height: 420px;
        border: 0;
        background: #f4f6f5;
      }

      .evaluation-panel {
        display: grid;
        gap: 1rem;
        padding: 1.1rem;
        border-radius: 24px;
        border: 1px solid #dde8e0;
        background: linear-gradient(180deg, #fafdfb 0%, #f4f8f5 100%);
      }

      .evaluation-panel__head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }

      .evaluation-panel__score {
        min-width: 72px;
        padding: 0.8rem 0.95rem;
        border-radius: 20px;
        background: #ffffff;
        border: 1px solid #d7e4dc;
        text-align: center;
        font-weight: 800;
        color: #1d5d39;
      }

      .evaluation-panel__approved {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.85rem;
        align-items: start;
        padding: 0.95rem 1rem;
        border-radius: 20px;
        background: linear-gradient(180deg, #ebf8ef 0%, #e1f4e7 100%);
        border: 1px solid #b9dfc5;
      }

      .evaluation-panel__approved i {
        font-size: 1.25rem;
        color: #1d6a3d;
        margin-top: 0.1rem;
      }

      .evaluation-panel__approved strong,
      .evaluation-panel__approved span {
        display: block;
      }

      .evaluation-panel__approved strong {
        color: #15492b;
      }

      .evaluation-panel__approved span {
        color: #4f6e5d;
        margin-top: 0.15rem;
        line-height: 1.45;
      }

      .question-block {
        display: grid;
        gap: 0.75rem;
      }

      .question-block__title {
        font-weight: 700;
        color: #183a27;
      }

      .option-pill {
        display: grid;
        grid-template-columns: auto auto 1fr;
        gap: 0.75rem;
        align-items: center;
        padding: 0.9rem 1rem;
        border-radius: 18px;
        border: 1px solid #d8e4dc;
        background: #ffffff;
        cursor: pointer;
        transition: 0.2s ease;
      }

      .option-pill__index {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: #edf5f0;
        color: #245e3c;
        font-weight: 800;
      }

      .option-pill--selected {
        border-color: #79b48a;
        background: #eef8f1;
        box-shadow: 0 10px 20px rgba(53, 121, 71, 0.08);
      }

      .option-pill--disabled {
        cursor: default;
        opacity: 0.82;
        pointer-events: none;
        background: #f3f7f4;
      }

      .evaluation-panel__footer {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }

      .evaluation-panel__result {
        padding: 0.75rem 0.95rem;
        border-radius: 18px;
        background: #ffffff;
        border: 1px solid #dae7df;
      }

      .evaluation-panel__result--success {
        color: #165f3a;
        font-weight: 700;
      }

      @media (max-width: 991px) {
        .course-overview {
          grid-template-columns: 1fr;
        }

        .course-overview__body {
          flex-direction: column;
        }

        .course-overview__media-wrap {
          width: 100%;
          min-width: 0;
        }

        .course-overview__stats {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 767px) {
        .modulos-page--embedded {
          margin-top: -4.7rem;
        }

        .module-card__head,
        .evaluation-panel__head {
          flex-direction: column;
          align-items: stretch;
        }

        .option-pill {
          grid-template-columns: auto 1fr;
        }

        .option-pill input {
          grid-row: 1 / span 2;
        }

        .module-card iframe {
          min-height: 300px;
        }

        .course-overview__stats,
        .course-progress__status {
          width: 100%;
        }

        .course-overview__stats {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ModulosUsuarioPageComponent implements OnInit {
  private readonly progressCircumference = 2 * Math.PI * 54;
  @Input() capacitacionIdInput: number | null = null;
  @Input() modoEmbebido = false;
  @Output() volverListaCards = new EventEmitter<void>();

  usuarioId: number | null = null;

  cursos: CapacitacionDTO[] = [];
  cursoSeleccionado: CapacitacionDTO | null = null;
  cursoSeleccionadoId: number | null = null;
  capacitacionIdInicial: number | null = null;

  modulos: ModuloDTO[] = [];
  moduloAbierto: ModuloDTO | null = null;

  loadingCursos = false;
  loadingModulos = false;
  error = '';
  seleccionesPorModulo: Record<number, Record<number, string>> = {};
  resultadoPorModulo: Record<number, { puntaje: number; correctas: number; total: number }> = {};
  formulariosCompletados100 = 0;
  totalFormularios = 0;
  porcentajeProgresoFormularios = 0;
  previewModuloId: number | null = null;

  private readonly pdfPreviewCache: Record<string, SafeResourceUrl> = {};

  constructor(
    private readonly location: Location,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly capacitacionesService: CapacitacionesService,
    private readonly api: CapacitacionesModulosApiService,
    private readonly sanitizer: DomSanitizer
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
        this.syncModuloAbierto(data);
        this.recalcularProgresoFormularios();
        this.loadingModulos = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar los módulos.';
        this.loadingModulos = false;
      },
    });
  }

  togglePdfPreview(moduloId: number, url: string | null | undefined): void {
    if (this.previewModuloId === moduloId) {
      this.previewModuloId = null;
      return;
    }

    if (!url || !String(url).trim()) {
      this.error = 'Este módulo aún no tiene PDF.';
      this.previewModuloId = moduloId;
      return;
    }

    this.error = '';
    this.previewModuloId = moduloId;
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

    this.error = '';

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
      this.error = 'Esta evaluación ya fue aprobada al 100% y quedó bloqueada.';
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

  isPreviewOpen(moduloId: number): boolean {
    return this.previewModuloId === moduloId;
  }

  toggleModuloDetalle(modulo: ModuloDTO): void {
    this.moduloAbierto = this.isModuloAbierto(modulo) ? null : modulo;
    if (this.moduloAbierto?.id !== this.previewModuloId) {
      this.previewModuloId = null;
    }
  }

  isModuloAbierto(modulo: ModuloDTO): boolean {
    return !!this.moduloAbierto && this.moduloAbierto.id === modulo.id;
  }

  getModuloIndice(modulo: ModuloDTO): number {
    return this.modulos.findIndex((item) => item.id === modulo.id);
  }

  getPdfPreviewUrl(url: string | null | undefined): SafeResourceUrl | null {
    const exactUrl = String(url || '').trim();

    if (!exactUrl) {
      return null;
    }

    if (!this.pdfPreviewCache[exactUrl]) {
      const viewerUrl = this.buildEmbeddedPdfUrl(exactUrl);
      this.pdfPreviewCache[exactUrl] = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
    }

    return this.pdfPreviewCache[exactUrl];
  }

  private buildEmbeddedPdfUrl(url: string): string {
    const hasFragment = url.includes('#');
    const viewerParams = 'toolbar=0&navpanes=0&scrollbar=1';
    return `${url}${hasFragment ? '&' : '#'}${viewerParams}`;
  }

  getEstadoModulo(modulo: ModuloDTO): string {
    if (this.estaModuloCompletado100(modulo)) {
      return 'Evaluación aprobada';
    }

    if (!modulo.archivoPdfUrl) {
      return 'PDF pendiente';
    }

    if ((modulo.evaluacion?.preguntas?.length || 0) > 0) {
      return 'Listo para estudiar';
    }

    return 'Sin evaluación';
  }

  getPuntajeModulo(modulo: ModuloDTO): number | null {
    const moduloId = modulo.id || 0;
    if (this.resultadoPorModulo[moduloId]) {
      return this.resultadoPorModulo[moduloId].puntaje;
    }

    if (!this.usuarioId) {
      return null;
    }

    return modulo.evaluacion?.progresoUsuarios?.[String(this.usuarioId)]?.puntaje ?? null;
  }

  getProgresoCircunferenciaOffset(): number {
    const clamped = Math.max(0, Math.min(100, this.porcentajeProgresoFormularios));
    return this.progressCircumference - (clamped / 100) * this.progressCircumference;
  }

  private syncModuloAbierto(modulos: ModuloDTO[]): void {
    if (!modulos.length) {
      this.moduloAbierto = null;
      this.previewModuloId = null;
      return;
    }

    if (!this.moduloAbierto?.id) {
      this.moduloAbierto = modulos[0];
      return;
    }

    this.moduloAbierto = modulos.find((modulo) => modulo.id === this.moduloAbierto?.id) || modulos[0];
  }
}

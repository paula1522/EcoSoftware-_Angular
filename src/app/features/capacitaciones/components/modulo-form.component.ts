import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModuloDTO, ModuloPreguntaDTO } from '../models/capacitaciones-modulos.models';

@Component({
  selector: 'app-modulo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="module-form card border-0 shadow-sm">
      <div class="card-body module-form__body">
        <header class="module-form__header">
          <div>
            <p class="module-form__eyebrow">Gestión de módulos</p>
            <h5>{{ titulo }}</h5>
            <p>Organiza el contenido, define la evaluación y revisa el PDF antes de publicar el módulo.</p>
          </div>

          <div class="module-form__summary">
            <span>{{ preguntas.length }} pregunta(s)</span>
            <span>{{ selectedPdfFile ? '1 PDF pendiente' : initialValue?.archivoPdfUrl ? 'PDF publicado' : 'Sin PDF' }}</span>
          </div>
        </header>

        <div class="row g-4">
          <div class="col-12 col-xl-7">
            <section class="module-form__panel">
              <div class="module-form__panel-head">
                <div>
                  <h6>Información del módulo</h6>
                  <p>Define un título descriptivo, la duración estimada y la evaluación del contenido.</p>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Descripción del módulo</label>
                <textarea formControlName="descripcion" class="form-control form-control-lg" rows="3" placeholder="Ej: Separación de residuos orgánicos en casa"></textarea>
                <small class="text-danger" *ngIf="form.controls['descripcion'].touched && form.controls['descripcion'].invalid">
                  La descripción es obligatoria.
                </small>
              </div>

              <div class="mb-0">
                <label class="form-label">Duración estimada</label>
                <input formControlName="duracion" class="form-control form-control-lg" placeholder="Ej: 2 horas" />
                <small class="text-danger" *ngIf="form.controls['duracion'].touched && form.controls['duracion'].invalid">
                  La duración es obligatoria.
                </small>
              </div>
            </section>

            <section class="module-form__panel module-form__panel--soft">
              <div class="module-form__panel-head">
                <div>
                  <h6>Evaluación del módulo</h6>
                  <p>Construye una experiencia de evaluación clara, con opciones cómodas y una respuesta correcta por pregunta.</p>
                </div>

                <button type="button" class="btn btn-success btn-sm" (click)="agregarPregunta()">Agregar pregunta</button>
              </div>

              <div class="mb-3">
                <label class="form-label">Título de la evaluación</label>
                <input
                  class="form-control form-control-lg"
                  [(ngModel)]="evaluacionTitulo"
                  [ngModelOptions]="{ standalone: true }"
                  placeholder="Ej: Evaluación final del módulo 1"
                />
              </div>

              <div class="module-form__empty" *ngIf="preguntas.length === 0">
                <strong>Aún no agregas preguntas.</strong>
                <span>Cuando agregues la primera pregunta aparecerá aquí con su bloque de opciones y selección de respuesta correcta.</span>
              </div>

              <div class="question-card" *ngFor="let pregunta of preguntas; let pi = index; trackBy: trackByPregunta">
                <div class="question-card__head">
                  <div>
                    <span class="question-card__counter">Pregunta {{ pi + 1 }}</span>
                    <strong>Respuesta de opción múltiple</strong>
                  </div>

                  <button type="button" class="btn btn-outline-danger btn-sm" (click)="eliminarPregunta(pi)">Eliminar</button>
                </div>

                <label class="form-label small">Texto de la pregunta</label>
                <input
                  class="form-control form-control-lg question-card__prompt"
                  [(ngModel)]="pregunta.texto"
                  [ngModelOptions]="{ standalone: true }"
                  placeholder="Ej: ¿Cuál residuo debe ir en el contenedor verde?"
                />

                <div class="question-card__options-head">
                  <span>Opciones disponibles</span>
                  <span>Marca la correcta con el selector circular</span>
                </div>

                <div class="option-row" *ngFor="let opcion of pregunta.opciones; let oi = index; trackBy: trackByOpcion">
                  <label class="option-row__correct">
                    <input
                      type="radio"
                      [name]="'correcta-' + pi"
                      [checked]="pregunta.respuestaCorrecta === opcion"
                      (change)="pregunta.respuestaCorrecta = opcion"
                    />
                    <span>Correcta</span>
                  </label>

                  <input
                    class="form-control"
                    [ngModel]="opcion"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="actualizarOpcion(pi, oi, $event)"
                    [placeholder]="'Opción ' + (oi + 1)"
                  />

                  <button type="button" class="btn btn-outline-secondary" (click)="eliminarOpcion(pi, oi)" [disabled]="pregunta.opciones.length <= 2">
                    Quitar
                  </button>
                </div>

                <button type="button" class="btn btn-outline-dark btn-sm" (click)="agregarOpcion(pi)">Agregar opción</button>
              </div>

              <small class="text-danger" *ngIf="errorEvaluacion">{{ errorEvaluacion }}</small>
            </section>
          </div>

          <div class="col-12 col-xl-5">
            <section class="module-form__panel module-form__panel--sticky">
              <div class="module-form__panel-head">
                <div>
                  <h6>PDF del módulo</h6>
                  <p>Solo se permite un PDF por módulo. Puedes cargarlo ahora o más tarde.</p>
                </div>
              </div>

              <label class="module-form__upload" for="module-pdf-input">
                <span>Seleccionar PDF</span>
                <input
                  id="module-pdf-input"
                  type="file"
                  accept="application/pdf"
                  (change)="onPdfSeleccionado($event)"
                />
              </label>

              <div class="module-form__upload-meta">
                <strong>{{ selectedPdfFile ? selectedPdfFile.name : 'Sin archivo seleccionado' }}</strong>
                <span>{{ selectedPdfFile ? formatFileSize(selectedPdfFile.size) : 'Máximo ' + maxPdfSizeMb + ' MB' }}</span>
              </div>

              <div class="module-form__upload-links" *ngIf="initialValue?.archivoPdfUrl && !selectedPdfFile">
                <span>PDF actual del módulo</span>
                <a [href]="initialValue?.archivoPdfUrl || ''" target="_blank" rel="noopener noreferrer">Abrir documento actual</a>
              </div>

              <small class="text-danger" *ngIf="pdfError">{{ pdfError }}</small>
              <small class="text-success" *ngIf="pdfInfo">{{ pdfInfo }}</small>

              <div class="module-form__preview" *ngIf="pdfPreviewUrl as safePreviewUrl">
                <div class="module-form__preview-head">
                  <strong>{{ pdfPreviewTitle }}</strong>
                  <button type="button" class="btn btn-outline-secondary btn-sm" *ngIf="selectedPdfFile" (click)="quitarPdfSeleccionado()">Quitar selección</button>
                </div>

                <iframe [src]="safePreviewUrl" title="Vista previa del PDF del módulo"></iframe>
              </div>
            </section>
          </div>
        </div>

        <footer class="module-form__actions">
          <button type="button" class="btn btn-outline-secondary btn-lg" (click)="cancel.emit()" [disabled]="loading">Cancelar</button>
          <button type="submit" class="btn btn-success btn-lg" [disabled]="loading">{{ loading ? 'Guardando...' : 'Guardar módulo' }}</button>
        </footer>
      </div>
    </form>
  `,
  styles: [
    `
      .module-form {
        border-radius: 32px;
        overflow: hidden;
      }

      .module-form__body {
        display: grid;
        gap: 1.5rem;
        padding: 1.5rem;
        background:
          radial-gradient(circle at top right, rgba(208, 230, 216, 0.25), transparent 22%),
          linear-gradient(180deg, #ffffff 0%, #f8fbf9 100%);
      }

      .module-form__header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
      }

      .module-form__eyebrow {
        margin: 0 0 0.35rem;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-weight: 800;
        color: #2d7a46;
      }

      .module-form__header h5 {
        margin: 0;
        color: #183a27;
      }

      .module-form__header p {
        margin: 0.45rem 0 0;
        color: #5f786b;
        max-width: 58ch;
      }

      .module-form__summary {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }

      .module-form__summary span {
        padding: 0.55rem 0.9rem;
        border-radius: 999px;
        background: #eef5f1;
        border: 1px solid #d7e7dc;
        color: #2b5840;
        font-weight: 700;
        font-size: 0.82rem;
      }

      .module-form__panel {
        display: grid;
        gap: 1rem;
        padding: 1.3rem;
        border-radius: 24px;
        border: 1px solid #dde8e0;
        background: #ffffff;
        box-shadow: 0 14px 30px rgba(22, 59, 39, 0.06);
      }

      .module-form__panel--soft {
        background: linear-gradient(180deg, #f9fcfa 0%, #f4f8f5 100%);
      }

      .module-form__panel--sticky {
        position: sticky;
        top: 1rem;
      }

      .module-form__panel-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
      }

      .module-form__panel-head h6 {
        margin: 0;
        color: #183a27;
      }

      .module-form__panel-head p {
        margin: 0.35rem 0 0;
        color: #647d70;
      }

      .module-form__empty {
        display: grid;
        gap: 0.25rem;
        padding: 1.1rem;
        border-radius: 20px;
        border: 1px dashed #c6d9ce;
        background: #fbfdfb;
        color: #60776a;
      }

      .question-card {
        display: grid;
        gap: 1rem;
        padding: 1rem;
        border-radius: 22px;
        border: 1px solid #d7e5dc;
        background: #ffffff;
      }

      .question-card__head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }

      .question-card__counter {
        display: block;
        margin-bottom: 0.2rem;
        color: #2a7b43;
        font-size: 0.8rem;
        font-weight: 800;
      }

      .question-card__head strong {
        color: #183a27;
      }

      .question-card__prompt {
        border-radius: 16px;
      }

      .question-card__options-head {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        font-size: 0.88rem;
        color: #61796c;
      }

      .option-row {
        display: grid;
        grid-template-columns: 140px minmax(0, 1fr) auto;
        gap: 0.75rem;
        align-items: center;
      }

      .option-row__correct {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        min-height: 48px;
        padding: 0.7rem 0.85rem;
        border-radius: 16px;
        border: 1px solid #d6e4db;
        background: #f5f9f6;
        color: #365344;
        font-weight: 700;
      }

      .module-form__upload {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 96px;
        border: 1px dashed #9fc5ab;
        border-radius: 22px;
        background: linear-gradient(180deg, #f3fbf5 0%, #eef6f0 100%);
        color: #1f5d39;
        font-weight: 800;
        cursor: pointer;
      }

      .module-form__upload input {
        display: none;
      }

      .module-form__upload-meta,
      .module-form__upload-links {
        display: grid;
        gap: 0.25rem;
        padding: 0.9rem 1rem;
        border-radius: 18px;
        background: #f4f8f5;
        border: 1px solid #e0ebe4;
      }

      .module-form__upload-meta strong,
      .module-form__upload-links span {
        color: #1d3f2d;
      }

      .module-form__upload-meta span,
      .module-form__upload-links a {
        font-size: 0.88rem;
        color: #617a6d;
      }

      .module-form__upload-links a {
        text-decoration: none;
        font-weight: 700;
        color: #16613d;
      }

      .module-form__preview {
        overflow: hidden;
        border-radius: 22px;
        border: 1px solid #d8e5dd;
        background: #ffffff;
      }

      .module-form__preview-head {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: center;
        padding: 0.9rem 1rem;
        background: #f4f8f5;
        border-bottom: 1px solid #dfeae3;
      }

      .module-form__preview-head strong {
        color: #183a27;
      }

      .module-form__preview iframe {
        width: 100%;
        min-height: 420px;
        border: 0;
        background: #f3f5f4;
      }

      .module-form__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }

      @media (max-width: 1199px) {
        .module-form__panel--sticky {
          position: static;
        }
      }

      @media (max-width: 767px) {
        .module-form__body {
          padding: 1rem;
        }

        .module-form__header,
        .module-form__panel-head,
        .question-card__head,
        .question-card__options-head,
        .module-form__preview-head,
        .module-form__actions {
          flex-direction: column;
          align-items: stretch;
        }

        .option-row {
          grid-template-columns: 1fr;
        }

        .module-form__preview iframe {
          min-height: 300px;
        }
      }
    `,
  ],
})
export class ModuloFormComponent implements OnChanges, OnDestroy {
  @Input() initialValue: ModuloDTO | null = null;
  @Input() loading = false;
  @Input() titulo = 'Crear módulo';
  @Input() resetToken = 0;

  @Output() save = new EventEmitter<{ modulo: ModuloDTO; pdfFile: File | null }>();
  @Output() cancel = new EventEmitter<void>();

  readonly maxPdfSizeMb = 20;

  form: FormGroup;
  evaluacionTitulo = '';
  preguntas: ModuloPreguntaDTO[] = [];
  errorEvaluacion = '';
  selectedPdfFile: File | null = null;
  pdfInfo = '';
  pdfError = '';
  pdfPreviewUrl: SafeResourceUrl | null = null;
  pdfPreviewTitle = 'PDF actual del módulo';

  private currentObjectUrl: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly sanitizer: DomSanitizer
  ) {
    this.form = this.fb.group({
      descripcion: ['', Validators.required],
      duracion: ['', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetToken']) {
      this.resetFormulario();
      return;
    }

    if (changes['initialValue']) {
      this.form.patchValue({
        descripcion: this.initialValue?.descripcion ?? '',
        duracion: this.initialValue?.duracion ?? '',
      });

      this.evaluacionTitulo = String(this.initialValue?.evaluacion?.titulo ?? '').trim();
      this.preguntas = this.clonePreguntas(this.initialValue?.evaluacion?.preguntas ?? []);
      this.errorEvaluacion = '';
      this.selectedPdfFile = null;
      this.pdfInfo = '';
      this.pdfError = '';
      this.setPreviewFromRemoteUrl(this.initialValue?.archivoPdfUrl ?? null);
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  onPdfSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    this.selectedPdfFile = null;
    this.pdfInfo = '';
    this.pdfError = '';

    if (!files.length) {
      this.setPreviewFromRemoteUrl(this.initialValue?.archivoPdfUrl ?? null);
      return;
    }

    if (files.length > 1) {
      this.pdfError = 'Solo puedes adjuntar un PDF por módulo.';
      input.value = '';
      this.setPreviewFromRemoteUrl(this.initialValue?.archivoPdfUrl ?? null);
      return;
    }

    const [file] = files;

    if (file.type !== 'application/pdf') {
      this.pdfError = 'Solo se permite archivo PDF para el módulo.';
      input.value = '';
      this.setPreviewFromRemoteUrl(this.initialValue?.archivoPdfUrl ?? null);
      return;
    }

    if (file.size > this.maxPdfSizeMb * 1024 * 1024) {
      this.pdfError = `El PDF excede el máximo permitido de ${this.maxPdfSizeMb} MB.`;
      input.value = '';
      return;
    }

    this.selectedPdfFile = file;
    this.pdfInfo = `PDF listo para subir: ${file.name}`;
    this.setPreviewFromLocalFile(file);
  }

  quitarPdfSeleccionado(): void {
    this.selectedPdfFile = null;
    this.pdfInfo = '';
    this.pdfError = '';
    this.setPreviewFromRemoteUrl(this.initialValue?.archivoPdfUrl ?? null);
  }

  agregarPregunta(): void {
    this.preguntas = [
      ...this.preguntas,
      {
        texto: '',
        tipo: 'opcion_multiple',
        opciones: ['', ''],
        respuestaCorrecta: '',
      },
    ];
  }

  eliminarPregunta(index: number): void {
    this.preguntas = this.preguntas.filter((_, i) => i !== index);
  }

  agregarOpcion(preguntaIndex: number): void {
    this.preguntas = this.preguntas.map((p, i) => {
      if (i !== preguntaIndex) {
        return p;
      }
      return {
        ...p,
        opciones: [...p.opciones, ''],
      };
    });
  }

  eliminarOpcion(preguntaIndex: number, opcionIndex: number): void {
    this.preguntas = this.preguntas.map((p, i) => {
      if (i !== preguntaIndex || p.opciones.length <= 2) {
        return p;
      }

      const opciones = p.opciones.filter((_, oi) => oi !== opcionIndex);
      const respuestaCorrecta = opciones.includes(p.respuestaCorrecta) ? p.respuestaCorrecta : '';

      return {
        ...p,
        opciones,
        respuestaCorrecta,
      };
    });
  }

  actualizarOpcion(preguntaIndex: number, opcionIndex: number, nuevoValor: string): void {
    this.preguntas = this.preguntas.map((p, i) => {
      if (i !== preguntaIndex) {
        return p;
      }

      const opciones = p.opciones.map((o, oi) => (oi === opcionIndex ? String(nuevoValor ?? '') : o));
      const valorAnterior = p.opciones[opcionIndex];
      const respuestaCorrecta = p.respuestaCorrecta === valorAnterior ? String(nuevoValor ?? '') : p.respuestaCorrecta;

      return {
        ...p,
        opciones,
        respuestaCorrecta,
      };
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const evaluacion = this.normalizeEvaluacion();
    if (this.evaluacionFueIniciada() && !evaluacion) {
      this.form.setErrors({ evaluacionInvalida: true });
      this.errorEvaluacion = 'La evaluación iniciada está incompleta. Completa título, preguntas, opciones y respuesta correcta, o elimínala para guardar solo el módulo.';
      return;
    }

    this.errorEvaluacion = '';

    this.save.emit({
      modulo: {
        ...this.initialValue,
        descripcion: String(this.form.value.descripcion || '').trim(),
        duracion: String(this.form.value.duracion || '').trim(),
        archivoPdfUrl: this.initialValue?.archivoPdfUrl ?? null,
        capacitacionId: this.initialValue?.capacitacionId,
        evaluacion: evaluacion ?? null,
      },
      pdfFile: this.selectedPdfFile,
    });
  }

  formatFileSize(size: number): string {
    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  trackByPregunta(index: number): number {
    return index;
  }

  trackByOpcion(index: number): number {
    return index;
  }

  private normalizeEvaluacion(): ModuloDTO['evaluacion'] {
    const titulo = this.evaluacionTitulo.trim();
    const preguntas = this.preguntas
      .map((p) => {
        const texto = String(p.texto || '').trim();
        const opciones = (Array.isArray(p.opciones) ? p.opciones : []).map((o) => String(o || '').trim()).filter((o) => !!o);
        const respuestaCorrecta = String(p.respuestaCorrecta || '').trim();

        if (!texto || opciones.length < 2 || !respuestaCorrecta || !opciones.includes(respuestaCorrecta)) {
          return null;
        }

        return {
          texto,
          tipo: 'opcion_multiple' as const,
          opciones,
          respuestaCorrecta,
        };
      })
      .filter((p): p is ModuloPreguntaDTO => !!p);

    if (!titulo || preguntas.length === 0) {
      return null;
    }

    return {
      titulo,
      preguntas,
      progresoUsuarios: this.initialValue?.evaluacion?.progresoUsuarios ?? {},
    };
  }

  private evaluacionFueIniciada(): boolean {
    if (this.evaluacionTitulo.trim()) {
      return true;
    }

    return this.preguntas.some((p) => {
      const texto = String(p.texto || '').trim();
      const tieneOpciones = (p.opciones || []).some((o) => String(o || '').trim().length > 0);
      const respuesta = String(p.respuestaCorrecta || '').trim();
      return !!texto || tieneOpciones || !!respuesta;
    });
  }

  private clonePreguntas(preguntas: ModuloPreguntaDTO[]): ModuloPreguntaDTO[] {
    return (preguntas || []).map((p) => ({
      texto: String(p.texto || ''),
      tipo: 'opcion_multiple',
      opciones: (Array.isArray(p.opciones) ? p.opciones : []).map((o) => String(o || '')),
      respuestaCorrecta: String(p.respuestaCorrecta || ''),
    }));
  }

  private resetFormulario(): void {
    this.form.reset({ descripcion: '', duracion: '' });
    this.evaluacionTitulo = '';
    this.preguntas = [];
    this.errorEvaluacion = '';
    this.selectedPdfFile = null;
    this.pdfInfo = '';
    this.pdfError = '';
    this.revokeObjectUrl();
    this.pdfPreviewUrl = null;
    this.pdfPreviewTitle = 'PDF actual del módulo';
  }

  private setPreviewFromLocalFile(file: File): void {
    this.revokeObjectUrl();
    this.currentObjectUrl = URL.createObjectURL(file);
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentObjectUrl);
    this.pdfPreviewTitle = 'Previsualización del PDF seleccionado';
  }

  private setPreviewFromRemoteUrl(url: string | null | undefined): void {
    this.revokeObjectUrl();
    const exactUrl = String(url || '').trim();

    if (!exactUrl) {
      this.pdfPreviewUrl = null;
      this.pdfPreviewTitle = 'PDF actual del módulo';
      return;
    }

    const viewerUrl = this.buildEmbeddedPdfUrl(exactUrl);
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
    this.pdfPreviewTitle = 'PDF actual del módulo';
  }

  private buildEmbeddedPdfUrl(url: string): string {
    const hasFragment = url.includes('#');
    const viewerParams = 'toolbar=0&navpanes=0&scrollbar=1';
    return `${url}${hasFragment ? '&' : '#'}${viewerParams}`;
  }

  private revokeObjectUrl(): void {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
  }
}

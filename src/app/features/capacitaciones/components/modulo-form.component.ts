import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModuloDTO, ModuloPreguntaDTO } from '../models/capacitaciones-modulos.models';

@Component({
  selector: 'app-modulo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="card shadow-sm border-0">
      <div class="card-body">
        <h6 class="mb-3">{{ titulo }}</h6>

        <div class="mb-3">
          <label class="form-label">Descripción</label>
          <textarea formControlName="descripcion" class="form-control" rows="2"></textarea>
          <small class="text-danger" *ngIf="form.controls['descripcion'].touched && form.controls['descripcion'].invalid">
            La descripción es obligatoria.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label">Duración</label>
          <input formControlName="duracion" class="form-control" placeholder="Ej: 2 horas" />
          <small class="text-danger" *ngIf="form.controls['duracion'].touched && form.controls['duracion'].invalid">
            La duración es obligatoria.
          </small>
        </div>

        <div class="mb-3 border rounded p-3">
          <label class="form-label fw-semibold">PDF del módulo (opcional al crear)</label>
          <input
            type="file"
            accept="application/pdf"
            class="form-control"
            (change)="onPdfSeleccionado($event)"
          />
          <small class="text-muted" *ngIf="!pdfInfo">Puedes subirlo ahora o más tarde.</small>
          <small class="text-success d-block" *ngIf="pdfInfo">{{ pdfInfo }}</small>
        </div>

        <div class="mb-3 border rounded p-3 bg-light-subtle">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Evaluación (opción múltiple)</h6>
            <button type="button" class="btn btn-outline-success btn-sm" (click)="agregarPregunta()">Agregar pregunta</button>
          </div>

          <div class="mb-2">
            <label class="form-label">Título de la evaluación</label>
            <input class="form-control" [(ngModel)]="evaluacionTitulo" [ngModelOptions]="{ standalone: true }" placeholder="Ej: Formulario módulo 1" />
          </div>

          <div *ngIf="preguntas.length === 0" class="small text-muted">Agrega al menos una pregunta.</div>

          <div class="border rounded p-2 mb-2" *ngFor="let pregunta of preguntas; let pi = index; trackBy: trackByPregunta">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <strong class="small">Pregunta {{ pi + 1 }}</strong>
              <button type="button" class="btn btn-outline-danger btn-sm" (click)="eliminarPregunta(pi)">Eliminar</button>
            </div>

            <label class="form-label small">Texto de la pregunta</label>
            <input class="form-control form-control-sm mb-2" [(ngModel)]="pregunta.texto" [ngModelOptions]="{ standalone: true }" />

            <label class="form-label small">Opciones y respuesta correcta</label>
            <div class="input-group input-group-sm mb-1" *ngFor="let opcion of pregunta.opciones; let oi = index; trackBy: trackByOpcion">
              <span class="input-group-text">
                <input
                  type="radio"
                  [name]="'correcta-' + pi"
                  [checked]="pregunta.respuestaCorrecta === opcion"
                  (change)="pregunta.respuestaCorrecta = opcion"
                />
              </span>
              <input
                class="form-control"
                [ngModel]="opcion"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="actualizarOpcion(pi, oi, $event)"
              />
              <button type="button" class="btn btn-outline-danger" (click)="eliminarOpcion(pi, oi)" [disabled]="pregunta.opciones.length <= 2">Quitar</button>
            </div>

            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="agregarOpcion(pi)">Agregar opción</button>
          </div>

          <small class="text-danger" *ngIf="errorEvaluacion">{{ errorEvaluacion }}</small>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary" (click)="cancel.emit()" [disabled]="loading">Cancelar</button>
          <button type="submit" class="btn btn-success" [disabled]="loading">{{ loading ? 'Guardando...' : 'Guardar módulo' }}</button>
        </div>
      </div>
    </form>
  `,
})
export class ModuloFormComponent implements OnChanges {
  @Input() initialValue: ModuloDTO | null = null;
  @Input() loading = false;
  @Input() titulo = 'Crear módulo';
  @Input() resetToken = 0;

  @Output() save = new EventEmitter<{ modulo: ModuloDTO; pdfFile: File | null }>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  evaluacionTitulo = '';
  preguntas: ModuloPreguntaDTO[] = [];
  errorEvaluacion = '';
  selectedPdfFile: File | null = null;
  pdfInfo = '';

  constructor(private readonly fb: FormBuilder) {
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
    }
  }

  onPdfSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedPdfFile = null;
    this.pdfInfo = '';

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      this.errorEvaluacion = 'Solo se permite archivo PDF para el módulo.';
      input.value = '';
      return;
    }

    this.selectedPdfFile = file;
    this.pdfInfo = `PDF seleccionado: ${file.name}`;
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
  }
}

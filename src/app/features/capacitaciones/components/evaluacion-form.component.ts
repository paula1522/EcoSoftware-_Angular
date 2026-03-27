import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { EvaluacionDTO, EvaluacionPregunta } from '../models/capacitaciones-modulos.models';

@Component({
  selector: 'app-evaluacion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="border rounded p-3 bg-light">
      <div class="row g-2">
        <div class="col-12 col-md-6">
          <label class="form-label">Título</label>
          <input class="form-control" formControlName="titulo" />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label">Puntaje mínimo</label>
          <input type="number" class="form-control" formControlName="puntajeMinimo" min="0" max="100" />
        </div>
        <div class="col-12">
          <label class="form-label">Descripción</label>
          <textarea class="form-control" formControlName="descripcion" rows="2"></textarea>
        </div>
        <div class="col-12">
          <label class="form-check-label d-flex align-items-center gap-2">
            <input class="form-check-input" type="checkbox" formControlName="activa" />
            Activa
          </label>
        </div>

        <div class="col-12">
          <div class="border rounded bg-white p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <strong>Preguntas de opción múltiple</strong>
              <button type="button" class="btn btn-outline-success btn-sm" (click)="agregarPregunta()">Agregar pregunta</button>
            </div>

            <div *ngIf="preguntas.length === 0" class="small text-muted">Agrega al menos una pregunta para esta evaluación.</div>

            <div class="border rounded p-2 mb-2" *ngFor="let pregunta of preguntas; let pi = index; trackBy: trackByPregunta">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="small fw-semibold">Pregunta {{ pi + 1 }}</span>
                <button type="button" class="btn btn-outline-danger btn-sm" (click)="eliminarPregunta(pi)">Eliminar</button>
              </div>

              <label class="form-label small">Enunciado</label>
              <input class="form-control form-control-sm mb-2" [(ngModel)]="pregunta.enunciado" [ngModelOptions]="{ standalone: true }" />

              <div class="small mb-1">Opciones</div>
              <div class="input-group input-group-sm mb-1" *ngFor="let opcion of pregunta.opciones; let oi = index; trackBy: trackByOpcion">
                <span class="input-group-text">
                  <input type="radio" [name]="'correcta-' + pi" [checked]="opcion.esCorrecta" (change)="marcarCorrecta(pi, oi)" />
                </span>
                <input class="form-control" [(ngModel)]="opcion.texto" [ngModelOptions]="{ standalone: true }" />
                <button type="button" class="btn btn-outline-danger" (click)="eliminarOpcion(pi, oi)" [disabled]="pregunta.opciones.length <= 2">Quitar</button>
              </div>

              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="agregarOpcion(pi)">Agregar opción</button>
            </div>

            <small class="text-danger" *ngIf="form.errors?.['quizInvalido']">
              Cada pregunta debe tener enunciado, mínimo 2 opciones con texto y 1 respuesta correcta.
            </small>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-3">
        <button type="button" class="btn btn-outline-secondary btn-sm" (click)="cancel.emit()" [disabled]="loading">Cancelar</button>
        <button type="submit" class="btn btn-success btn-sm" [disabled]="loading">{{ loading ? 'Guardando...' : 'Guardar evaluación' }}</button>
      </div>
    </form>
  `,
})
export class EvaluacionFormComponent implements OnChanges {
  @Input() initialValue: EvaluacionDTO | null = null;
  @Input() loading = false;

  @Output() save = new EventEmitter<EvaluacionDTO>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  preguntas: EvaluacionPregunta[] = [];

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
      puntajeMinimo: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
      activa: [true],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue']) {
      this.form.patchValue({
        titulo: this.initialValue?.titulo ?? '',
        descripcion: this.initialValue?.descripcion ?? '',
        puntajeMinimo: this.initialValue?.puntajeMinimo ?? 70,
        activa: this.initialValue?.activa ?? true,
      });

      this.preguntas = this.clonarPreguntas(this.initialValue?.preguntas ?? []);
    }
  }

  agregarPregunta(): void {
    this.preguntas = [
      ...this.preguntas,
      {
        enunciado: '',
        opciones: [
          { texto: '', esCorrecta: true },
          { texto: '', esCorrecta: false },
        ],
      },
    ];
  }

  eliminarPregunta(index: number): void {
    this.preguntas = this.preguntas.filter((_, i) => i !== index);
  }

  marcarCorrecta(preguntaIndex: number, opcionIndex: number): void {
    this.preguntas = this.preguntas.map((p, i) => {
      if (i !== preguntaIndex) {
        return p;
      }

      return {
        ...p,
        opciones: p.opciones.map((o, oi) => ({ ...o, esCorrecta: oi === opcionIndex })),
      };
    });
  }

  agregarOpcion(preguntaIndex: number): void {
    this.preguntas = this.preguntas.map((p, i) => {
      if (i !== preguntaIndex) {
        return p;
      }

      return {
        ...p,
        opciones: [...p.opciones, { texto: '', esCorrecta: false }],
      };
    });
  }

  eliminarOpcion(preguntaIndex: number, opcionIndex: number): void {
    this.preguntas = this.preguntas.map((p, i) => {
      if (i !== preguntaIndex || p.opciones.length <= 2) {
        return p;
      }

      const nuevas = p.opciones.filter((_, oi) => oi !== opcionIndex);
      if (!nuevas.some((o) => o.esCorrecta)) {
        nuevas[0] = { ...nuevas[0], esCorrecta: true };
      }

      return {
        ...p,
        opciones: nuevas,
      };
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const validas = this.preguntas.every((pregunta) => {
      const enunciado = String(pregunta.enunciado || '').trim();
      const opcionesValidas = (pregunta.opciones || []).filter((o) => String(o.texto || '').trim().length > 0);
      const tieneCorrecta = opcionesValidas.some((o) => !!o.esCorrecta);
      return enunciado.length > 0 && opcionesValidas.length >= 2 && tieneCorrecta;
    });

    if (!validas || this.preguntas.length === 0) {
      this.form.setErrors({ quizInvalido: true });
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit({
      ...this.initialValue,
      titulo: String(this.form.value.titulo || '').trim(),
      descripcion: String(this.form.value.descripcion || '').trim(),
      puntajeMinimo: Number(this.form.value.puntajeMinimo),
      activa: !!this.form.value.activa,
      tipo: 'multiple',
      preguntas: this.clonarPreguntas(this.preguntas),
      moduloId: this.initialValue?.moduloId,
    });
  }

  trackByPregunta(index: number): number {
    return index;
  }

  trackByOpcion(index: number): number {
    return index;
  }

  private clonarPreguntas(items: EvaluacionPregunta[]): EvaluacionPregunta[] {
    return (items || []).map((p) => ({
      id: p.id,
      enunciado: String(p.enunciado || ''),
      opciones: (p.opciones || []).map((o) => ({
        id: o.id,
        texto: String(o.texto || ''),
        esCorrecta: !!o.esCorrecta,
      })),
    }));
  }
}

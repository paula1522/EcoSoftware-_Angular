import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EvaluacionDTO } from '../models/capacitaciones-modulos.models';

@Component({
  selector: 'app-evaluacion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit({
      ...this.initialValue,
      titulo: String(this.form.value.titulo || '').trim(),
      descripcion: String(this.form.value.descripcion || '').trim(),
      puntajeMinimo: Number(this.form.value.puntajeMinimo),
      activa: !!this.form.value.activa,
      moduloId: this.initialValue?.moduloId,
    });
  }
}

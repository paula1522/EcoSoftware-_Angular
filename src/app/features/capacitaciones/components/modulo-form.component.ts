import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModuloDTO } from '../models/capacitaciones-modulos.models';

@Component({
  selector: 'app-modulo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  @Output() save = new EventEmitter<ModuloDTO>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      descripcion: ['', Validators.required],
      duracion: ['', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue']) {
      this.form.patchValue({
        descripcion: this.initialValue?.descripcion ?? '',
        duracion: this.initialValue?.duracion ?? '',
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
      descripcion: String(this.form.value.descripcion || '').trim(),
      duracion: String(this.form.value.duracion || '').trim(),
      archivoPdfUrl: this.initialValue?.archivoPdfUrl ?? null,
      capacitacionId: this.initialValue?.capacitacionId,
    });
  }
}

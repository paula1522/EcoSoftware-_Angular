import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CapacitacionesModulosApiService } from '../api/capacitaciones-modulos-api.service';
import { EvaluacionDTO } from '../models/capacitaciones-modulos.models';
import { EvaluacionFormComponent } from './evaluacion-form.component';

@Component({
  selector: 'app-evaluaciones-modulo-admin',
  standalone: true,
  imports: [CommonModule, EvaluacionFormComponent],
  template: `
    <section class="mt-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">Evaluaciones</h6>
        <button class="btn btn-outline-success btn-sm" (click)="abrirCrear()">Nueva evaluación</button>
      </div>

      <small class="text-danger" *ngIf="error">{{ error }}</small>

      <app-evaluacion-form
        *ngIf="showForm"
        [initialValue]="editing"
        [loading]="saving"
        (save)="guardar($event)"
        (cancel)="cancelarFormulario()">
      </app-evaluacion-form>

      <div *ngIf="loading" class="small text-muted">Cargando evaluaciones...</div>
      <div *ngIf="!loading && evaluaciones.length === 0" class="small text-warning">Sin evaluaciones para este módulo.</div>

      <div class="list-group mt-2" *ngIf="evaluaciones.length > 0">
        <div class="list-group-item" *ngFor="let ev of evaluaciones">
          <div class="d-flex justify-content-between gap-3">
            <div>
              <strong>{{ ev.titulo }}</strong>
              <div class="small text-muted">{{ ev.descripcion }}</div>
              <div class="small">
                Puntaje mínimo: {{ ev.puntajeMinimo }} |
                {{ ev.activa ? 'Activa' : 'Inactiva' }} |
                Tipo: {{ ev.tipo === 'multiple' ? 'Opción múltiple' : 'Manual' }}
                <span *ngIf="ev.tipo === 'multiple'">| Preguntas: {{ (ev.preguntas || []).length }}</span>
              </div>
            </div>
            <div class="d-flex gap-2 align-items-start">
              <button class="btn btn-outline-primary btn-sm" (click)="abrirEditar(ev)">Editar</button>
              <button class="btn btn-outline-danger btn-sm" (click)="eliminar(ev)">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class EvaluacionesModuloAdminComponent implements OnChanges {
  @Input() moduloId: number | null = null;

  evaluaciones: EvaluacionDTO[] = [];
  loading = false;
  saving = false;
  error = '';

  showForm = false;
  editing: EvaluacionDTO | null = null;

  constructor(private readonly api: CapacitacionesModulosApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['moduloId'] && this.moduloId) {
      this.cargar();
    }
  }

  cargar(): void {
    if (!this.moduloId) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.api.listarEvaluacionesPorModulo(this.moduloId).subscribe({
      next: (data) => {
        this.evaluaciones = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Error cargando evaluaciones.';
        this.loading = false;
      },
    });
  }

  abrirCrear(): void {
    this.editing = {
      titulo: '',
      descripcion: '',
      puntajeMinimo: 70,
      activa: true,
      tipo: 'multiple',
      preguntas: [
        {
          enunciado: '',
          opciones: [
            { texto: '', esCorrecta: true },
            { texto: '', esCorrecta: false },
          ],
        },
      ],
      moduloId: this.moduloId ?? undefined,
    };
    this.showForm = true;
  }

  abrirEditar(ev: EvaluacionDTO): void {
    this.editing = { ...ev };
    this.showForm = true;
  }

  cancelarFormulario(): void {
    this.showForm = false;
    this.editing = null;
    this.saving = false;
  }

  guardar(dto: EvaluacionDTO): void {
    if (!this.moduloId) {
      return;
    }

    this.saving = true;
    this.error = '';

    const payload: EvaluacionDTO = {
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      puntajeMinimo: dto.puntajeMinimo,
      activa: dto.activa,
      tipo: 'multiple',
      preguntas: dto.preguntas ?? [],
      moduloId: this.moduloId,
    };

    const request$ = dto.id
      ? this.api.actualizarEvaluacion(dto.id, { ...payload, id: dto.id })
      : this.api.crearEvaluacion(this.moduloId, payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.cancelarFormulario();
        this.cargar();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'No se pudo guardar la evaluación.';
      },
    });
  }

  eliminar(ev: EvaluacionDTO): void {
    if (!ev.id) {
      return;
    }

    if (!window.confirm('¿Eliminar esta evaluación?')) {
      return;
    }

    this.api.eliminarEvaluacion(ev.id).subscribe({
      next: () => this.cargar(),
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo eliminar la evaluación.';
      },
    });
  }
}

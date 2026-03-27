import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CapacitacionesModulosApiService } from '../api/capacitaciones-modulos-api.service';
import { EvaluacionDTO, IntentoEvaluacionDTO } from '../models/capacitaciones-modulos.models';

@Component({
  selector: 'app-evaluaciones-modulo-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mt-2">
      <h6 class="mb-2">Evaluaciones del módulo</h6>
      <small class="text-danger" *ngIf="error">{{ error }}</small>

      <div *ngIf="loading" class="small text-muted">Cargando evaluaciones...</div>
      <div *ngIf="!loading && evaluaciones.length === 0" class="small text-warning">Sin evaluaciones disponibles.</div>

      <div class="list-group" *ngIf="evaluaciones.length > 0">
        <div class="list-group-item" *ngFor="let ev of evaluaciones">
          <div class="d-flex justify-content-between gap-3 flex-wrap">
            <div>
              <strong>{{ ev.titulo }}</strong>
              <div class="small text-muted">{{ ev.descripcion }}</div>
              <div class="small">Puntaje mínimo: {{ ev.puntajeMinimo }} | {{ ev.activa ? 'Activa' : 'Inactiva' }}</div>
              <div class="small text-success" *ngIf="ultimoIntento[ev.id || 0]">
                Último intento: {{ ultimoIntento[ev.id || 0]?.puntajeObtenido }}
                ({{ ultimoIntento[ev.id || 0]?.aprobado ? 'Aprobado' : 'No aprobado' }})
              </div>
            </div>

            <div *ngIf="ev.activa" class="d-flex gap-2 align-items-start">
              <input
                type="number"
                min="0"
                max="100"
                class="form-control form-control-sm"
                style="width: 110px;"
                [(ngModel)]="puntajePorEvaluacion[ev.id || 0]"
                [disabled]="sending[ev.id || 0]"
                placeholder="0 - 100"
              />
              <button class="btn btn-success btn-sm" [disabled]="sending[ev.id || 0]" (click)="enviarIntento(ev)">
                {{ sending[ev.id || 0] ? 'Enviando...' : 'Enviar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class EvaluacionesModuloUsuarioComponent implements OnChanges {
  @Input() moduloId: number | null = null;
  @Input() usuarioId: number | null = null;

  @Output() intentoRegistrado = new EventEmitter<void>();

  evaluaciones: EvaluacionDTO[] = [];
  loading = false;
  error = '';

  puntajePorEvaluacion: Record<number, number | null> = {};
  sending: Record<number, boolean> = {};
  ultimoIntento: Record<number, IntentoEvaluacionDTO | null> = {};

  constructor(private readonly api: CapacitacionesModulosApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['moduloId'] || changes['usuarioId']) && this.moduloId && this.usuarioId) {
      this.cargar();
    }
  }

  cargar(): void {
    if (!this.moduloId || !this.usuarioId) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.api.listarEvaluacionesPorModulo(this.moduloId).subscribe({
      next: (data) => {
        this.evaluaciones = data;
        this.loading = false;
        data.forEach((ev) => this.cargarUltimoIntento(ev.id));
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar las evaluaciones.';
        this.loading = false;
      },
    });
  }

  enviarIntento(ev: EvaluacionDTO): void {
    if (!ev.id || !this.usuarioId) {
      return;
    }

    const puntaje = this.puntajePorEvaluacion[ev.id];
    if (puntaje == null || Number.isNaN(puntaje) || puntaje < 0 || puntaje > 100) {
      this.error = 'El puntaje debe estar entre 0 y 100.';
      return;
    }

    this.error = '';
    this.sending[ev.id] = true;

    this.api.registrarIntentoEvaluacion(ev.id, {
      usuarioId: this.usuarioId,
      puntajeObtenido: Number(puntaje),
      evaluacionId: ev.id,
    }).subscribe({
      next: (intento) => {
        this.sending[ev.id!] = false;
        this.puntajePorEvaluacion[ev.id!] = null;
        this.ultimoIntento[ev.id!] = intento;
        this.intentoRegistrado.emit();
      },
      error: (err) => {
        this.sending[ev.id!] = false;
        this.error = err?.error?.message || 'No fue posible registrar el intento.';
      },
    });
  }

  private cargarUltimoIntento(evaluacionId?: number): void {
    if (!evaluacionId || !this.usuarioId) {
      return;
    }

    this.api.listarIntentosPorEvaluacionYUsuario(evaluacionId, this.usuarioId).subscribe({
      next: (intentos) => {
        this.ultimoIntento[evaluacionId] = intentos.length ? intentos[intentos.length - 1] : null;
      },
      error: () => {
        this.ultimoIntento[evaluacionId] = null;
      },
    });
  }
}

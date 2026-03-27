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
              <div class="small">
                Puntaje mínimo: {{ ev.puntajeMinimo }} |
                {{ ev.activa ? 'Activa' : 'Inactiva' }} |
                Tipo: Opción múltiple
              </div>
              <div class="small text-success" *ngIf="ultimoIntento[ev.id || 0]">
                Último intento: {{ ultimoIntento[ev.id || 0]?.puntajeObtenido }}
                ({{ ultimoIntento[ev.id || 0]?.aprobado ? 'Aprobado' : 'No aprobado' }})
              </div>
            </div>

            <div *ngIf="ev.activa && (!ev.preguntas || ev.preguntas.length === 0)" class="small text-warning">
              Esta evaluación aún no tiene preguntas publicadas.
            </div>
          </div>

          <div class="mt-3" *ngIf="ev.activa && (ev.preguntas || []).length > 0">
            <div class="border rounded p-2 mb-2" *ngFor="let p of ev.preguntas || []; let pi = index">
              <div class="small fw-semibold mb-2">{{ pi + 1 }}. {{ p.enunciado }}</div>

              <div class="form-check mb-1" *ngFor="let opcion of p.opciones; let oi = index">
                <input
                  class="form-check-input"
                  type="radio"
                  [name]="'eval-' + (ev.id || 0) + '-preg-' + pi"
                  [checked]="selecciones[ev.id || 0]?.[pi] === oi"
                  (change)="seleccionarOpcion(ev.id || 0, pi, oi)"
                  [disabled]="sending[ev.id || 0]"
                />
                <label class="form-check-label small">{{ opcion.texto }}</label>
              </div>
            </div>

            <button class="btn btn-success btn-sm" [disabled]="sending[ev.id || 0]" (click)="enviarIntento(ev)">
              {{ sending[ev.id || 0] ? 'Enviando...' : 'Enviar evaluación' }}
            </button>
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

  selecciones: Record<number, Record<number, number>> = {};
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

    const puntaje = this.calcularPuntajeMultiple(ev);
    if (puntaje == null) {
      this.error = 'Debes responder todas las preguntas antes de enviar.';
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
        this.selecciones[ev.id!] = {};
        this.ultimoIntento[ev.id!] = intento;
        this.intentoRegistrado.emit();
      },
      error: (err) => {
        this.sending[ev.id!] = false;
        this.error = err?.error?.message || 'No fue posible registrar el intento.';
      },
    });
  }

  seleccionarOpcion(evaluacionId: number, preguntaIndex: number, opcionIndex: number): void {
    const actual = this.selecciones[evaluacionId] || {};
    this.selecciones[evaluacionId] = {
      ...actual,
      [preguntaIndex]: opcionIndex,
    };
  }

  private calcularPuntajeMultiple(ev: EvaluacionDTO): number | null {
    const preguntas = ev.preguntas || [];
    if (preguntas.length === 0) {
      return 0;
    }

    const selected = this.selecciones[ev.id || 0] || {};
    let correctas = 0;

    for (let i = 0; i < preguntas.length; i += 1) {
      const pregunta = preguntas[i];
      const selectedOption = selected[i];

      if (selectedOption === undefined || selectedOption === null) {
        return null;
      }

      const opcion = (pregunta.opciones || [])[selectedOption];
      if (opcion?.esCorrecta) {
        correctas += 1;
      }
    }

    return Math.round((correctas / preguntas.length) * 100);
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

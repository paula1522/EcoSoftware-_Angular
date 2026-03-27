import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgresoDTO } from '../models/capacitaciones-modulos.models';

@Component({
  selector: 'app-progreso-curso',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card border-0 shadow-sm" *ngIf="progreso; else sinProgreso">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <strong>Progreso del curso</strong>
          <span>{{ progreso.progresoDelCurso }}</span>
        </div>

        <div class="progress" role="progressbar" aria-label="Progreso curso" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="porcentajeNumerico">
          <div class="progress-bar bg-success" [style.width.%]="porcentajeNumerico"></div>
        </div>

        <div class="small text-muted mt-2">
          Módulos completados: {{ progreso.modulosCompletados }} | Tiempo invertido: {{ progreso.tiempoInvertido }}
        </div>
      </div>
    </div>

    <ng-template #sinProgreso>
      <div class="small text-muted">Aún no hay progreso calculado para este curso.</div>
    </ng-template>
  `,
})
export class ProgresoCursoComponent {
  @Input() progreso: ProgresoDTO | null = null;

  get porcentajeNumerico(): number {
    const raw = this.progreso?.progresoDelCurso || '0';
    const normalized = String(raw).replace('%', '').trim();
    const value = Number(normalized);
    if (Number.isNaN(value)) {
      return 0;
    }
    return Math.max(0, Math.min(100, value));
  }
}

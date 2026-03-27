import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CapacitacionDTO,
  ModuloDTO,
  EvaluacionDTO,
  ProgresoDTO,
  IntentoEvaluacionDTO,
} from '../../../Models/capacitacion.model';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-mis-capacitaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-capacitaciones.html',
  styleUrl: './mis-capacitaciones.css',
})
export class MisCapacitacionesComponent implements OnInit {
  capacitaciones: CapacitacionDTO[] = [];
  modulosPorCurso: Record<number, ModuloDTO[]> = {};
  evaluacionesPorModulo: Record<number, EvaluacionDTO[]> = {};
  progresoPorCurso: Record<number, ProgresoDTO | null> = {};
  ultimoIntentoPorEvaluacion: Record<number, IntentoEvaluacionDTO | null> = {};
  puntajePorEvaluacion: Record<number, number | null> = {};

  loading = false;
  error = '';
  success = '';

  usuarioId: number | null = null;
  cursoExpandidoId: number | null = null;

  constructor(
    private readonly capacitacionesService: CapacitacionesService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuarioId = this.authService.getUserId();
    this.cargarMisCapacitaciones();
  }

  cargarMisCapacitaciones(): void {
    this.loading = true;
    this.error = '';

    if (!this.usuarioId) {
      this.error = 'No hay sesion activa para consultar capacitaciones.';
      this.loading = false;
      return;
    }

    this.capacitacionesService.obtenerMisCapacitaciones(this.usuarioId).subscribe({
      next: (data) => {
        this.capacitaciones = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No fue posible cargar tus capacitaciones inscritas.';
        this.loading = false;
      },
    });
  }

  toggleCurso(curso: CapacitacionDTO): void {
    const cursoId = curso.id ?? null;
    if (!cursoId || !this.usuarioId) {
      return;
    }

    if (this.cursoExpandidoId === cursoId) {
      this.cursoExpandidoId = null;
      return;
    }

    this.cursoExpandidoId = cursoId;

    this.capacitacionesService.listarModulosPorCapacitacion(cursoId).subscribe({
      next: (modulos) => {
        this.modulosPorCurso[cursoId] = modulos;

        modulos.forEach((modulo) => {
          if (!modulo.id) {
            return;
          }
          this.cargarEvaluaciones(modulo.id);
        });
      },
      error: () => {
        this.error = 'No fue posible cargar los modulos del curso.';
      },
    });

    this.capacitacionesService.obtenerProgresoUsuarioPorCurso(this.usuarioId, cursoId).subscribe({
      next: (progreso) => {
        this.progresoPorCurso[cursoId] = progreso;
      },
      error: () => {
        this.progresoPorCurso[cursoId] = null;
      },
    });
  }

  abrirPdf(url: string | null | undefined): void {
    if (!url) {
      this.error = 'Este modulo aun no tiene PDF publicado.';
      return;
    }

    window.open(url, '_blank', 'noopener');
  }

  registrarIntento(evaluacion: EvaluacionDTO): void {
    this.clearMessages();

    if (!this.usuarioId || !evaluacion.id) {
      this.error = 'No fue posible identificar usuario o evaluacion.';
      return;
    }

    const puntaje = this.puntajePorEvaluacion[evaluacion.id];
    if (puntaje == null || Number.isNaN(puntaje)) {
      this.error = 'Debes ingresar un puntaje entre 0 y 100.';
      return;
    }

    if (puntaje < 0 || puntaje > 100) {
      this.error = 'El puntaje debe estar entre 0 y 100.';
      return;
    }

    this.capacitacionesService
      .registrarIntentoEvaluacion(evaluacion.id, {
        usuarioId: this.usuarioId,
        puntajeObtenido: puntaje,
      })
      .subscribe({
        next: (intento) => {
          this.ultimoIntentoPorEvaluacion[evaluacion.id!] = intento;
          this.success = intento.aprobado
            ? 'Intento registrado. Evaluacion aprobada.'
            : 'Intento registrado. Evaluacion no aprobada.';
          this.puntajePorEvaluacion[evaluacion.id!] = null;

          const cursoId = this.cursoExpandidoId;
          if (cursoId && this.usuarioId) {
            this.capacitacionesService.obtenerProgresoUsuarioPorCurso(this.usuarioId, cursoId).subscribe({
              next: (progreso) => {
                this.progresoPorCurso[cursoId] = progreso;
              },
              error: () => {
                this.progresoPorCurso[cursoId] = null;
              },
            });
          }
        },
        error: () => {
          this.error = 'No fue posible registrar el intento de evaluacion.';
        },
      });
  }

  private cargarEvaluaciones(moduloId: number): void {
    if (!this.usuarioId) {
      return;
    }

    this.capacitacionesService.listarEvaluacionesPorModulo(moduloId).subscribe({
      next: (evaluaciones) => {
        this.evaluacionesPorModulo[moduloId] = evaluaciones;

        evaluaciones.forEach((ev) => {
          if (!ev.id) {
            return;
          }
          this.capacitacionesService
            .listarIntentosPorEvaluacionYUsuario(ev.id, this.usuarioId!)
            .subscribe({
              next: (intentos) => {
                this.ultimoIntentoPorEvaluacion[ev.id!] = intentos.length
                  ? intentos[intentos.length - 1]
                  : null;
              },
              error: () => {
                this.ultimoIntentoPorEvaluacion[ev.id!] = null;
              },
            });
        });
      },
      error: () => {
        this.evaluacionesPorModulo[moduloId] = [];
      },
    });
  }

  private clearMessages(): void {
    this.error = '';
    this.success = '';
  }
}

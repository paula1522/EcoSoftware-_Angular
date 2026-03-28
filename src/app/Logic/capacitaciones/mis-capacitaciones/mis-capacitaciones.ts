import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CapacitacionDTO } from '../../../Models/capacitacion.model';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { AuthService } from '../../../auth/auth.service';
import { ModulosUsuarioPageComponent } from '../../../features/capacitaciones/pages/modulos-usuario-page.component';
import { CapacitacionesModulosApiService } from '../../../features/capacitaciones/api/capacitaciones-modulos-api.service';
import { ModuloDTO } from '../../../features/capacitaciones/models/capacitaciones-modulos.models';
import { catchError, forkJoin, map, of } from 'rxjs';

@Component({
  selector: 'app-mis-capacitaciones',
  standalone: true,
  imports: [CommonModule, ModulosUsuarioPageComponent],
  templateUrl: './mis-capacitaciones.html',
  styleUrl: './mis-capacitaciones.css',
})
export class MisCapacitacionesComponent implements OnInit {
  @Output() detalleModulosChange = new EventEmitter<boolean>();

  capacitaciones: CapacitacionDTO[] = [];

  loading = false;
  error = '';
  progresoPorCurso: Record<number, number> = {};

  usuarioId: number | null = null;
  capacitacionSeleccionadaId: number | null = null;

  constructor(
    private readonly capacitacionesService: CapacitacionesService,
    private readonly authService: AuthService,
    private readonly modulosApi: CapacitacionesModulosApiService
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
        this.cargarProgresoCapacitaciones(data);
        this.loading = false;
      },
      error: () => {
        this.error = 'No fue posible cargar tus capacitaciones inscritas.';
        this.loading = false;
      },
    });
  }

  abrirCurso(curso: CapacitacionDTO): void {
    if (!curso.id) {
      return;
    }

    this.capacitacionSeleccionadaId = curso.id;
    this.detalleModulosChange.emit(true);
  }

  volverAListaCards(): void {
    this.capacitacionSeleccionadaId = null;
    this.detalleModulosChange.emit(false);
  }

  getProgresoCurso(cursoId?: number | null): number {
    if (!cursoId) {
      return 0;
    }

    return this.progresoPorCurso[cursoId] ?? 0;
  }

  private cargarProgresoCapacitaciones(cursos: CapacitacionDTO[]): void {
    if (!this.usuarioId) {
      this.progresoPorCurso = {};
      return;
    }

    const requests = cursos
      .filter((curso): curso is CapacitacionDTO & { id: number } => Number.isFinite(curso.id))
      .map((curso) =>
        this.modulosApi.listarModulosPorCapacitacion(curso.id).pipe(
          map((modulos) => ({ cursoId: curso.id, progreso: this.calcularProgresoCurso(modulos) })),
          catchError(() => of({ cursoId: curso.id, progreso: 0 }))
        )
      );

    if (!requests.length) {
      this.progresoPorCurso = {};
      return;
    }

    forkJoin(requests).subscribe((resultados) => {
      this.progresoPorCurso = resultados.reduce<Record<number, number>>((acc, item) => {
        acc[item.cursoId] = item.progreso;
        return acc;
      }, {});
    });
  }

  private calcularProgresoCurso(modulos: ModuloDTO[]): number {
    if (!this.usuarioId) {
      return 0;
    }

    const usuarioKey = String(this.usuarioId);
    const evaluables = modulos.filter(
      (modulo) => !!modulo.evaluacion && Array.isArray(modulo.evaluacion?.preguntas) && (modulo.evaluacion?.preguntas?.length || 0) > 0
    );

    if (!evaluables.length) {
      return 0;
    }

    const completados = evaluables.filter((modulo) => modulo.evaluacion?.progresoUsuarios?.[usuarioKey]?.completado100).length;
    return Math.round((completados / evaluables.length) * 100);
  }
}

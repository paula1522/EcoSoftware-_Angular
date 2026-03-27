import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CapacitacionDTO } from '../../../Models/capacitacion.model';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { AuthService } from '../../../auth/auth.service';
import { ModulosUsuarioPageComponent } from '../../../features/capacitaciones/pages/modulos-usuario-page.component';

@Component({
  selector: 'app-mis-capacitaciones',
  standalone: true,
  imports: [CommonModule, ModulosUsuarioPageComponent],
  templateUrl: './mis-capacitaciones.html',
  styleUrl: './mis-capacitaciones.css',
})
export class MisCapacitacionesComponent implements OnInit {
  capacitaciones: CapacitacionDTO[] = [];

  loading = false;
  error = '';

  usuarioId: number | null = null;
  capacitacionSeleccionadaId: number | null = null;

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

  abrirCurso(curso: CapacitacionDTO): void {
    if (!curso.id) {
      return;
    }

    this.capacitacionSeleccionadaId = curso.id;
  }

  volverAListaCards(): void {
    this.capacitacionSeleccionadaId = null;
  }
}

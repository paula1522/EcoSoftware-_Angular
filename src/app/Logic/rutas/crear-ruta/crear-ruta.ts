import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { RutaRecoleccionService } from '../../../Services/ruta-recoleccion';
import { RouteService, OSRMTripResponse } from '../../../Services/route.service';
import { Recoleccion } from '../../../Models/modelo-recoleccion';

@Component({
  selector: 'app-crear-ruta',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './crear-ruta.html',
  styleUrls: ['./crear-ruta.css']
})
export class CrearRuta implements OnInit {
  recoleccionesPendientes: Recoleccion[] = [];
  seleccionadas: Recoleccion[] = [];
  nombreRuta = '';
  cargando = false;
  errorMsg = '';

  mostrandoAlternativas = false;
  alternativa1: { recolecciones: Recoleccion[]; distancia: number | null; duracion: number | null } | null = null;
  alternativa2: { recolecciones: Recoleccion[]; distancia: number; duracion: number } | null = null;
  alternativaSeleccionada: 1 | 2 | null = null;

  constructor(
    private recoleccionService: RecoleccionService,
    private rutaService: RutaRecoleccionService,
    private routeService: RouteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPendientes();
  }

  cargarPendientes(): void {
    this.recoleccionService.listarPendientes().subscribe({
      next: (data) => this.recoleccionesPendientes = data,
      error: (err) => console.error(err)
    });
  }

  toggleSeleccion(rec: Recoleccion, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.seleccionadas.push(rec);
    } else {
      this.seleccionadas = this.seleccionadas.filter(r => r.idRecoleccion !== rec.idRecoleccion);
    }
  }

  drop(event: CdkDragDrop<Recoleccion[]>): void {
    moveItemInArray(this.seleccionadas, event.previousIndex, event.currentIndex);
  }

  async calcularAlternativas(): Promise<void> {
    if (this.seleccionadas.length < 2) {
      this.errorMsg = 'Selecciona al menos 2 recolecciones';
      return;
    }
    if (!this.nombreRuta.trim()) {
      this.errorMsg = 'Ingresa un nombre para la ruta';
      return;
    }

    this.cargando = true;
    this.mostrandoAlternativas = true;
    this.errorMsg = '';

    const coordsActual = this.seleccionadas.map(r => [r.solicitud.latitude, r.solicitud.longitude] as [number, number]);

    try {
      const response = await firstValueFrom(this.routeService.getRutaOptimizada(coordsActual));
      if (!response || !response.trips || response.trips.length === 0) {
        throw new Error('No se pudo calcular la ruta');
      }

      const trip = response.trips[0];
      const waypoints = response.waypoints;

      const ordenOptimizado = waypoints.map(wp => wp.waypoint_index);
      const recoleccionesOptimizadas = ordenOptimizado.map(idx => this.seleccionadas[idx]);

      const distancia = trip.distance / 1000;
      const duracion = trip.duration / 60;

      this.alternativa1 = {
        recolecciones: [...this.seleccionadas],
        distancia: null,
        duracion: null
      };
      this.alternativa2 = {
        recolecciones: recoleccionesOptimizadas,
        distancia,
        duracion
      };

      this.alternativaSeleccionada = 2;

    } catch (err) {
      console.error(err);
      this.errorMsg = 'Error al calcular rutas alternativas';
      this.mostrandoAlternativas = false;
    } finally {
      this.cargando = false;
    }
  }

  crearConAlternativa(): void {
    if (!this.alternativaSeleccionada) return;
    const recs = this.alternativaSeleccionada === 1 ? this.alternativa1!.recolecciones : this.alternativa2!.recolecciones;
    const ids = recs.map(r => r.idRecoleccion);
    this.rutaService.crearRuta({ nombre: this.nombreRuta, recoleccionIds: ids }).subscribe({
      next: () => {
        this.router.navigate(['/recolector/mis-rutas']);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al crear ruta';
      }
    });
  }

  volverASeleccion(): void {
    this.mostrandoAlternativas = false;
    this.alternativa1 = null;
    this.alternativa2 = null;
    this.alternativaSeleccionada = null;
  }
}
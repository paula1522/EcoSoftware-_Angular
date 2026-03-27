import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RutaRecoleccionService } from '../../../Services/ruta-recoleccion';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { RutaParaMapa, Parada, RutaRecoleccion } from '../../../Models/ruta-recoleccion';
import { MapaRutas } from '../mapa-rutas/mapa-rutas';
import { EstadoRecoleccion } from '../../../Models/modelo-recoleccion';

@Component({
  selector: 'app-listar-rutas',
  templateUrl: './listar-rutas.html',
  styleUrls: ['./listar-rutas.css'],
  standalone: true,
  imports: [MapaRutas, CommonModule]
})
export class ListarRutas implements OnInit {

  rutas: RutaParaMapa[] = [];
  EstadoRecoleccion = EstadoRecoleccion; // para usar en el template

  constructor(
    private rutaService: RutaRecoleccionService,
    private recoleccionService: RecoleccionService
  ) {}

  ngOnInit(): void {
    this.recargarRutas();
  }

  recargarRutas(): void {
    this.rutaService.listarTodas().subscribe({
      next: (data: RutaRecoleccion[]) => {
        this.rutas = data.map(ruta => ({
          idRuta: ruta.idRuta,
          nombre: ruta.nombre,
          estado: ruta.estado,
          distanciaTotal: ruta.distanciaTotal,
          tiempoEstimado: ruta.tiempoEstimado,
          geometriaRuta: ruta.geometriaRuta,
          paradas: ruta.paradas.map(p => ({
            recoleccionId: p.recoleccionId,
            ordenParada: p.ordenParada,
            latitud: p.latitud,
            longitud: p.longitud,
            estado: p.estado  // ya es EstadoRecoleccion
          }))
        }));
      },
      error: (err) => console.error(err)
    });
  }

  obtenerSiguienteParada(ruta: RutaParaMapa): Parada | null {
    if (!ruta.paradas) return null;
    const pendientes = ruta.paradas.filter(p => p.estado !== EstadoRecoleccion.Completada);
    if (pendientes.length === 0) return null;
    return pendientes.sort((a, b) => a.ordenParada - b.ordenParada)[0];
  }

  completarParada(parada: Parada, ruta: RutaParaMapa): void {
    if (!parada.recoleccionId) return;
    this.recoleccionService.actualizarEstado(parada.recoleccionId, EstadoRecoleccion.Completada).subscribe({
      next: () => {
        // Actualizar estado localmente
        parada.estado = EstadoRecoleccion.Completada;
        // Si ya no hay paradas pendientes, finalizar ruta
        if (this.obtenerSiguienteParada(ruta) === null) {
          this.rutaService.finalizarRuta(ruta.idRuta).subscribe({
            next: () => this.recargarRutas(),
            error: err => console.error(err)
          });
        } else {
          // Recargar para actualizar visualización
          this.recargarRutas();
        }
      },
      error: (err: any) => console.error('Error completando', err)
    });
  }

  iniciarRuta(id: number): void {
    this.rutaService.iniciarRuta(id).subscribe({
      next: () => this.recargarRutas(),
      error: (err: any) => console.error(err)
    });
  }

  finalizarRuta(id: number): void {
    this.rutaService.finalizarRuta(id).subscribe({
      next: () => this.recargarRutas(),
      error: (err: any) => console.error(err)
    });
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RutaRecoleccionService } from '../../../Services/ruta-recoleccion';
import { RutaParaMapa, Parada } from '../../../Models/ruta-recoleccion';
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
  EstadoRecoleccion = EstadoRecoleccion;

  constructor(private rutaService: RutaRecoleccionService) {}

  ngOnInit(): void {
    this.cargarRutas();
  }

  cargarRutas(): void {
    this.rutaService.listarTodas().subscribe({
      next: (data) => {
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
            estado: p.estado
          }))
        }));
      },
      error: err => console.error(err)
    });
  }
}
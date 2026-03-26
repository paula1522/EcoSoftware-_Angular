import { RutaRecoleccionService } from './../../../Services/ruta-recoleccion';
import { RutaRecoleccion } from './../../../Models/ruta-recoleccion';
import { Component } from '@angular/core';
import { MapaRutas } from '../mapa-rutas/mapa-rutas';

@Component({
  selector: 'app-listar-rutas',
  imports: [ MapaRutas],
  templateUrl: './listar-rutas.html',
  styleUrl: './listar-rutas.css',
})
export class ListarRutas {
rutas: RutaRecoleccion[] = [];

  constructor(private RutaRecoleccionService: RutaRecoleccionService) {}

  ngOnInit(): void {
    this.RutaRecoleccionService.listarTodas().subscribe(data => this.rutas = data);
  }
}

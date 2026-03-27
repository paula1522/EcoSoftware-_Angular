import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RutaRecoleccion, EstadoRuta } from '../../../Models/ruta-recoleccion';
import { RutaRecoleccionService } from '../../../Services/ruta-recoleccion';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapaRutaGestion } from '../mapa-ruta-gestion/mapa-ruta-gestion';

@Component({
  selector: 'app-recolector-rutas',
  templateUrl: './recolector-rutas.html',
  styleUrls: ['./recolector-rutas.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MapaRutaGestion]
})
export class RecolectorRutas implements OnInit {
  rutas: RutaRecoleccion[] = [];
  rutaEnGestion: number | null = null;
  mostrarModalEdicion: boolean = false;
  rutaEditando: RutaRecoleccion | null = null;

  constructor(
    private rutaService: RutaRecoleccionService,
    private recoleccionService: RecoleccionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarRutas();
  }

  cargarRutas(): void {
    this.rutaService.listarMisRutas().subscribe(data => this.rutas = data);
  }

  iniciarRuta(id: number): void {
    this.rutaService.iniciarRuta(id).subscribe({
      next: () => {
        // Solo abrimos el mapa después de confirmar que la ruta se inició
        this.rutaEnGestion = id;
      },
      error: err => console.error(err)
    });
  }

  verInfo(id: number): void {
    this.rutaEnGestion = id;
  }

  actualizarRuta(ruta: RutaRecoleccion): void {
    this.rutaEditando = { ...ruta };
    this.mostrarModalEdicion = true;
  }

  guardarEdicion(): void {
    if (this.rutaEditando) {
      this.rutaService.actualizarRuta(this.rutaEditando.idRuta, { nombre: this.rutaEditando.nombre }).subscribe({
        next: () => {
          this.mostrarModalEdicion = false;
          this.cargarRutas();
        },
        error: err => console.error(err)
      });
    }
  }

  eliminarRuta(id: number): void {
    if (confirm('¿Eliminar esta ruta?')) {
      this.rutaService.eliminarRuta(id).subscribe({
        next: () => this.cargarRutas(),
        error: err => console.error(err)
      });
    }
  }

  onRutaFinalizada(): void {
    this.rutaEnGestion = null;
    this.cargarRutas();
  }

  cerrarMapa(): void {
    this.rutaEnGestion = null;
  }
}
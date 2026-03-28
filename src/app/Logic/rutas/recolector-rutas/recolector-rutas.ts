import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RutaRecoleccion, EstadoRuta } from '../../../Models/ruta-recoleccion';
import { RutaRecoleccionService } from '../../../Services/ruta-recoleccion';
import { MapaRutaGestion } from '../mapa-ruta-gestion/mapa-ruta-gestion';
import { EstadoRecoleccion } from '../../../Models/modelo-recoleccion';

@Component({
  selector: 'app-recolector-rutas',
  templateUrl: './recolector-rutas.html',
  styleUrls: ['./recolector-rutas.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MapaRutaGestion]
})
export class RecolectorRutas implements OnInit {
  rutas: RutaRecoleccion[] = [];
  rutaSeleccionada: RutaRecoleccion | null = null;
  cargando = false;
  filtroEstado: EstadoRuta | '' = '';
  estados = Object.values(EstadoRuta);

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 6;
  paginas: number[] = [];

  // Exponer el enum para usarlo en el template (aunque aquí no se usa directamente, se necesita para la función getParadasCompletadas)
  EstadoRecoleccion = EstadoRecoleccion;

  constructor(
    private rutaService: RutaRecoleccionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarRutas();
  }

  cargarRutas(): void {
    this.cargando = true;
    this.rutaService.listarMisRutas().subscribe({
      next: (data) => {
        this.rutas = data;
        this.cargando = false;
        this.actualizarPaginas();
        // Si había una ruta seleccionada, actualizar su referencia
        if (this.rutaSeleccionada) {
          const actualizada = this.rutas.find(r => r.idRuta === this.rutaSeleccionada!.idRuta);
          this.rutaSeleccionada = actualizada || null;
        }
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  actualizarPaginas(): void {
    const total = Math.ceil(this.rutasFiltradas.length / this.itemsPorPagina);
    this.paginas = Array.from({ length: total }, (_, i) => i + 1);
    if (this.paginaActual > total) this.paginaActual = total || 1;
  }

  get rutasFiltradas(): RutaRecoleccion[] {
    let filtradas = this.filtroEstado
      ? this.rutas.filter(r => r.estado === this.filtroEstado)
      : [...this.rutas];
    // Ordenar por fecha más reciente
    filtradas.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
    return filtradas;
  }

  get rutasPaginadas(): RutaRecoleccion[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.rutasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
  }

  filtrarPorEstado(): void {
    this.paginaActual = 1;
    this.actualizarPaginas();
  }

  crearRuta(): void {
    this.router.navigate(['/recolector/crear-ruta']);
  }

  // Selecciona una ruta para mostrar en el mapa
  verRuta(id: number): void {
    const ruta = this.rutas.find(r => r.idRuta === id);
    if (ruta) {
      this.rutaSeleccionada = ruta;
    }
  }

iniciarRuta(id: number): void {
  this.rutaService.iniciarRuta(id).subscribe({
    next: () => {
      this.cargarRutas();
      if (this.rutaSeleccionada?.idRuta === id) {
        this.verRuta(id);
      }
    },
    error: (err) => console.error(err)
  });
}

  editarRuta(ruta: RutaRecoleccion): void {
    const nuevoNombre = prompt('Nuevo nombre de la ruta:', ruta.nombre);
    if (nuevoNombre && nuevoNombre.trim()) {
      this.rutaService.actualizarRuta(ruta.idRuta, { nombre: nuevoNombre }).subscribe({
        next: () => this.cargarRutas(),
        error: (err) => console.error(err)
      });
    }
  }

  eliminarRuta(id: number): void {
    if (confirm('¿Eliminar esta ruta? Esta acción no se puede deshacer.')) {
      this.rutaService.eliminarRuta(id).subscribe({
        next: () => {
          this.cargarRutas();
          if (this.rutaSeleccionada?.idRuta === id) {
            this.rutaSeleccionada = null;
          }
        },
        error: (err) => console.error(err)
      });
    }
  }

  cancelarRuta(id: number): void {
    if (confirm('¿Cancelar esta ruta? Se perderá el progreso.')) {
      this.rutaService.cancelarRuta(id).subscribe({
        next: () => {
          this.cargarRutas();
          if (this.rutaSeleccionada?.idRuta === id) {
            this.verRuta(id);
          }
        },
        error: (err:any) => console.error(err)
      });
    }
  }

  finalizarRutaDesdeMapa(): void {
    if (this.rutaSeleccionada) {
      this.rutaService.finalizarRuta(this.rutaSeleccionada.idRuta).subscribe({
        next: () => {
          this.cargarRutas();
          if (this.rutaSeleccionada) {
            this.verRuta(this.rutaSeleccionada.idRuta);
          }
        },
        error: (err) => console.error(err)
      });
    }
  }

  onRutaFinalizada(): void {
    this.cargarRutas();
    if (this.rutaSeleccionada) {
      this.verRuta(this.rutaSeleccionada.idRuta);
    }
  }

  // Calcula cuántas paradas están completadas
  getParadasCompletadas(ruta: RutaRecoleccion): number {
    return ruta.paradas?.filter(p => p.estado === EstadoRecoleccion.Completada).length || 0;
  }

  // Color del acento según estado
  accentColor(estado: string): string {
    switch (estado) {
      case 'PLANIFICADA': return '#0f9d58';
      case 'EN_PROGRESO': return '#ffb300';
      case 'FINALIZADA': return '#0f9d58';
      case 'CANCELADA': return '#dc3545';
      default: return '#6c757d';
    }
  }

  // Clase CSS para la badge
  estadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'PLANIFICADA': return 'badge-planificada';
      case 'EN_PROGRESO': return 'badge-progreso';
      case 'FINALIZADA': return 'badge-finalizada';
      case 'CANCELADA': return 'badge-cancelada';
      default: return '';
    }
  }
}
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

  // Variables para el modal de edición
mostrarModalEditar = false;
rutaEditando: RutaRecoleccion | null = null;
nuevoNombre = '';

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 2;
  paginas: number[] = [];

  // Mapa expandible
  mapaExpandido = false;

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
    if (this.paginaActual > total) this.paginaActual = Math.max(1, total);
  }

  get rutasFiltradas(): RutaRecoleccion[] {
    let filtradas = this.filtroEstado
      ? this.rutas.filter(r => r.estado === this.filtroEstado)
      : [...this.rutas];
    filtradas.sort((a, b) =>
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
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

  verRuta(id: number): void {
    const ruta = this.rutas.find(r => r.idRuta === id);
    if (ruta) {
      // Si se hace clic en la ya seleccionada, deseleccionar
      if (this.rutaSeleccionada?.idRuta === id) {
        this.rutaSeleccionada = null;
        this.mapaExpandido = false;
      } else {
        this.rutaSeleccionada = ruta;
      }
    }
  }

  iniciarRuta(id: number): void {
    this.rutaService.iniciarRuta(id).subscribe({
      next: () => {
        this.cargarRutas();
        if (this.rutaSeleccionada?.idRuta === id) this.verRuta(id);
      },
      error: (err) => console.error(err)
    });
  }

  

  eliminarRuta(id: number): void {
    if (confirm('¿Eliminar esta ruta? Esta acción no se puede deshacer.')) {
      this.rutaService.eliminarRuta(id).subscribe({
        next: () => {
          this.cargarRutas();
          if (this.rutaSeleccionada?.idRuta === id) {
            this.rutaSeleccionada = null;
            this.mapaExpandido = false;
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
          if (this.rutaSeleccionada?.idRuta === id) this.verRuta(id);
        },
        error: (err: any) => console.error(err)
      });
    }
  }

  finalizarRutaDesdeMapa(): void {
    if (this.rutaSeleccionada) {
      this.rutaService.finalizarRuta(this.rutaSeleccionada.idRuta).subscribe({
        next: () => {
          this.cargarRutas();
          if (this.rutaSeleccionada) this.verRuta(this.rutaSeleccionada.idRuta);
        },
        error: (err) => console.error(err)
      });
    }
  }

  onRutaFinalizada(): void {
    this.cargarRutas();
    if (this.rutaSeleccionada) this.verRuta(this.rutaSeleccionada.idRuta);
  }

  getParadasCompletadas(ruta: RutaRecoleccion): number {
    return ruta.paradas?.filter(p => p.estado === EstadoRecoleccion.Completada).length || 0;
  }

  accentColor(estado: string): string {
    switch (estado) {
      case 'PLANIFICADA':  return '#22c55e';
      case 'EN_PROGRESO':  return '#f59e0b';
      case 'FINALIZADA':   return '#3b82f6';
      case 'CANCELADA':    return '#ef4444';
      default:             return '#94a3b8';
    }
  }

  estadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'PLANIFICADA':  return 'badge-planificada';
      case 'EN_PROGRESO':  return 'badge-progreso';
      case 'FINALIZADA':   return 'badge-finalizada';
      case 'CANCELADA':    return 'badge-cancelada';
      default:             return '';
    }
  }





// Método para abrir el modal de edición
editarRuta(ruta: RutaRecoleccion): void {
  this.rutaEditando = ruta;
  this.nuevoNombre = ruta.nombre;
  this.mostrarModalEditar = true;
}

// Método para cerrar el modal
cerrarModalEditar(): void {
  this.mostrarModalEditar = false;
  this.rutaEditando = null;
  this.nuevoNombre = '';
}

// Método para guardar la edición
guardarEdicion(): void {
  if (!this.rutaEditando) return;
  if (!this.nuevoNombre.trim()) {
    alert('El nombre no puede estar vacío');
    return;
  }

  this.rutaService.actualizarRuta(this.rutaEditando.idRuta, { nombre: this.nuevoNombre }).subscribe({
    next: () => {
      this.cargarRutas();
      this.cerrarModalEditar();
    },
    error: (err) => console.error(err)
  });
}
}
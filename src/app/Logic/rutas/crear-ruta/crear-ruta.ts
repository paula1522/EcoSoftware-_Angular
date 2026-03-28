import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { RutaRecoleccionService } from '../../../Services/ruta-recoleccion';

@Component({
  selector: 'app-crear-ruta',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './crear-ruta.html',
  styleUrls: ['./crear-ruta.css']
})
export class CrearRuta implements OnInit {
  recoleccionesPendientes: any[] = [];
  seleccionadas: any[] = [];
  nombreRuta = '';
  cargando = false;
  errorMsg = '';
    mensajeExito = '';


  constructor(
    private recoleccionService: RecoleccionService,
    private rutaService: RutaRecoleccionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPendientes();
  }

  cargarPendientes(): void {
    this.cargando = true;
    this.recoleccionService.listarPendientes().subscribe({
      next: (data) => {
        console.log('Datos recibidos (crear-ruta):', data);
        this.recoleccionesPendientes = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Error al cargar las recolecciones pendientes.';
        this.cargando = false;
      }
    });
  }

  /** Texto a mostrar para cada recolección */
  obtenerTexto(rec: any): string {
    if (rec?.direccion) return rec.direccion;
    if (rec?.solicitud?.direccion) return rec.solicitud.direccion;
    if (rec?.solicitud?.ubicacion) return rec.solicitud.ubicacion;
    return `Recolección #${rec?.idRecoleccion ?? '?'}`;
  }

  /** Verifica si una recolección está seleccionada */
  estaSeleccionada(rec: any): boolean {
    return this.seleccionadas.some(s => s.idRecoleccion === rec.idRecoleccion);
  }

  /** Toggle al hacer clic directo en el item (sin necesitar el evento del checkbox) */
  toggleSeleccionClick(rec: any): void {
    this.errorMsg = '';
    if (this.estaSeleccionada(rec)) {
      this.seleccionadas = this.seleccionadas.filter(
        r => r.idRecoleccion !== rec.idRecoleccion
      );
    } else {
      this.seleccionadas.push(rec);
    }
  }

  /** Quitar una recolección desde el panel de orden */
  quitarSeleccion(rec: any): void {
    this.seleccionadas = this.seleccionadas.filter(
      r => r.idRecoleccion !== rec.idRecoleccion
    );
  }

  /** Limpiar toda la selección */
  limpiarSeleccion(): void {
    this.seleccionadas = [];
    this.errorMsg = '';
  }

  /** CDK drag & drop */
  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(this.seleccionadas, event.previousIndex, event.currentIndex);
  }

  /** Crear la ruta */

crearRuta(): void {
  if (this.seleccionadas.length < 2) {
    this.errorMsg = 'Selecciona al menos 2 recolecciones.';
    return;
  }
  if (!this.nombreRuta.trim()) {
    this.errorMsg = 'Ingresa un nombre para la ruta.';
    return;
  }

  this.errorMsg = '';
  this.mensajeExito = '';
  const ids = this.seleccionadas.map(r => r.idRecoleccion);
  this.cargando = true;

  this.rutaService.crearRuta({ nombre: this.nombreRuta, recoleccionIds: ids }).subscribe({
    next: () => {
      this.mensajeExito = '¡Ruta creada exitosamente!';
      // Opcional: limpiar selección y nombre para crear otra
      this.seleccionadas = [];
      this.nombreRuta = '';
      this.cargando = false;
      // Después de 3 segundos, opcionalmente limpiar mensaje
      setTimeout(() => this.mensajeExito = '', 3000);
    },
    error: (err) => {
      console.error(err);
      this.errorMsg = err.error?.message || 'Error al crear la ruta. Inténtalo de nuevo.';
      this.cargando = false;
    }
  });
}
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tabla } from '../../../shared/tabla/tabla';
import { ColumnaTabla } from '../../../shared/tabla/tabla';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { ModeloRecoleccion } from '../../../Models/modelo-recoleccion';
import { AuthService } from '../../../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-listar-por-recolector',
  standalone: true,
  imports: [CommonModule, Tabla],
  templateUrl: './listar-por-recolector.html',
  styleUrls: ['./listar-por-recolector.css']
})
export class ListarPorRecolector implements OnInit, OnDestroy {
  
  columnas: ColumnaTabla[] = [
    { campo: 'idRecoleccion', titulo: 'ID' },
    { campo: 'solicitudId', titulo: 'Solicitud ID' },
    { campo: 'recolectorId', titulo: 'Recolector ID' },
    { campo: 'estado', titulo: 'Estado' },
    { campo: 'fechaRecoleccion', titulo: 'Fecha Recolección' },
    { campo: 'observaciones', titulo: 'Observaciones' },
    
  ];

  data: ModeloRecoleccion[] = [];
  cargando = true;
  error = '';
  idRecolector: number | null = null;
  private subscription?: Subscription;

  constructor(
    private recoleccionService: RecoleccionService, 
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.obtenerRecolecciones();
  }

  obtenerRecolecciones(): void {
    this.cargando = true;
    this.error = '';
    
    // Obtener el ID del recolector autenticado
    this.idRecolector = this.authService.getUserId();
    
    if (!this.idRecolector) {
      this.error = 'No se pudo identificar al recolector. Por favor, inicie sesión nuevamente.';
      this.cargando = false;
      return;
    }

    // Llamar al servicio para obtener las recolecciones
    this.subscription = this.recoleccionService.listarTodasMisRecolecciones(this.idRecolector)
      .subscribe({
        next: (res: ModeloRecoleccion[]) => {
          this.data = this.formatearDatos(res);
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar recolecciones:', err);
          this.error = 'Error al cargar las recolecciones. Por favor, intente nuevamente.';
          this.cargando = false;
        }
      });
  }

  // Formatear los datos para la tabla
  formatearDatos(recolecciones: ModeloRecoleccion[]): any[] {
    return recolecciones.map(recoleccion => ({
      ...recoleccion,
      // Formatear fecha si es necesario
      fechaRecoleccion: recoleccion.fechaRecoleccion 
        ? new Date(recoleccion.fechaRecoleccion).toLocaleDateString('es-ES')
        : 'Sin fecha'
    }));
  }

  // Acciones de la tabla
  ver(item: ModeloRecoleccion) {
    console.log("VER recolección:", item);
    // Aquí puedes implementar la navegación o modal para ver detalles
    // Ejemplo: this.router.navigate(['/recolecciones', item.idRecoleccion]);
  }

  editar(item: ModeloRecoleccion) {
    console.log("EDITAR recolección:", item);
    // Aquí puedes implementar la edición
    // Ejemplo: this.router.navigate(['/recolecciones/editar', item.idRecoleccion]);
  }

  eliminar(item: ModeloRecoleccion) {
    console.log("ELIMINAR recolección:", item);
    // Aquí puedes implementar confirmación y eliminación
    if (confirm(`¿Está seguro de eliminar la recolección ${item.idRecoleccion}?`)) {
      this.recoleccionService.eliminarLogicamente(item.idRecoleccion!).subscribe({
        next: () => {
          console.log('Recolección eliminada');
          // Recargar la lista
          this.obtenerRecolecciones();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          this.error = 'Error al eliminar la recolección';
        }
      });
    }
  }

  // Para reintentar la carga
  reintentar(): void {
    this.obtenerRecolecciones();
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
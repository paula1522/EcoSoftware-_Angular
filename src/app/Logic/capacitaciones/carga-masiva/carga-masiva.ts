import { Component, ViewChild, TemplateRef } from '@angular/core';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { Capacitacion, UploadResultDto } from '../../../Models/capacitacion.model';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-carga-masiva-capacitacion',
  standalone: true,
  templateUrl: './carga-masiva.html',
  imports: [COMPARTIR_IMPORTS, CommonModule, FormsModule],
})
export class CargaMasiva {

  archivoSeleccionado: File | null = null;
  mensaje: string = '';
  cargando = false;

  // Resultado de validación
  errores: Capacitacion[] = [];
  avisos: Capacitacion[] = [];

  // Para mostrar detalle seleccionado (opcional)
  detalleSeleccionado: Capacitacion | null = null;

  @ViewChild('modalErrores') modalErrores!: TemplateRef<any>;
  @ViewChild('modalAvisos') modalAvisos!: TemplateRef<any>;

  constructor(
    private service: CapacitacionesService,
    private modalService: NgbModal
  ) {}

  // usuario selecciona archivo
  onFileSelected(event: any): void {
    this.archivoSeleccionado = event.target.files?.[0] ?? null;
    this.mensaje = '';
  }

  // validar primero (no subir todavía)
  validarYMostrar(): void {
    if (!this.archivoSeleccionado) {
      this.mensaje = 'Seleccione un archivo Excel.';
      return;
    }

    this.cargando = true;
    this.service.validarExcel(this.archivoSeleccionado).subscribe({
      next: (lista) => {
        // lista contiene DTOs con campo observacion: ERROR | WARNING
        this.errores = lista.filter(i => i.observacion?.startsWith('ERROR'));
        this.avisos  = lista.filter(i => i.observacion?.startsWith('WARNING'));

        if (this.errores.length > 0) {
          // mostrar modal bloqueante con detalles de errores
          this.modalService.open(this.modalErrores, { size: 'xl', backdrop: 'static' });
        } else if (this.avisos.length > 0) {
          // mostrar modal de warnings con opción continuar/abort
          this.modalService.open(this.modalAvisos, { size: 'lg', backdrop: 'static' });
        } else {
          // No hay problemas: subir directamente
          this.subirExcel();
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error validarExcel', err);
        this.mensaje = 'Error al validar el archivo. Revisa el archivo o el backend.';
        this.cargando = false;
      }
    });
  }

  // sube el archivo al endpoint cargar-excel
  private subirExcel(): void {
    if (!this.archivoSeleccionado) {
      this.mensaje = 'Seleccione un archivo.';
      return;
    }

    this.cargando = true;
    this.service.cargarCapacitacionesDesdeExcel(this.archivoSeleccionado).subscribe({
      next: (res: UploadResultDto) => {
        this.mensaje = res.mensaje || 'Carga finalizada correctamente.';
        // si backend devolvió avisos no bloqueantes, podemos mostrarlos en modal o toast
        if (res.avisos && res.avisos.length > 0) {
          this.avisos = res.avisos;
          // mostrar modal de avisos (informativo)
          this.modalService.open(this.modalAvisos, { size: 'lg' });
        }
        this.cargando = false;
      },
      error: (err) => {
        // manejo del 400 con lista de duplicadas enviada por el backend
        console.error('Error cargarExcel', err);
        if (err && err.status === 400 && err.error) {
          // varios backends devuelven la lista en err.error.duplicadas o err.error.duplidadas
          const duplicadas = err.error.duplicadas ?? err.error.duplicados ?? err.error;
          if (Array.isArray(duplicadas)) {
            this.errores = duplicadas;
            this.modalService.open(this.modalErrores, { size: 'xl', backdrop: 'static' });
            this.cargando = false;
            return;
          } else if (err.error && err.error.mensaje) {
            this.mensaje = err.error.mensaje;
            this.cargando = false;
            return;
          }
        }

        this.mensaje = 'Error al subir el archivo. Ver consola para más detalles.';
        this.cargando = false;
      }
    });
  }

  // Continuar carga cuando solo había warnings
  continuarConWarnings(): void {
    this.modalService.dismissAll();
    this.subirExcel();
  }

  // Abortar (cerrar modal y limpiar)
  abortarCarga(): void {
    this.modalService.dismissAll();
    this.mensaje = 'Carga abortada por el usuario.';
    this.errores = [];
    this.avisos = [];
  }

  // Helper para mostrar detalles en modal o console
  verDetalle(item: Capacitacion) {
    this.detalleSeleccionado = item;
  }

  // Para descargar plantilla
  descargarPlantilla(): void {
    this.service.generarPlantillaExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_capacitaciones.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.mensaje = 'Plantilla descargada.';
      },
      error: (err) => {
        console.error('Error plantilla', err);
        this.mensaje = 'Error al descargar la plantilla.';
      }
    });
  }
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { Capacitacion } from '../../../Models/capacitacion.model';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { Tabla, ColumnaTabla } from '../../../shared/tabla/tabla';
import { Modal } from '../../../shared/modal/modal';
import { FormGroup, FormControl } from '@angular/forms';
import { FieldConfig, FormComp } from '../../../shared/form/form.comp/form.comp';
import { Boton } from '../../../shared/botones/boton/boton';

@Component({
  selector: 'app-listar-capacitaciones',
  standalone: true,
  imports: [COMPARTIR_IMPORTS, Tabla, Modal, FormComp, Boton],
  templateUrl: './listar-capacitaciones.html',
  styleUrl: './listar-capacitaciones.css'
})
export class CapacitacionesLista implements OnInit {

  columnas: ColumnaTabla[] = [
    { campo: 'id', titulo: 'ID' },
    { campo: 'nombre', titulo: 'Título' },
    { campo: 'descripcion', titulo: 'Descripción' },
    { campo: 'numeroDeClases', titulo: '# Clases' },
    { campo: 'duracion', titulo: 'Duración' },
  ];

  data: Capacitacion[] = [];

  cargando = true;
  error = '';
  @ViewChild('modalVerCapacitacion') modalVerCapacitacion!: Modal;
  @ViewChild('modalEditarCapacitacion') modalEditarCapacitacion!: Modal;
  @ViewChild('modalEliminarCapacitacion') modalEliminarCapacitacion!: Modal;

  selectedCapacitacion: Capacitacion | undefined;
  formEditarCapacitacion: FormGroup = new FormGroup({});
  fieldsEditarCapacitacion: FieldConfig[] = [];
  capacitacionSeleccionada: Capacitacion | undefined;
  imagenEditFile: File | null = null;
  imagenPreviewEdit: string | null = null;

  nombreFilter = '';
numeroClasesFilter: number | '' = '';
duracionFilter= '';

  constructor(private capacitacionesService: CapacitacionesService) {}

  ngOnInit(): void {
    this.cargarCapacitaciones();
  }


  cargarCapacitaciones(): void {
    this.capacitacionesService.listarTodasCapacitaciones().subscribe({
      next: (capacitaciones) => {
        this.data = capacitaciones;
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar capacitaciones';
        this.cargando = false;
      }
    });
  }
  // 🔵 EVENTOS DEL COMPONENTE ---------------------

  abrirModalVerCapacitacion(capacitacion: Capacitacion) {
    this.selectedCapacitacion = capacitacion;
    this.modalVerCapacitacion.isOpen = true;
  }

  editar(item: Capacitacion) {
    this.capacitacionSeleccionada = item;
    this.initFormEditarCapacitacion(item);
    this.imagenEditFile = null;
    this.imagenPreviewEdit = item.imagen ?? null;
    this.modalEditarCapacitacion.isOpen = true;
  }

  cerrarModalEditarCapacitacion() {
    this.modalEditarCapacitacion.close();
    this.capacitacionSeleccionada = undefined;
    this.formEditarCapacitacion.reset();
    this.imagenEditFile = null;
    this.imagenPreviewEdit = null;
  }

  onImagenEditarSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen.');
      input.value = '';
      this.imagenEditFile = null;
      return;
    }

    this.imagenEditFile = file;
    this.imagenPreviewEdit = URL.createObjectURL(file);
  }

  initFormEditarCapacitacion(capacitacion?: Capacitacion) {
    this.fieldsEditarCapacitacion = [
      { type: 'text', name: 'nombre', label: 'Nombre', placeholder: 'Nombre', cols: 6 },
      { type: 'text', name: 'descripcion', label: 'Descripción', placeholder: 'Descripción', cols: 12 },
      { type: 'text', name: 'numeroDeClases', label: 'Número de Clases', placeholder: 'Clases', cols: 6 },
      { type: 'text', name: 'duracion', label: 'Duración', placeholder: 'Duración', cols: 6 }
    ];
    const group: any = {};
    this.fieldsEditarCapacitacion.forEach(f => {
      group[f.name!] = new FormControl(capacitacion ? (capacitacion as any)[f.name!] ?? '' : '');
    });
    this.formEditarCapacitacion = new FormGroup(group);
  }

  actualizarCapacitacion() {
    if (!this.capacitacionSeleccionada?.id) return;
    if (this.formEditarCapacitacion.invalid) return;
    const datosActualizados = {
      ...this.capacitacionSeleccionada,
      ...this.formEditarCapacitacion.value
    };
    this.capacitacionesService.actualizarCapacitacion(this.capacitacionSeleccionada.id, datosActualizados).subscribe({
      next: () => {
        if (this.imagenEditFile) {
          this.capacitacionesService.subirImagenCapacitacion(this.capacitacionSeleccionada!.id!, this.imagenEditFile).subscribe({
            next: () => {
              this.cerrarModalEditarCapacitacion();
              this.cargarCapacitaciones();
            },
            error: () => alert('Se actualizó la capacitación, pero falló la actualización de imagen')
          });
          return;
        }

        this.cerrarModalEditarCapacitacion();
        this.cargarCapacitaciones();
      },
      error: () => alert('Error al actualizar la capacitación')
    });
  }

  eliminar(item: Capacitacion) {
    this.capacitacionSeleccionada = item;
    this.modalEliminarCapacitacion.isOpen = true;
  }

  confirmarEliminarCapacitacion() {
    if (!this.capacitacionSeleccionada?.id) return;
    this.capacitacionesService.eliminarCapacitacion(this.capacitacionSeleccionada.id).subscribe({
      next: () => {
        this.modalEliminarCapacitacion.close();
        this.capacitacionSeleccionada = undefined;
        this.cargarCapacitaciones();
      },
      error: () => alert('Error al eliminar la capacitación')
    });
  }

  cerrarModalEliminarCapacitacion() {
    this.modalEliminarCapacitacion.close();
    this.capacitacionSeleccionada = undefined;
  }

  exportarCapacitaciones() {
    console.log("EXPORTAR");
  }


aplicarFiltros() {
  let resultados = [...this.data];

  // Filtrar por nombre
  if (this.nombreFilter && this.nombreFilter.trim() !== '') {
    const nombre = this.nombreFilter.trim().toLowerCase();
    resultados = resultados.filter(c => c.nombre?.toLowerCase().includes(nombre));
  }

  // Filtrar por número de clases (como string)
  if (this.numeroClasesFilter !== '' && this.numeroClasesFilter !== null) {
    const numClasesStr = this.numeroClasesFilter.toString();
    resultados = resultados.filter(c => c.numeroDeClases === numClasesStr);
  }

  // Filtrar por duración
  if (this.duracionFilter && this.duracionFilter.trim() !== '') {
    const duracion = this.duracionFilter.trim().toLowerCase();
    resultados = resultados.filter(c => c.duracion?.toLowerCase().includes(duracion));
  }

  this.data = resultados;
}

limpiarFiltros() {
  this.nombreFilter = '';
  this.numeroClasesFilter = '';
  this.duracionFilter = '';
  this.cargarCapacitaciones();
}
}

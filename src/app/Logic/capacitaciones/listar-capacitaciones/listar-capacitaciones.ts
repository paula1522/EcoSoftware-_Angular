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
    this.modalEditarCapacitacion.isOpen = true;
  }

  cerrarModalEditarCapacitacion() {
    this.modalEditarCapacitacion.close();
    this.capacitacionSeleccionada = undefined;
    this.formEditarCapacitacion.reset();
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
}

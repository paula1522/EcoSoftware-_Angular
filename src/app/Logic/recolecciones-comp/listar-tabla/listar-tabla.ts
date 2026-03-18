import { Component, ViewChild } from '@angular/core';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { ModeloRecoleccion } from '../../../Models/modelo-recoleccion';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { ColumnaTabla, Tabla } from '../../../shared/tabla/tabla';
import { Modal } from '../../../shared/modal/modal';
import { FormGroup, FormControl } from '@angular/forms';
import { FieldConfig } from '../../../shared/form/form.comp/form.comp';
import { Boton } from '../../../shared/botones/boton/boton';
import { FormComp } from '../../../shared/form/form.comp/form.comp';

@Component({
  selector: 'app-listar-tabla',
  imports: [COMPARTIR_IMPORTS, Tabla, Modal, FormComp, Boton],
  templateUrl: './listar-tabla.html',
  styleUrls: ['./listar-tabla.css'] // Corrige aquí
})
export class ListarTabla {

  columnas: ColumnaTabla[] = [
    { campo: 'idRecoleccion', titulo: 'ID' },
    { campo: 'solicitudId', titulo: 'Solicitud' },
    { campo: 'recolectorId', titulo: 'Recolector' },
    { campo: 'rutaId', titulo: 'Ruta' },
    { campo: 'estado', titulo: 'Estado' },
    { campo: 'fechaRecoleccion', titulo: 'Fecha Recolección' },
    { campo: 'observaciones', titulo: 'Observaciones' }
  ];

  data: ModeloRecoleccion[] = [];
  cargando = true;
  error = '';

  @ViewChild('modalVerRecoleccion') modalVerRecoleccion!: Modal;
  selectedRecoleccion: ModeloRecoleccion | null = null;

  @ViewChild('modalEditarRecoleccion') modalEditarRecoleccion!: Modal;
  formEditarRecoleccion: FormGroup = new FormGroup({});
  fieldsEditarRecoleccion: FieldConfig[] = [];

  @ViewChild('modalEliminarRecoleccion') modalEliminarRecoleccion!: Modal;

  constructor(private recoleccionService: RecoleccionService) {}

  ngOnInit() {
    this.recoleccionService.listarActivas().subscribe({
      next: (res) => {
        this.data = res;
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar las recolecciones activas';
        this.cargando = false;
      }
    });
  }

  ver(item: ModeloRecoleccion) {
    this.selectedRecoleccion = item;
    this.modalVerRecoleccion.isOpen = true;
  }

  editar(item: any) {
    this.selectedRecoleccion = item;
    this.initFormEditarRecoleccion(item);
    this.modalEditarRecoleccion.isOpen = true;
  }

  cerrarModalEditarRecoleccion(): void {
    this.modalEditarRecoleccion.close();
    this.selectedRecoleccion = null;
    this.formEditarRecoleccion.reset();
  }

  initFormEditarRecoleccion(recoleccion?: any) {
    this.fieldsEditarRecoleccion = [
      { type: 'date', name: 'fechaRecoleccion', label: 'Fecha de recolección', cols: 6 },
      { type: 'text', name: 'observaciones', label: 'Observaciones', placeholder: 'Observaciones', cols: 12 }
    ];
    const group: any = {};
    this.fieldsEditarRecoleccion.forEach(f => {
      group[f.name!] = new FormControl(recoleccion ? recoleccion[f.name!] ?? '' : '');
    });
    this.formEditarRecoleccion = new FormGroup(group);
  }

  actualizarRecoleccion(): void {
    if (!this.selectedRecoleccion?.idRecoleccion) return;
    if (this.formEditarRecoleccion.invalid) return;
    const datosActualizados = {
      ...this.selectedRecoleccion,
      ...this.formEditarRecoleccion.value
    };
    this.recoleccionService.actualizarRecoleccion(this.selectedRecoleccion.idRecoleccion, datosActualizados).subscribe({
      next: () => {
        alert('Recolección actualizada correctamente');
        this.cerrarModalEditarRecoleccion();
        this.ngOnInit();
      },
      error: () => {
        alert('Error al actualizar la recolección');
      }
    });
  }

  eliminar(item: ModeloRecoleccion) {
    this.selectedRecoleccion = item;
    this.modalEliminarRecoleccion.isOpen = true;
  }

  confirmarEliminarRecoleccion() {
    if (!this.selectedRecoleccion?.idRecoleccion) return;
    this.recoleccionService.eliminarLogicamente(this.selectedRecoleccion.idRecoleccion).subscribe({
      next: () => {
        this.modalEliminarRecoleccion.close();
        this.selectedRecoleccion = null;
        this.ngOnInit();
      },
      error: () => alert('Error al eliminar la recolección')
    });
  }

  cerrarModalEliminarRecoleccion() {
    this.modalEliminarRecoleccion.close();
    this.selectedRecoleccion = null;
  }

  // Métodos para enlazar con la tabla
  onVer = (item: ModeloRecoleccion) => this.ver(item);
  onEditar = (item: ModeloRecoleccion) => this.editar(item);
  onEliminar = (item: ModeloRecoleccion) => this.eliminar(item);
}

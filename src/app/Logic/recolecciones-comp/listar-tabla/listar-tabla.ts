import { Component, ViewChild, OnInit } from '@angular/core';
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
  standalone: true,
  imports: [COMPARTIR_IMPORTS, Tabla, Modal, FormComp, Boton],
  templateUrl: './listar-tabla.html',
  styleUrls: ['./listar-tabla.css']
})
export class ListarTabla implements OnInit {

  columnas: ColumnaTabla[] = [
    { campo: 'idRecoleccion', titulo: 'ID' },
    { campo: 'solicitudId', titulo: 'Solicitud' },
    { campo: 'recolectorId', titulo: 'Recolector' },
    { campo: 'fechaRecoleccion', titulo: 'Fecha' },
    { campo: 'observaciones', titulo: 'Observaciones' },
    { campo: 'estado', titulo: 'Estado' }
  ];

  data: ModeloRecoleccion[] = [];
  todasLasRecolecciones: ModeloRecoleccion[] = [];

  cargando = true;
  error = '';

  // FILTROS
  estadoFilter = '';
  recolectorFilter = '';
  fechaDesde = '';
  fechaHasta = '';

  @ViewChild('modalVerRecoleccion') modalVerRecoleccion!: Modal;
  @ViewChild('modalEditarRecoleccion') modalEditarRecoleccion!: Modal;
  @ViewChild('modalEliminarRecoleccion') modalEliminarRecoleccion!: Modal;

  selectedRecoleccion: ModeloRecoleccion | null = null;

  formEditarRecoleccion: FormGroup = new FormGroup({});
  fieldsEditarRecoleccion: FieldConfig[] = [];

  constructor(private service: RecoleccionService) {}

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.service.listarTodas().subscribe({
      next: (res) => {
        this.todasLasRecolecciones = res.map(r => ({
          ...r,
          observaciones: r.observaciones ?? '',
          evidencia: r.evidencia ?? ''
        }));
        this.data = [...this.todasLasRecolecciones];
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar las recolecciones';
        this.cargando = false;
      }
    });
  }

  // =========================
  // TEMPLATES
  // =========================
  cellTemplates = {
    estado: (item: ModeloRecoleccion): string => {
      let clase = '';
      let icono = '';

      switch (item.estado) {
        case 'Pendiente':
          clase = 'status-pendiente';
          icono = 'bi bi-clock';
          break;
        case 'En_Progreso':
          clase = 'status-proceso';
          icono = 'bi bi-truck';
          break;
        case 'Completada':
          clase = 'status-aceptada';
          icono = 'bi bi-check-circle-fill';
          break;
        case 'Fallida':
          clase = 'status-fallida';
          icono = 'bi bi-x-circle-fill';
          break;
        case 'Cancelada':
          clase = 'status-cancelada';
          icono = 'bi bi-slash-circle-fill';
          break;
      }

      return `
        <span class="status-badge ${clase}">
          <i class="${icono} me-1"></i> ${item.estado}
        </span>
      `;
    },

    fechaRecoleccion: (item: ModeloRecoleccion): string => {
      if (!item.fechaRecoleccion) return 'Sin fecha';
      return new Date(item.fechaRecoleccion).toLocaleString('es-CO', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    },

    observaciones: (item: ModeloRecoleccion): string => {
      return item.observaciones
        ? item.observaciones
        : '<span class="text-muted">Sin observaciones</span>';
    }
  };

  // =========================
  // FILTROS
  // =========================
  aplicarFiltros() {
    let r = [...this.todasLasRecolecciones];

    if (this.estadoFilter) r = r.filter(x => x.estado === this.estadoFilter);
    if (this.recolectorFilter) r = r.filter(x =>
      x.recolectorId && String(x.recolectorId).includes(this.recolectorFilter)
    );
    if (this.fechaDesde) {
      const desde = new Date(this.fechaDesde);
      r = r.filter(x => x.fechaRecoleccion && new Date(x.fechaRecoleccion) >= desde);
    }
    if (this.fechaHasta) {
      const hasta = new Date(this.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      r = r.filter(x => x.fechaRecoleccion && new Date(x.fechaRecoleccion) <= hasta);
    }

    this.data = r;
  }

  limpiarFiltros() {
    this.estadoFilter = '';
    this.recolectorFilter = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.data = [...this.todasLasRecolecciones];
  }

  // =========================
  // MODALES
  // =========================
  ver(item: ModeloRecoleccion) {
    this.selectedRecoleccion = item;
    this.modalVerRecoleccion.isOpen = true;
  }

  editar(item: ModeloRecoleccion) {
    this.selectedRecoleccion = item;
    this.initForm(item);
    this.modalEditarRecoleccion.isOpen = true;
  }

  eliminar(item: ModeloRecoleccion) {
    this.selectedRecoleccion = item;
    this.modalEliminarRecoleccion.isOpen = true;
  }

  cerrarModalEliminarRecoleccion() {
    this.modalEliminarRecoleccion.close();
    this.selectedRecoleccion = null;
  }

  confirmarEliminarRecoleccion() {
    if (!this.selectedRecoleccion?.idRecoleccion) return;

    this.service.eliminarLogicamente(this.selectedRecoleccion.idRecoleccion)
      .subscribe({
        next: () => {
          this.modalEliminarRecoleccion.close();
          this.cargarDatos();
        },
        error: (err) => alert(err.error?.message || 'No se pudo eliminar')
      });
  }

  // =========================
  // EDITAR
  // =========================
  initForm(r?: ModeloRecoleccion) {
    this.fieldsEditarRecoleccion = [
      { type: 'date', name: 'fechaRecoleccion', label: 'Fecha', cols: 6 },
      { type: 'text', name: 'observaciones', label: 'Observaciones', cols: 12 }
    ];

    const group: any = {};
    this.fieldsEditarRecoleccion.forEach(f => {
      group[f.name!] = new FormControl(
        r && f.name === 'fechaRecoleccion'
          ? r.fechaRecoleccion?.split('T')[0]
          : r ? (r as any)[f.name!] : ''
      );
    });

    this.formEditarRecoleccion = new FormGroup(group);
  }

  actualizarRecoleccion() {
    if (!this.selectedRecoleccion?.idRecoleccion) return;

    const formValue = this.formEditarRecoleccion.value;
    const dto: Partial<ModeloRecoleccion> = {
fechaRecoleccion: formValue.fechaRecoleccion
  ? `${formValue.fechaRecoleccion}:00`
  : undefined,      observaciones: formValue.observaciones
    };

    console.log('📤 ENVIANDO DTO:', dto);

    this.service.actualizarRecoleccion(this.selectedRecoleccion.idRecoleccion, dto)
      .subscribe({
        next: () => {
          this.modalEditarRecoleccion.close();
          this.cargarDatos();
        },
        error: (err) => {
          console.error('❌ ERROR REAL:', err);
          alert(err.error?.message || 'Error al actualizar');
        }
      });
  }

  // =========================
  // EVENTOS TABLA
  // =========================
  onVer = (item: ModeloRecoleccion) => this.ver(item);
  onEditar = (item: ModeloRecoleccion) => this.editar(item);
  onEliminar = (item: ModeloRecoleccion) => this.eliminar(item);

}
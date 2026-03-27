import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { ModeloRecoleccion, EstadoRecoleccion } from '../../../Models/modelo-recoleccion';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { ColumnaTabla, Tabla } from '../../../shared/tabla/tabla';
import { Modal } from '../../../shared/modal/modal';
import { FormGroup, FormControl } from '@angular/forms';
import { FieldConfig } from '../../../shared/form/form.comp/form.comp';
import { Boton } from '../../../shared/botones/boton/boton';
import { FormComp } from '../../../shared/form/form.comp/form.comp';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-listar-tabla',
  standalone: true,
  imports: [COMPARTIR_IMPORTS, Tabla, Modal, FormComp, Boton],
  templateUrl: './listar-tabla.html',
  styleUrls: ['./listar-tabla.css']
})
export class ListarTabla implements OnInit, OnDestroy {

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
  fechaDesde = '';
  fechaHasta = '';

  @ViewChild('modalVerRecoleccion') modalVerRecoleccion!: Modal;
  @ViewChild('modalEditarRecoleccion') modalEditarRecoleccion!: Modal;
  @ViewChild('modalEliminarRecoleccion') modalEliminarRecoleccion!: Modal;

  selectedRecoleccion: ModeloRecoleccion | null = null;

  formEditarRecoleccion: FormGroup = new FormGroup({});
  fieldsEditarRecoleccion: FieldConfig[] = [];

  // Acciones de la tabla con condiciones de visibilidad
  acciones = [
    {
      icono: 'bi bi-eye',
      titulo: 'Ver',
      metodo: (item: ModeloRecoleccion) => this.ver(item),
      visible: () => true // Siempre visible
    },
    {
      icono: 'bi bi-pencil',
      titulo: 'Editar',
      metodo: (item: ModeloRecoleccion) => this.editar(item),
      visible: (item: ModeloRecoleccion) => item.estado === EstadoRecoleccion.Pendiente
    },
    {
      icono: 'bi bi-trash',
      titulo: 'Eliminar',
      metodo: (item: ModeloRecoleccion) => this.eliminar(item),
      visible: (item: ModeloRecoleccion) => item.estado === EstadoRecoleccion.Pendiente
    }
  ];

  private subscriptions: Subscription[] = [];

  constructor(private service: RecoleccionService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  cargarDatos() {
    this.cargando = true;
    const sub = this.service.listarTodas().subscribe({
      next: (res) => {
        this.todasLasRecolecciones = res.map(r => ({
          ...r,
          observaciones: r.observaciones ?? '',
          evidencia: r.evidencia ?? ''
        }));
        this.data = [...this.todasLasRecolecciones];
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las recolecciones';
        console.error(err);
        this.cargando = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // =========================
  // TEMPLATES PARA CELDAS PERSONALIZADAS
  // =========================
  cellTemplates = {
    estado: (item: ModeloRecoleccion): string => {
      let clase = '';
      let icono = '';

      switch (item.estado) {
        case EstadoRecoleccion.Pendiente:
          clase = 'status-pendiente';
          icono = 'bi bi-clock';
          break;
        case EstadoRecoleccion.En_Progreso:
          clase = 'status-proceso';
          icono = 'bi bi-truck';
          break;
        case EstadoRecoleccion.Completada:
          clase = 'status-aceptada';
          icono = 'bi bi-check-circle-fill';
          break;
        case EstadoRecoleccion.Fallida:
          clase = 'status-fallida';
          icono = 'bi bi-x-circle-fill';
          break;
        case EstadoRecoleccion.Cancelada:
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
    
    if (this.fechaDesde) {
      const desde = new Date(this.fechaDesde);
      desde.setHours(0,0,0,0);
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
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.data = [...this.todasLasRecolecciones];
  }

  // =========================
  // ACCIONES
  // =========================
  ver(item: ModeloRecoleccion) {
    this.selectedRecoleccion = item;
    this.modalVerRecoleccion.isOpen = true;
  }

  editar(item: ModeloRecoleccion) {
    if (item.estado !== EstadoRecoleccion.Pendiente) {
      alert('Solo se pueden editar recolecciones en estado Pendiente.');
      return;
    }
    this.selectedRecoleccion = item;
    this.initForm(item);
    this.modalEditarRecoleccion.isOpen = true;
  }

  eliminar(item: ModeloRecoleccion) {
    if (item.estado !== EstadoRecoleccion.Pendiente) {
      alert('Solo se pueden eliminar recolecciones en estado Pendiente.');
      return;
    }
    this.selectedRecoleccion = item;
    this.modalEliminarRecoleccion.isOpen = true;
  }

  cerrarModalEliminarRecoleccion() {
    this.modalEliminarRecoleccion.close();
    this.selectedRecoleccion = null;
  }

  confirmarEliminarRecoleccion() {
    if (!this.selectedRecoleccion?.idRecoleccion) return;

    const sub = this.service.eliminarLogicamente(this.selectedRecoleccion.idRecoleccion)
      .subscribe({
        next: () => {
          this.modalEliminarRecoleccion.close();
          this.cargarDatos();
        },
        error: (err) => {
          const mensaje = err.error?.message || 'No se pudo eliminar la recolección. Verifique que no esté asignada a una ruta.';
          alert(mensaje);
        }
      });
    this.subscriptions.push(sub);
  }

  // =========================
  // EDITAR
  // =========================
  initForm(r?: ModeloRecoleccion) {
    this.fieldsEditarRecoleccion = [
      { type: 'date', name: 'fechaRecoleccion', label: 'Fecha de Recolección', cols: 6 },
      { type: 'text', name: 'observaciones', label: 'Observaciones', cols: 12 }
    ];

    const group: any = {};
    this.fieldsEditarRecoleccion.forEach(f => {
      let initialValue = '';
      if (r) {
        if (f.name === 'fechaRecoleccion') {
          initialValue = r.fechaRecoleccion ? r.fechaRecoleccion.split('T')[0] : '';
        } else {
          initialValue = (r as any)[f.name!] ?? '';
        }
      }
      group[f.name!] = new FormControl(initialValue);
    });

    this.formEditarRecoleccion = new FormGroup(group);
  }

  actualizarRecoleccion() {
    if (!this.selectedRecoleccion?.idRecoleccion) return;

    const formValue = this.formEditarRecoleccion.value;
    // Construir el DTO con el formato correcto para el backend
    const dto: Partial<ModeloRecoleccion> = {};

    if (formValue.fechaRecoleccion) {
      // El backend espera "yyyy-MM-ddTHH:mm:ss", enviamos con hora 00:00:00
      dto.fechaRecoleccion = `${formValue.fechaRecoleccion}T00:00:00`;
    }
    if (formValue.observaciones !== undefined && formValue.observaciones !== null) {
      dto.observaciones = formValue.observaciones;
    }

    // Nota: evidencia no se está manejando en este formulario, se podría agregar después

    console.log('📤 Enviando actualización:', dto);

    const sub = this.service.actualizarRecoleccion(this.selectedRecoleccion.idRecoleccion, dto)
      .subscribe({
        next: () => {
          this.modalEditarRecoleccion.close();
          this.cargarDatos();
        },
        error: (err) => {
          console.error('❌ Error al actualizar:', err);
          const mensaje = err.error?.message || 'Error al actualizar la recolección.';
          alert(mensaje);
        }
      });
    this.subscriptions.push(sub);
  }

  // =========================
  // EVENTOS DE LA TABLA (por si se usan directamente)
  // =========================
  onVer = (item: ModeloRecoleccion) => this.ver(item);
  onEditar = (item: ModeloRecoleccion) => this.editar(item);
  onEliminar = (item: ModeloRecoleccion) => this.eliminar(item);
}
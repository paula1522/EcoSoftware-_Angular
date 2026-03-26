// solicitudes.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { EstadoPeticion } from '../../../Models/solicitudes.model';

import { Service } from '../../../Services/solicitud.service';
import { 
  Localidad, ServiceModel, TipoResiduo } from '../../../Models/solicitudes.model';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { ColumnaTabla, Tabla } from '../../../shared/tabla/tabla';
import { Modal } from "../../../shared/modal/modal";
import { Boton } from "../../../shared/botones/boton/boton";
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { FieldConfig, FormComp } from '../../../shared/form/form.comp/form.comp';

@Component({
  selector: 'app-solcitudes',
  standalone: true,
  imports: [COMPARTIR_IMPORTS, Tabla, Modal, Boton, FormComp],
  templateUrl: './solcitudes.html',
  styleUrls: ['./solcitudes.css']
})
export class Solcitudes implements OnInit {

  solicitudes: ServiceModel[] = [];
  todasLasSolicitudes: ServiceModel[] = [];
  selectedSolicitud: ServiceModel | null = null;
  motivoRechazo: string = '';
  selectedMotivo: string = '';
  motivosDisponibles: string[] = [
    'Datos incorrectos',
    'Solicitud duplicada',
    'Información incompleta',
    'No cumple requisitos',
    'Revisión administrativa'
  ];
  mostrarModalRechazo = false;
  @ViewChild('modalReportes', { static: false }) modalReportes!: Modal;
  @ViewChild('modalVerSolicitud', { static: false }) modalVerSolicitud!: Modal;
  @ViewChild('modalEditarSolicitud', { static: false }) modalEditarSolicitud!: Modal;
  @ViewChild('modalRechazo', { static: false }) modalRechazo!: Modal;
  formEditarSolicitud: FormGroup = new FormGroup({});
  fieldsEditarSolicitud: FieldConfig[] = [];

  // filtros
  estadoFilter: string = '';
  localidadFilter: string = '';
  fechaDesde: string = '';
  fechaHasta: string = '';

  mostrarModalEditar = false;

  cargandoExport = false;

  constructor(private solicitudesService: Service) { }

  // justo dentro de tu clase Solcitudes
  columnasSolicitudes: ColumnaTabla[] = [
    { campo: 'idSolicitud', titulo: 'ID' },
    { campo: 'tipoResiduo', titulo: 'Tipo Residuo' },
    { campo: 'cantidad', titulo: 'Cantidad' },
    { campo: 'fechaProgramada', titulo: 'Fecha Solicitud' },
    { campo: 'localidad', titulo: 'Localidad' },
    { campo: 'estadoPeticion', titulo: 'Estado' }
  ];

  cellTemplates = {
    estadoPeticion: (item: ServiceModel): string => {
      const estado = item.estadoPeticion || '';
      let icon = '';
      let clase = '';

      switch (estado) {
        case 'Pendiente':
          icon = '<i class="bi bi-clock"></i>';
          clase = 'status-pendiente';
          break;
        case 'Aceptada':
          icon = '<i class="bi bi-check-circle"></i>';
          clase = 'status-aceptada';
          break;
        case 'Rechazada':
          icon = '<i class="bi bi-slash-circle"></i>';
          clase = 'status-rechazada';
          break;
        case 'Cancelada':
          icon = '<i class="bi bi-x-circle"></i>';
          clase = 'status-cancelada';
          break;
      }

      return `<span class="status-badge ${clase}">${icon} ${estado}</span>`;
    },
    fechaRecoleccion: (item: ServiceModel): string => {
          if (!item.fechaProgramada) return 'Sin fecha';
          return new Date(item.fechaProgramada).toLocaleString('es-CO', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          });
        }
  };

  ngOnInit(): void {
    this.listarSolicitudes();
  }

  listarSolicitudes(): void {
    this.solicitudesService.listar().subscribe({
      next: (lista: ServiceModel[]) => {
        this.todasLasSolicitudes = [...(lista || [])];
        this.solicitudes = [...this.todasLasSolicitudes];
      },
      error: (err) => console.error('❌ Error al listar solicitudes', err)
    });
  }

  aceptarSolicitud(solicitud: ServiceModel): void {
    const recolectorId = 3; // Cambiar por ID real desde sesión
    this.solicitudesService.aceptarSolicitud(solicitud.idSolicitud!).subscribe({
      next: () => {
        alert(`Solicitud #${solicitud.idSolicitud} aceptada correctamente ✅`);
        this.listarSolicitudes();
      },
      error: (err) => console.error('❌ Error al aceptar solicitud', err)
    });
  }

  // ===============================
  // MODALES
  // ===============================
 abrirModalReportes(): void {
  this.modalReportes.isOpen = true;
}

  abrirModalRechazo(solicitud: ServiceModel) {
    this.selectedSolicitud = solicitud;
    this.selectedMotivo = '';
    this.mostrarModalRechazo = true; // solo cambiar esta variable
  }

  cerrarModalRechazo() {
    this.mostrarModalRechazo = false;
    this.selectedSolicitud = null;
    this.selectedMotivo = '';
  }

  abrirModalVerSolicitud(solicitud: ServiceModel) {
    this.selectedSolicitud = solicitud;
    this.modalVerSolicitud.isOpen = true;
  }

  abrirModalEdicion(solicitud: ServiceModel): void {
    this.selectedSolicitud = solicitud;
    this.initFormEditarSolicitud(solicitud); // inicializa el form
    this.mostrarModalEditar = true;          // abre modal
  }






  cerrarModalEditarSolicitud(): void {
    this.mostrarModalEditar = false;
    this.selectedSolicitud = null;
    this.formEditarSolicitud.reset();
  }

  initFormEditarSolicitud(solicitud?: ServiceModel) {
    this.fieldsEditarSolicitud = [
      {
        type: 'select', name: 'tipoResiduo', label: 'Tipo de Residuo', cols: 6, options: [
          { value: 'Plastico', text: 'Plástico' },
          { value: 'Papel', text: 'Papel' },
          { value: 'Vidrio', text: 'Vidrio' },
          { value: 'Metal', text: 'Metal' },
          { value: 'Organico', text: 'Orgánico' },
          { value: 'Electronico', text: 'Electrónico' },
          { value: 'Otro', text: 'Otro' }
        ]
      },
      { type: 'text', name: 'cantidad', label: 'Cantidad', placeholder: 'Cantidad', cols: 6 },
      {
        type: 'select', name: 'localidad', label: 'Localidad', cols: 6, options: [
          { value: '', text: 'Seleccione' },
          { value: 'Usaquen', text: 'Usaquén' },
          { value: 'Chapinero', text: 'Chapinero' },
          { value: 'Santa_Fe', text: 'Santa Fe' },
          { value: 'San_Cristobal', text: 'San Cristóbal' },
          { value: 'Usme', text: 'Usme' },
          { value: 'Tunjuelito', text: 'Tunjuelito' },
          { value: 'Bosa', text: 'Bosa' },
          { value: 'Kennedy', text: 'Kennedy' },
          { value: 'Fontibon', text: 'Fontibón' },
          { value: 'Engativa', text: 'Engativá' },
          { value: 'Suba', text: 'Suba' },
          { value: 'Barrios_Unidos', text: 'Barrios Unidos' },
          { value: 'Teusaquillo', text: 'Teusaquillo' },
          { value: 'Los_Martires', text: 'Los Mártires' },
          { value: 'Antonio_Nariño', text: 'Antonio Nariño' },
          { value: 'Puente_Aranda', text: 'Puente Aranda' },
          { value: 'Candelaria', text: 'Candelaria' },
          { value: 'Rafael_Uribe_Uribe', text: 'Rafael Uribe Uribe' },
          { value: 'Ciudad_Bolivar', text: 'Ciudad Bolívar' },
          { value: 'Sumapaz', text: 'Sumapaz' }
        ]
      },
      { type: 'text', name: 'ubicacion', label: 'Ubicación exacta', placeholder: 'Ubicación', cols: 6 },
      { type: 'textarea', name: 'descripcion', label: 'Descripción', placeholder: 'Descripción', cols: 12 },
      { type: 'date', name: 'fechaProgramada', label: 'Fecha programada', cols: 6 }
    ];
    const group: any = {};
    this.fieldsEditarSolicitud.forEach(f => {
      group[f.name!] = new FormControl(
        solicitud ? (solicitud as any)[f.name!] ?? '' : '',
        f.name !== 'aceptadaPorId' ? [Validators.required] : []
      );
    });
    this.formEditarSolicitud = new FormGroup(group);
  }

  confirmarRechazo(): void {
    if (!this.selectedSolicitud) return;

    const motivoFinal = this.selectedMotivo;
    if (!motivoFinal || !motivoFinal.trim()) {
      alert('Seleccione un motivo de rechazo');
      return;
    }

    console.log('[confirmarRechazo] enviando rechazo:', {
      id: this.selectedSolicitud.idSolicitud,
      motivo: motivoFinal
    });

    this.solicitudesService.rechazarSolicitud(this.selectedSolicitud.idSolicitud!, motivoFinal).subscribe({
      next: () => {
        alert(`Solicitud #${this.selectedSolicitud?.idSolicitud} rechazada correctamente`);
        this.cerrarModalRechazo();
        this.listarSolicitudes();
      },
      error: (err) => {
        console.error('❌ Error al rechazar la solicitud:', err);
        if (err.error) {
          console.error('Detalle del error:', err.error);
        }
        alert(`Error al rechazar: ${err.message || err.statusText}`);
      }
    });
  }

  actualizarSolicitud(): void {
  if (!this.selectedSolicitud?.idSolicitud) return;
  if (this.formEditarSolicitud.invalid) return;

  const formValue = this.formEditarSolicitud.value;

  // Construir objeto siguiendo la interfaz ServiceModel
const datosActualizados: ServiceModel = {
  idSolicitud: this.selectedSolicitud!.idSolicitud!,
  usuarioId: this.selectedSolicitud!.usuarioId,
  aceptadaPorId: this.selectedSolicitud!.aceptadaPorId,
  tipoResiduo: formValue.tipoResiduo,
  cantidad: String(formValue.cantidad),
  descripcion: formValue.descripcion,
  localidad: formValue.localidad,
  ubicacion: formValue.ubicacion,
  fechaProgramada: new Date(formValue.fechaProgramada).toISOString(),
  evidencia: this.selectedSolicitud!.evidencia || '',
  estadoPeticion: this.selectedSolicitud!.estadoPeticion ?? EstadoPeticion.Pendiente
};

  this.solicitudesService.actualizarSolicitud(this.selectedSolicitud!.idSolicitud, datosActualizados)
    .subscribe({
      next: () => {
        alert('Solicitud actualizada correctamente ✅');
        this.cerrarModalEditarSolicitud();
        this.listarSolicitudes();
      },
      error: (err) => {
        console.error('❌ Error al actualizar solicitud:', err);
        alert(`Error al actualizar la solicitud: ${err.error?.message || err.statusText}`);
      }
    });
}


  acciones = ['ver', 'editar', 'rechazar'];

  // ===============================
  // BOTONES MODALES
  // ===============================
  botonesReporte = [
    {
      texto: 'PDF',
      icono: 'bi-file-earmark-pdf',
      color: 'outline-custom-danger',
      accion: () => this.exportarPDF()
    },
    {
      texto: 'Excel',
      icono: 'bi-file-earmark-excel',
      color: 'outline-custom-success',
      accion: () => this.exportarExcel()
    }
  ];

  // ========================
  // FILTROS
  // ========================
  aplicarFiltros(): void {
    let resultados = [...this.todasLasSolicitudes];
    if (this.estadoFilter) resultados = resultados.filter(r => r.estadoPeticion === this.estadoFilter);
    if (this.localidadFilter) {
      const loc = this.localidadFilter.trim().toLowerCase();
      resultados = resultados.filter(r => (r.localidad || '').toLowerCase().includes(loc));
    }
    if (this.fechaDesde) {
      const desde = new Date(this.fechaDesde);
      resultados = resultados.filter(r => r.fechaCreacionSolicitud ? new Date(r.fechaCreacionSolicitud) >= desde : false);
    }
    if (this.fechaHasta) {
      const hasta = new Date(this.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      resultados = resultados.filter(r => r.fechaCreacionSolicitud ? new Date(r.fechaCreacionSolicitud) <= hasta : false);
    }
    this.solicitudes = resultados;
  }

  limpiarFiltros(): void {
    this.estadoFilter = '';
    this.localidadFilter = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.solicitudes = [...this.todasLasSolicitudes];
  }

  // ========================
  // EXPORTACIONES
  // ========================
  exportarExcel(): void {
    this.cargandoExport = true;
    this.solicitudesService.exportarExcel(
      this.estadoFilter || undefined,
      this.localidadFilter || undefined,
      this.fechaDesde || undefined,
      this.fechaHasta || undefined
    ).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `solicitudes_${this.timestamp()}.xlsx`);
        this.cargandoExport = false;
      },
      error: (err) => { console.error('❌ Error exportando Excel', err); this.cargandoExport = false; }
    });
  }

  exportarPDF(): void {
    this.cargandoExport = true;
    this.solicitudesService.exportarPDF(
      this.estadoFilter || undefined,
      this.localidadFilter || undefined,
      this.fechaDesde || undefined,
      this.fechaHasta || undefined
    ).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `solicitudes_${this.timestamp()}.pdf`);
        this.cargandoExport = false;
      },
      error: (err) => { console.error('❌ Error exportando PDF', err); this.cargandoExport = false; }
    });
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  private timestamp(): string {
    const d = new Date();
    return `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}_${d.getHours().toString().padStart(2, '0')}${d.getMinutes().toString().padStart(2, '0')}`;
  }

  // Añade métodos para manejar los eventos de la tabla y abrir los modales correctamente
  onVerSolicitud = (item: ServiceModel) => this.abrirModalVerSolicitud(item);
  onEditarSolicitud = (item: ServiceModel) => this.abrirModalEdicion(item);
  onRechazarSolicitud = (item: ServiceModel) => this.abrirModalRechazo(item);
}
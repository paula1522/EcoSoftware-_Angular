// solicitudes.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { Service } from '../../../Services/solicitud.service';
import { ServiceModel } from '../../../Models/solicitudes.model';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { ColumnaTabla, Tabla } from '../../../shared/tabla/tabla';
import { Modal } from "../../../shared/modal/modal";
import { Boton } from "../../../shared/botones/boton/boton";
import { LocalidadNombrePipe } from "../../../core/pipes/LocalidadNombrePipe";
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { FieldConfig, FormComp } from '../../../shared/form/form.comp/form.comp';

@Component({
  selector: 'app-solcitudes',
  standalone: true,
  imports: [COMPARTIR_IMPORTS, Tabla, Modal, Boton, LocalidadNombrePipe, FormComp],
  templateUrl: './solcitudes.html',
  styleUrls: ['./solcitudes.css']
})
export class Solcitudes implements OnInit {

  solicitudes: ServiceModel[] = [];
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
  @ViewChild('modalReportes') modalReportes!: Modal;
  @ViewChild('modalVerSolicitud') modalVerSolicitud!: Modal;
  @ViewChild('modalEditarSolicitud') modalEditarSolicitud!: Modal;
  @ViewChild('modalEliminarSolicitud') modalEliminarSolicitud!: Modal;
  formEditarSolicitud: FormGroup = new FormGroup({});
  fieldsEditarSolicitud: FieldConfig[] = [];

  // filtros
  estadoFilter: string = '';
  localidadFilter: string = '';
  fechaDesde: string = '';
  fechaHasta: string = '';

  cargandoExport = false;

  constructor(private solicitudesService: Service) {}

  // justo dentro de tu clase Solcitudes
  columnasSolicitudes: ColumnaTabla[] = [
    { campo: 'idSolicitud', titulo: 'ID' },
    { campo: 'tipoResiduo', titulo: 'Tipo Residuo' },
    { campo: 'cantidad', titulo: 'Cantidad' },
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
        case 'Cancelada':
          icon = '<i class="bi bi-x-circle"></i>';
          clase = 'status-cancelada';
          break;
        case 'Rechazada':
          icon = '<i class="bi bi-slash-circle"></i>';
          clase = 'status-rechazada';
          break;
      }

      return `<span class="status-badge ${clase}">${icon} ${estado}</span>`;
    }
  };

  ngOnInit(): void { 
    this.listarSolicitudes();
  }

  listarSolicitudes(): void {
    this.solicitudesService.listar().subscribe({
      next: (lista: ServiceModel[]) => this.solicitudes = lista || [],
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

  abrirModalRechazo(solicitud: ServiceModel): void {
    this.selectedSolicitud = solicitud;
    this.motivoRechazo = '';
    this.selectedMotivo = '';
    this.mostrarModalRechazo = true;
  }

  cerrarModalRechazo(): void {
    this.mostrarModalRechazo = false;
    this.selectedSolicitud = null;
    this.motivoRechazo = '';
    this.selectedMotivo = '';
  }

  abrirModalVerSolicitud(solicitud: ServiceModel) {
    this.selectedSolicitud = solicitud;
    this.modalVerSolicitud.isOpen = true;
  }

  abrirModalEdicion(solicitud: ServiceModel): void {
    this.selectedSolicitud = solicitud;
    this.initFormEditarSolicitud(solicitud);
    this.modalEditarSolicitud.isOpen = true;
  }

  eliminarSolicitud(item: ServiceModel) {
    this.selectedSolicitud = item;
    this.modalEliminarSolicitud.isOpen = true;
  }

  cerrarModalEliminarSolicitud() {
    this.modalEliminarSolicitud.close();
    this.selectedSolicitud = null;
  }

  confirmarEliminarSolicitud() {
    if (!this.selectedSolicitud?.idSolicitud) return;
    // Usar rechazarSolicitud con motivo fijo
    this.solicitudesService.rechazarSolicitud(this.selectedSolicitud.idSolicitud, 'Eliminada por el usuario').subscribe({
      next: () => {
        this.modalEliminarSolicitud.close();
        this.selectedSolicitud = null;
        this.listarSolicitudes();
      },
      error: () => alert('Error al rechazar/eliminar la solicitud')
    });
  }

  cerrarModalEditarSolicitud(): void {
    this.modalEditarSolicitud.close();
    this.selectedSolicitud = null;
    this.formEditarSolicitud.reset();
  }

  initFormEditarSolicitud(solicitud?: ServiceModel) {
    this.fieldsEditarSolicitud = [
      { type: 'select', name: 'tipoResiduo', label: 'Tipo de Residuo', cols: 6, options: [
        { value: 'Plastico', text: 'Plástico' },
        { value: 'Papel', text: 'Papel' },
        { value: 'Vidrio', text: 'Vidrio' },
        { value: 'Metal', text: 'Metal' },
        { value: 'Organico', text: 'Orgánico' },
        { value: 'Electronico', text: 'Electrónico' },
        { value: 'Otro', text: 'Otro' }
      ] },
      { type: 'text', name: 'cantidad', label: 'Cantidad', placeholder: 'Cantidad', cols: 6 },
      { type: 'select', name: 'localidad', label: 'Localidad', cols: 6, options: [
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
      ] },
      { type: 'text', name: 'ubicacion', label: 'Ubicación exacta', placeholder: 'Ubicación', cols: 6 },
      { type: 'textarea', name: 'descripcion', label: 'Descripción', placeholder: 'Descripción', cols: 12 },
      { type: 'date', name: 'fechaProgramada', label: 'Fecha programada', cols: 6 }
    ];
    const group: any = {};
    this.fieldsEditarSolicitud.forEach(f => {
      group[f.name!] = new FormControl(solicitud ? (solicitud as any)[f.name!] ?? '' : '', []);
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
    const datosActualizados = {
      ...this.selectedSolicitud,
      ...this.formEditarSolicitud.value
    };
    this.solicitudesService.actualizarSolicitud(this.selectedSolicitud.idSolicitud, datosActualizados).subscribe({
      next: () => {
        alert('Solicitud actualizada correctamente');
        this.cerrarModalEditarSolicitud();
        this.listarSolicitudes();
      },
      error: () => {
        alert('Error al actualizar la solicitud');
      }
    });
  }

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
    this.solicitudesService.listar().subscribe({
      next: (lista: ServiceModel[]) => {
        let resultados = lista || [];
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
          hasta.setHours(23,59,59,999);
          resultados = resultados.filter(r => r.fechaCreacionSolicitud ? new Date(r.fechaCreacionSolicitud) <= hasta : false);
        }
        this.solicitudes = resultados;
      },
      error: (err) => console.error(err)
    });
  }

  limpiarFiltros(): void {
    this.estadoFilter = '';
    this.localidadFilter = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.listarSolicitudes();
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
    return `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}_${d.getHours().toString().padStart(2,'0')}${d.getMinutes().toString().padStart(2,'0')}`;
  }

  // Añade métodos para manejar los eventos de la tabla y abrir los modales correctamente
  onVerSolicitud = (item: ServiceModel) => this.abrirModalVerSolicitud(item);
  onEditarSolicitud = (item: ServiceModel) => this.abrirModalEdicion(item);
  onEliminarSolicitud = (item: ServiceModel) => this.eliminarSolicitud(item);

  
}
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../auth/auth.service';
import { SolicitudRecoleccionService } from '../../../Services/solicitud.service';
import {SolicitudRecoleccion,EstadoPeticion,Localidad,TipoResiduo} from '../../../Models/solicitudes.model';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { ColumnaTabla, Tabla } from '../../../shared/tabla/tabla';
import { Modal } from '../../../shared/modal/modal';
import { Boton } from '../../../shared/botones/boton/boton';
import { FieldConfig, FormComp } from '../../../shared/form/form.comp/form.comp';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [COMPARTIR_IMPORTS, Tabla, Modal, Boton, FormComp],
  templateUrl: './solcitudes.html',
  styleUrls: ['./solcitudes.css'],
})
export class Solicitudes implements OnInit, OnDestroy {
  // Datos
  todasLasSolicitudes: SolicitudRecoleccion[] = [];
  solicitudes: SolicitudRecoleccion[] = [];
  selectedSolicitud: SolicitudRecoleccion | null = null;

  // Estados
  isLoading = false;
  errorMessage = '';

  // Filtros
  estadoFilter: EstadoPeticion | '' = '';
  localidadFilter: Localidad | '' = '';
  tipoResiduoFilter: TipoResiduo | '' = '';
  fechaDesde: string = '';
  fechaHasta: string = '';
  private filterTimeout: any;

  // Modales
  mostrarModalEditar = false;
  mostrarModalRechazo = false;
  selectedMotivo = '';
  motivosDisponibles = [
    'Datos incorrectos',
    'Solicitud duplicada',
    'Información incompleta',
    'No cumple requisitos',
    'Revisión administrativa',
  ];

  // Edición de evidencia
  nuevaEvidenciaFile: File | null = null;
  evidenciaActualUrl: string = '';
  previewEvidenciaUrl: string | null = null; // Para previsualización

  // Fecha con hora en edición
  fechaProgramadaValue: string = '';

  // Formulario edición
  formEditarSolicitud: FormGroup = new FormGroup({});
  fieldsEditarSolicitud: FieldConfig[] = [];

  // Referencias modales
  @ViewChild('modalVerSolicitud') modalVerSolicitud!: Modal;
  @ViewChild('modalEditarSolicitud') modalEditarSolicitud!: Modal;
  @ViewChild('modalRechazo') modalRechazo!: Modal;
  @ViewChild('modalReportes') modalReportes!: Modal;

  // Configuración tabla
  columnasSolicitudes: ColumnaTabla[] = [
    { campo: 'idSolicitud', titulo: 'ID' },
    { campo: 'tipoResiduo', titulo: 'Tipo Residuo' },
    { campo: 'cantidad', titulo: 'Cantidad' },
    { campo: 'fechaProgramada', titulo: 'Fecha Solicitud' },
    { campo: 'localidad', titulo: 'Localidad' },
    { campo: 'estadoPeticion', titulo: 'Estado' },
  ];

  cellTemplates = {
    estadoPeticion: (item: SolicitudRecoleccion): string => {
      const estado = item.estadoPeticion;
      let icon = '';
      let clase = '';
      switch (estado) {
        case EstadoPeticion.Pendiente:
          icon = '<i class="bi bi-clock"></i>';
          clase = 'status-pendiente';
          break;
        case EstadoPeticion.Aceptada:
          icon = '<i class="bi bi-check-circle"></i>';
          clase = 'status-aceptada';
          break;
        case EstadoPeticion.Rechazada:
          icon = '<i class="bi bi-slash-circle"></i>';
          clase = 'status-rechazada';
          break;
        case EstadoPeticion.Cancelada:
          icon = '<i class="bi bi-x-circle"></i>';
          clase = 'status-cancelada';
          break;
      }
      return `<span class="status-badge ${clase}">${icon} ${estado}</span>`;
    },
    fechaProgramada: (item: SolicitudRecoleccion): string => {
      if (!item.fechaProgramada) return 'Sin fecha';
      return new Date(item.fechaProgramada).toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  };

  // Listas para selects
  estadoEnumList = Object.values(EstadoPeticion);
  localidadEnumList = Object.values(Localidad);
  tipoResiduoEnumList = Object.values(TipoResiduo);

 accionVisiblePorFila = (accion: string, item: SolicitudRecoleccion): boolean => {
  // El botón 'ver' siempre visible
  if (accion === 'ver') return true;

  // Para editar y rechazar, solo se muestran si la solicitud está Pendiente
  if (accion === 'editar' || accion === 'rechazar') {
    return item.estadoPeticion === EstadoPeticion.Pendiente;
  }

  return true;
};

  constructor(
    private solicitudService: SolicitudRecoleccionService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  ngOnDestroy(): void {
    if (this.filterTimeout) clearTimeout(this.filterTimeout);
  }

  // ========================
  // Carga de datos
  // ========================
  cargarSolicitudes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.solicitudService.listar().subscribe({
      next: (data) => {
        this.todasLasSolicitudes = data || [];
        this.aplicarFiltrosLocal();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar solicitudes', err);
        this.errorMessage = 'No se pudieron cargar las solicitudes. Intente más tarde.';
        this.isLoading = false;
      },
    });
  }

  // ========================
  // Filtros en cliente
  // ========================
  aplicarFiltrosLocal(): void {
    let resultados = [...this.todasLasSolicitudes];

    if (this.estadoFilter) {
      resultados = resultados.filter((r) => r.estadoPeticion === this.estadoFilter);
    }

    if (this.localidadFilter) {
      resultados = resultados.filter((r) => r.localidad === this.localidadFilter);
    }

    if (this.tipoResiduoFilter) {
      resultados = resultados.filter((r) => r.tipoResiduo === this.tipoResiduoFilter);
    }

    if (this.fechaDesde) {
      const desde = new Date(this.fechaDesde);
      resultados = resultados.filter((r) =>
        r.fechaCreacionSolicitud ? new Date(r.fechaCreacionSolicitud) >= desde : false
      );
    }

    if (this.fechaHasta) {
      const hasta = new Date(this.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      resultados = resultados.filter((r) =>
        r.fechaCreacionSolicitud ? new Date(r.fechaCreacionSolicitud) <= hasta : false
      );
    }

    this.solicitudes = resultados;
  }

  onLocalidadFilterChange(): void {
    if (this.filterTimeout) clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.aplicarFiltrosLocal();
    }, 300);
  }

  limpiarFiltros(): void {
    this.estadoFilter = '';
    this.localidadFilter = '';
    this.tipoResiduoFilter = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.aplicarFiltrosLocal();
  }

  // ========================
  // Acciones sobre solicitudes
  // ========================
  aceptarSolicitud(solicitud: SolicitudRecoleccion): void {
    const recolectorId = this.authService.getUserId();
    if (!recolectorId) {
      alert('No se pudo identificar al recolector. Inicie sesión nuevamente.');
      return;
    }
    this.solicitudService.aceptarSolicitud(solicitud.idSolicitud).subscribe({
      next: () => {
        alert(`Solicitud #${solicitud.idSolicitud} aceptada correctamente ✅`);
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error('Error al aceptar', err);
        alert(`Error: ${err.error?.message || err.statusText}`);
      },
    });
  }

  // ========================
  // Modales
  // ========================
  abrirModalVerSolicitud(solicitud: SolicitudRecoleccion): void {
    this.selectedSolicitud = solicitud;
    this.modalVerSolicitud.isOpen = true;
  }

  abrirModalEdicion(solicitud: SolicitudRecoleccion): void {
    if (solicitud.estadoPeticion !== EstadoPeticion.Pendiente) {
      alert('Solo se pueden editar solicitudes pendientes.');
      return;
    }
    this.selectedSolicitud = solicitud;
    this.evidenciaActualUrl = solicitud.evidencia || '';
    this.nuevaEvidenciaFile = null;
    this.previewEvidenciaUrl = null;
    this.initFormEditarSolicitud(solicitud);
    this.mostrarModalEditar = true;
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.selectedSolicitud = null;
    this.formEditarSolicitud.reset();
    this.nuevaEvidenciaFile = null;
    this.evidenciaActualUrl = '';
    if (this.previewEvidenciaUrl) {
      URL.revokeObjectURL(this.previewEvidenciaUrl);
      this.previewEvidenciaUrl = null;
    }
  }

  abrirModalRechazo(solicitud: SolicitudRecoleccion): void {
    this.selectedSolicitud = solicitud;
    this.selectedMotivo = '';
    this.mostrarModalRechazo = true;
  }

  cerrarModalRechazo(): void {
    this.mostrarModalRechazo = false;
    this.selectedSolicitud = null;
    this.selectedMotivo = '';
  }

  confirmarRechazo(): void {
    if (!this.selectedSolicitud || !this.selectedMotivo) {
      alert('Seleccione un motivo de rechazo');
      return;
    }
    this.solicitudService
      .rechazarSolicitud(this.selectedSolicitud.idSolicitud, this.selectedMotivo)
      .subscribe({
        next: () => {
          alert(`Solicitud #${this.selectedSolicitud?.idSolicitud} rechazada correctamente`);
          this.cerrarModalRechazo();
          this.cargarSolicitudes();
        },
        error: (err) => {
          console.error('Error al rechazar', err);
          alert(`Error: ${err.error?.message || err.statusText}`);
        },
      });
  }

  // ========================
  // Manejo de evidencia en edición
  // ========================
  onEvidenciaSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.nuevaEvidenciaFile = file;
      if (this.previewEvidenciaUrl) {
        URL.revokeObjectURL(this.previewEvidenciaUrl);
      }
      this.previewEvidenciaUrl = URL.createObjectURL(file);
    } else {
      alert('Por favor seleccione una imagen válida.');
      this.nuevaEvidenciaFile = null;
      this.previewEvidenciaUrl = null;
    }
  }

  // Subir evidencia y luego actualizar solicitud
  async actualizarSolicitud(): Promise<void> {
    if (!this.selectedSolicitud?.idSolicitud) return;
    if (this.formEditarSolicitud.invalid) {
      alert('Complete todos los campos requeridos');
      return;
    }

    const formValue = this.formEditarSolicitud.value;
    let fechaProgramadaBackend = '';
    if (this.fechaProgramadaValue) {
      fechaProgramadaBackend = this.fechaProgramadaValue + ':00';
    }

    const datosActualizados: SolicitudRecoleccion = {
      ...this.selectedSolicitud,
      tipoResiduo: formValue.tipoResiduo,
      cantidad: String(formValue.cantidad),
      descripcion: formValue.descripcion,
      localidad: formValue.localidad,
      ubicacion: formValue.ubicacion,
      fechaProgramada: fechaProgramadaBackend,
    };

    try {
      if (this.nuevaEvidenciaFile) {
        const evidenciaUrl = await this.solicitudService
          .subirEvidencia(this.selectedSolicitud.idSolicitud, this.nuevaEvidenciaFile)
          .toPromise();
        datosActualizados.evidencia = evidenciaUrl;
      }

      this.solicitudService
        .actualizarSolicitud(this.selectedSolicitud.idSolicitud, datosActualizados)
        .subscribe({
          next: () => {
            alert('Solicitud actualizada correctamente ✅');
            this.cerrarModalEditar();
            this.cargarSolicitudes();
          },
          error: (err) => {
            console.error('Error al actualizar', err);
            alert(`Error: ${err.error?.message || err.statusText}`);
          },
        });
    } catch (err) {
      console.error('Error al subir evidencia', err);
      alert('Error al subir la evidencia. La solicitud no se actualizó.');
    }
  }

  // ========================
  // Formulario de edición
  // ========================
  initFormEditarSolicitud(solicitud: SolicitudRecoleccion): void {
    this.fieldsEditarSolicitud = [
      {
        type: 'select',
        name: 'tipoResiduo',
        label: 'Tipo de Residuo',
        cols: 6,
        options: this.tipoResiduoEnumList.map((v) => ({ value: v, text: v })),
      },
      { type: 'text', name: 'cantidad', label: 'Cantidad', cols: 6 },
      {
        type: 'select',
        name: 'localidad',
        label: 'Localidad',
        cols: 6,
        options: this.localidadEnumList.map((v) => ({ value: v, text: v })),
      },
      { type: 'text', name: 'ubicacion', label: 'Ubicación exacta', cols: 6 },
      { type: 'textarea', name: 'descripcion', label: 'Descripción', cols: 12 },
      // fechaProgramada se maneja aparte
    ];

    const group: any = {};
    this.fieldsEditarSolicitud.forEach((f) => {
      const fieldName = f.name!;
      const value = solicitud[fieldName as keyof SolicitudRecoleccion] ?? '';
      group[fieldName] = new FormControl(value, [Validators.required]);
    });
    this.formEditarSolicitud = new FormGroup(group);

    // Inicializar fechaProgramadaValue con formato YYYY-MM-DDTHH:MM
    if (solicitud.fechaProgramada) {
      const fecha = new Date(solicitud.fechaProgramada);
      const year = fecha.getFullYear();
      const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const day = fecha.getDate().toString().padStart(2, '0');
      const hours = fecha.getHours().toString().padStart(2, '0');
      const minutes = fecha.getMinutes().toString().padStart(2, '0');
      this.fechaProgramadaValue = `${year}-${month}-${day}T${hours}:${minutes}`;
    } else {
      this.fechaProgramadaValue = '';
    }
  }

  // ========================
  // Reportes (PDF/Excel)
  // ========================
  abrirModalReportes(): void {
    this.modalReportes.isOpen = true;
  }

  botonesReporte = [
    {
      texto: 'PDF',
      icono: 'bi-file-earmark-pdf',
      color: 'outline-custom-danger',
      accion: () => this.exportarPDF(),
    },
    {
      texto: 'Excel',
      icono: 'bi-file-earmark-excel',
      color: 'outline-custom-success',
      accion: () => this.exportarExcel(),
    },
  ];

  exportarExcel(): void {
    this.solicitudService
      .exportarExcel(
        this.estadoFilter || undefined,
        this.localidadFilter as Localidad | undefined,
        this.fechaDesde || undefined,
        this.fechaHasta || undefined
      )
      .subscribe({
        next: (blob) => this.downloadBlob(blob, `solicitudes_${this.timestamp()}.xlsx`),
        error: (err) => console.error('Error exportando Excel', err),
      });
  }

  exportarPDF(): void {
    this.solicitudService
      .exportarPDF(
        this.estadoFilter || undefined,
        this.localidadFilter as Localidad | undefined,
        this.fechaDesde || undefined,
        this.fechaHasta || undefined
      )
      .subscribe({
        next: (blob) => this.downloadBlob(blob, `solicitudes_${this.timestamp()}.pdf`),
        error: (err) => console.error('Error exportando PDF', err),
      });
  }

  private downloadBlob(blob: Blob, filename: string): void {
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

  // ========================
  // Eventos de la tabla
  // ========================
  onVerSolicitud = (item: SolicitudRecoleccion) => this.abrirModalVerSolicitud(item);
  onEditarSolicitud = (item: SolicitudRecoleccion) => this.abrirModalEdicion(item);
  onRechazarSolicitud = (item: SolicitudRecoleccion) => this.abrirModalRechazo(item);
}
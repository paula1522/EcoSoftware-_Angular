import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  SolicitudRecoleccion, 
  TipoResiduo, 
  EstadoPeticion, 
  Localidad 
} from '../../../Models/solicitudes.model';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { Boton } from "../../../shared/botones/boton/boton";
import { UsuarioService } from '../../../Services/usuario.service';
import { UsuarioModel } from '../../../Models/usuario';
import { AuthService } from '../../../auth/auth.service';
import { LocalidadNombrePipe } from "../../../core/pipes/LocalidadNombrePipe";
import { Modal } from '../../../shared/modal/modal';
import { SolicitudRecoleccionService } from '../../../Services/solicitud.service';
import { FieldConfig, FormComp } from '../../../shared/form/form.comp/form.comp';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-cards-solicitud',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    COMPARTIR_IMPORTS,
    Boton,
    LocalidadNombrePipe,
    Modal,
    FormComp
  ],
  templateUrl: './cards-solicitud.html',
  styleUrls: ['./cards-solicitud.css']
})
export class CardsSolicitud implements OnInit {

  solicitudes: SolicitudRecoleccion[] = [];
  usuarioActual: UsuarioModel | null = null;
  idUsuarioActual: number | null = null;

  // Selectores para filtros
  localidades = Object.values(Localidad);
  tiposResiduo: TipoResiduo[] = Object.values(TipoResiduo);
  estadosPeticion: EstadoPeticion[] = Object.values(EstadoPeticion);

  // Filtros
  estadoSeleccionado: EstadoPeticion | '' = '';
  tipoResiduoSeleccionado: TipoResiduo | '' = '';
  fechaProgramadaDesde: string = '';
  fechaProgramadaHasta: string = '';
  ordenFecha: 'asc' | 'desc' = 'desc';

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 12;

  // Modal de edición
  @ViewChild('modalEditar') modalEditar!: Modal;
  solicitudSeleccionada: SolicitudRecoleccion | null = null;
  formEditarSolicitud!: FormGroup;
  fieldsEditarSolicitud: FieldConfig[] = [];
  fechaProgramadaValue: string = '';
  nuevaEvidenciaFile: File | null = null;
  evidenciaActualUrl: string = '';
  previewEvidenciaUrl: string | null = null;

  // Modal de cancelación
  modalCancelarAbierto = false;
  solicitudCancelar: SolicitudRecoleccion | null = null;

  // Modal de ver (solo lectura)
  modalVerAbierto = false;
  solicitudVer: SolicitudRecoleccion | null = null;

  constructor(
    private solicitudService: SolicitudRecoleccionService,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerUsuarioActual();
    this.cargarSolicitudes();
  }

  obtenerUsuarioActual(): void {
    this.usuarioActual = this.authService.getUser();
    if (this.usuarioActual) {
      this.idUsuarioActual = this.usuarioActual.idUsuario ?? null;
    } else {
      console.log('No hay usuario logueado');
    }
  }

  cargarSolicitudes(): void {
    if (this.idUsuarioActual == null) return;

    this.solicitudService.listarPorUsuario(this.idUsuarioActual).subscribe({
      next: (data) => {
        this.solicitudes = data;
        this.paginaActual = 1;
      },
      error: (err) => console.error('Error al cargar solicitudes:', err)
    });
  }

  // ===============================
  // FILTROS Y ORDENAMIENTO
  // ===============================
  get solicitudesFiltradas(): SolicitudRecoleccion[] {
    let filtradas = [...this.solicitudes];

    if (this.estadoSeleccionado) {
      filtradas = filtradas.filter(s => s.estadoPeticion === this.estadoSeleccionado);
    }
    if (this.tipoResiduoSeleccionado) {
      filtradas = filtradas.filter(s => s.tipoResiduo === this.tipoResiduoSeleccionado);
    }
    if (this.fechaProgramadaDesde) {
      const desde = new Date(this.fechaProgramadaDesde);
      desde.setHours(0, 0, 0, 0);
      filtradas = filtradas.filter(s => {
        if (!s.fechaProgramada) return false;
        return new Date(s.fechaProgramada) >= desde;
      });
    }
    if (this.fechaProgramadaHasta) {
      const hasta = new Date(this.fechaProgramadaHasta);
      hasta.setHours(23, 59, 59, 999);
      filtradas = filtradas.filter(s => {
        if (!s.fechaProgramada) return false;
        return new Date(s.fechaProgramada) <= hasta;
      });
    }

    filtradas.sort((a, b) => {
      const fechaA = a.fechaProgramada ? new Date(a.fechaProgramada).getTime() : 0;
      const fechaB = b.fechaProgramada ? new Date(b.fechaProgramada).getTime() : 0;
      return this.ordenFecha === 'desc' ? fechaB - fechaA : fechaA - fechaB;
    });

    return filtradas;
  }

  get solicitudesPaginadas(): SolicitudRecoleccion[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.solicitudesFiltradas.slice(inicio, inicio + this.itemsPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.solicitudesFiltradas.length / this.itemsPorPagina);
  }

  cambiarPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaActual = p;
  }

  limpiarFiltros(): void {
    this.estadoSeleccionado = '';
    this.tipoResiduoSeleccionado = '';
    this.fechaProgramadaDesde = '';
    this.fechaProgramadaHasta = '';
    this.ordenFecha = 'desc';
    this.paginaActual = 1;
  }

  // ===============================
  // ACCIONES SOBRE SOLICITUDES
  // ===============================
  accionVisible(accion: string, estado: EstadoPeticion): boolean {
    switch (accion) {
      case 'editar':
        // Permitir editar si está Pendiente o Cancelada
        return estado === EstadoPeticion.Pendiente || estado === EstadoPeticion.Cancelada;
      case 'cancelar':
        return estado === EstadoPeticion.Pendiente;
      case 'ver':
        return true;
      default:
        return false;
    }
  }

  abrirModalVer(solicitud: SolicitudRecoleccion): void {
    this.solicitudVer = solicitud;
    this.modalVerAbierto = true;
  }
  cerrarModalVer(): void {
    this.modalVerAbierto = false;
    this.solicitudVer = null;
  }

  abrirModalCancelar(solicitud: SolicitudRecoleccion): void {
    this.solicitudCancelar = solicitud;
    this.modalCancelarAbierto = true;
  }
  cerrarModalCancelar(): void {
    this.modalCancelarAbierto = false;
    this.solicitudCancelar = null;
  }
  confirmarCancelar(): void {
    if (!this.solicitudCancelar) return;
    this.solicitudService.cancelarSolicitud(this.solicitudCancelar.idSolicitud).subscribe({
      next: () => {
        alert('Solicitud cancelada correctamente');
        this.cargarSolicitudes();
        this.cerrarModalCancelar();
      },
      error: (err) => console.error('Error al cancelar', err)
    });
  }

  abrirModalEditar(solicitud: SolicitudRecoleccion): void {
    // Permitir editar si está Pendiente o Cancelada
    if (solicitud.estadoPeticion !== EstadoPeticion.Pendiente &&
        solicitud.estadoPeticion !== EstadoPeticion.Cancelada) {
      alert('No puedes editar esta solicitud porque ya fue aceptada o rechazada.');
      return;
    }
    this.solicitudSeleccionada = { ...solicitud };
    this.evidenciaActualUrl = solicitud.evidencia || '';
    this.nuevaEvidenciaFile = null;
    this.previewEvidenciaUrl = null;
    this.initFormEditarSolicitud(solicitud);
    this.modalEditar.isOpen = true;
  }

  cerrarModalEditar(): void {
    this.modalEditar.isOpen = false;
    this.solicitudSeleccionada = null;
    this.formEditarSolicitud?.reset();
    this.nuevaEvidenciaFile = null;
    this.evidenciaActualUrl = '';
    if (this.previewEvidenciaUrl) {
      URL.revokeObjectURL(this.previewEvidenciaUrl);
      this.previewEvidenciaUrl = null;
    }
  }

  initFormEditarSolicitud(solicitud: SolicitudRecoleccion): void {
    this.fieldsEditarSolicitud = [
      {
        type: 'select',
        name: 'tipoResiduo',
        label: 'Tipo de Residuo',
        cols: 6,
        options: this.tiposResiduo.map(v => ({ value: v, text: v })),
      },
      { type: 'text', name: 'cantidad', label: 'Cantidad', cols: 6 },
      {
        type: 'select',
        name: 'localidad',
        label: 'Localidad',
        cols: 6,
        options: this.localidades.map(v => ({ value: v, text: v })),
      },
      { type: 'text', name: 'ubicacion', label: 'Ubicación exacta', cols: 6 },
      { type: 'textarea', name: 'descripcion', label: 'Descripción', cols: 12 },
    ];

    const group: any = {};
    this.fieldsEditarSolicitud.forEach(f => {
      const fieldName = f.name!;
      const value = solicitud[fieldName as keyof SolicitudRecoleccion] ?? '';
      group[fieldName] = new FormControl(value, [Validators.required]);
    });
    this.formEditarSolicitud = new FormGroup(group);

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

  onEvidenciaSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.nuevaEvidenciaFile = file;
      if (this.previewEvidenciaUrl) URL.revokeObjectURL(this.previewEvidenciaUrl);
      this.previewEvidenciaUrl = URL.createObjectURL(file);
    } else {
      alert('Por favor seleccione una imagen válida.');
      this.nuevaEvidenciaFile = null;
      this.previewEvidenciaUrl = null;
    }
  }

  async guardarCambios(): Promise<void> {
    if (!this.solicitudSeleccionada || !this.formEditarSolicitud.valid) {
      alert('Complete todos los campos requeridos');
      return;
    }

    const formValue = this.formEditarSolicitud.value;
    let fechaProgramadaBackend = '';
    if (this.fechaProgramadaValue) {
      const fechaSeleccionada = new Date(this.fechaProgramadaValue);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fechaSeleccionada < hoy) {
        alert('La fecha programada no puede ser anterior a hoy');
        return;
      }
      fechaProgramadaBackend = this.fechaProgramadaValue + ':00';
    }

    const estadoOriginal = this.solicitudSeleccionada.estadoPeticion;
    const datosActualizados: SolicitudRecoleccion = {
      ...this.solicitudSeleccionada,
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
          .subirEvidencia(this.solicitudSeleccionada.idSolicitud, this.nuevaEvidenciaFile)
          .toPromise();
        datosActualizados.evidencia = evidenciaUrl;
      }

      this.solicitudService.actualizarSolicitud(this.solicitudSeleccionada.idSolicitud, datosActualizados)
        .subscribe({
          next: () => {
            if (estadoOriginal === EstadoPeticion.Cancelada) {
              alert('✅ Solicitud actualizada correctamente. Tu solicitud ha sido reactivada y ahora está en estado PENDIENTE. Por favor espera la revisión.');
            } else {
              alert('✅ Solicitud actualizada correctamente.');
            }
            this.cerrarModalEditar();
            this.cargarSolicitudes();
          },
          error: (err) => {
            console.error('Error al actualizar', err);
            alert(`Error: ${err.error?.message || err.statusText}`);
          }
        });
    } catch (err) {
      console.error('Error al subir evidencia', err);
      alert('Error al subir la evidencia. La solicitud no se actualizó.');
    }
  }
}
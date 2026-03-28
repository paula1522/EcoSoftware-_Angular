import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { RutaRecoleccionService } from '../../../Services/ruta-recoleccion';
import { RutaRecoleccion, EstadoRuta } from '../../../Models/ruta-recoleccion';
import { UsuarioService } from '../../../Services/usuario.service';
import { UsuarioModel } from '../../../Models/usuario';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { ColumnaTabla, Tabla } from '../../../shared/tabla/tabla';
import { Boton } from '../../../shared/botones/boton/boton';
import { Modal } from '../../../shared/modal/modal';
import { FormComp, FieldConfig } from '../../../shared/form/form.comp/form.comp';
import { Alerta } from '../../../shared/alerta/alerta';
import { MapaRutaGestion } from '../mapa-ruta-gestion/mapa-ruta-gestion';

@Component({
  selector: 'app-admin-rutas',
  templateUrl: './admin-rutas.html',
  styleUrls: ['./admin-rutas.css'],
  imports: [COMPARTIR_IMPORTS, Tabla, Boton, Modal, FormComp, Alerta, MapaRutaGestion],
  standalone: true,
})
export class AdminRutas implements OnInit {
  rutas: RutaRecoleccion[] = [];
  cargando = false;

  tipoAlerta: 'success' | 'error' | 'warning' | 'info' = 'info';
  mensajeAlerta = '';
  mostrarAlerta = false;

  @ViewChild('modalDetalle') modalDetalle!: Modal;
  @ViewChild('modalEditar') modalEditar!: Modal;
  @ViewChild('modalEliminar') modalEliminar!: Modal;
  @ViewChild('modalReportes') modalReportes!: Modal;

  rutaSeleccionada?: RutaRecoleccion | null = null;

  formFiltros: FormGroup = new FormGroup({});
  recolectores: { id: number; nombre: string }[] = [];
  estadosRuta = Object.values(EstadoRuta);

  columnas: ColumnaTabla[] = [
    { campo: 'idRuta', titulo: 'ID' },
    { campo: 'nombre', titulo: 'Nombre' },
    { campo: 'estado', titulo: 'Estado' },
    { campo: 'recolectorNombre', titulo: 'Recolector' },
    { campo: 'fechaCreacion', titulo: 'Fecha creación' },
    { campo: 'distanciaTotal', titulo: 'Distancia (km)' },
    { campo: 'tiempoEstimado', titulo: 'Tiempo (min)' },
    { campo: 'cantidadParadas', titulo: 'Paradas' },
  ];

  // Plantillas para celdas personalizadas
  cellTemplates = {
    estado: (r: RutaRecoleccion) => {
      let clase = '';
      switch (r.estado) {
        case 'PLANIFICADA': clase = 'estado-planificada'; break;
        case 'EN_PROGRESO': clase = 'estado-progreso'; break;
        case 'FINALIZADA': clase = 'estado-finalizada'; break;
        case 'CANCELADA': clase = 'estado-cancelada'; break;
      }
      return `<span class="${clase}">${r.estado}</span>`;
    },
    fechaCreacion: (r: RutaRecoleccion) => {
      if (!r.fechaCreacion) return 'N/A';
      const fecha = new Date(r.fechaCreacion);
      return fecha.toLocaleDateString('es-CO');
    },
    distanciaTotal: (r: RutaRecoleccion) => r.distanciaTotal?.toFixed(2) || 'N/A',
    tiempoEstimado: (r: RutaRecoleccion) => r.tiempoEstimado?.toFixed(0) || 'N/A',
    cantidadParadas: (r: RutaRecoleccion) => (r.paradas?.length || 0).toString(),
    recolectorNombre: (r: RutaRecoleccion) => {
      const rec = this.recolectores.find(rec => rec.id === r.recolectorId);
      return rec ? rec.nombre : 'Desconocido';
    },
  };

  // Formulario de edición
  formEditar: FormGroup = new FormGroup({});
  fieldsEditar: FieldConfig[] = [
    { type: 'text', name: 'nombre', label: 'Nombre de la ruta', placeholder: 'Ingrese nuevo nombre', cols: 12 },
  ];

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

  constructor(
    private rutaService: RutaRecoleccionService,
    private usuarioService: UsuarioService,
  ) {}

  ngOnInit(): void {
    this.initFormFiltros();
    this.cargarRecolectores();
    this.initFormEditar();  

    this.cargarRutas();
  }

  initFormFiltros(): void {
    this.formFiltros = new FormGroup({
      nombre: new FormControl(''),
      estado: new FormControl(''),
      recolectorId: new FormControl(''),
      fechaDesde: new FormControl(''),
      fechaHasta: new FormControl(''),
    });
  }

  initFormEditar(): void {
  this.formEditar = new FormGroup({
    nombre: new FormControl('', Validators.required)  // Añade validación si es necesario
  });
}

  /**
   * Cargar usuarios con roles 3 (Empresa) y 4 (Reciclador) para el filtro.
   */
  cargarRecolectores(): void {
    this.usuarioService.listar().subscribe({
      next: (usuarios: UsuarioModel[]) => {
        // Filtrar por rol 3 o 4
        const recolectores = usuarios.filter(u => u.rolId === 3 || u.rolId === 4);
        this.recolectores = recolectores.map(u => ({ id: u.idUsuario!, nombre: u.nombre }));
      },
      error: () => this.mostrarAlertaGlobal('Error al cargar recolectores', 'error'),
    });
  }

  cargarRutas(): void {
    this.cargando = true;
    const filtros = this.formFiltros.value;

    // Obtener todas las rutas y aplicar filtros localmente
    this.rutaService.listarTodas().subscribe({
      next: (data) => {
        let resultados = data;

        if (filtros.nombre) {
          const val = filtros.nombre.toLowerCase();
          resultados = resultados.filter(r => r.nombre?.toLowerCase().includes(val));
        }
        if (filtros.estado) {
          resultados = resultados.filter(r => r.estado === filtros.estado);
        }
        if (filtros.recolectorId) {
          resultados = resultados.filter(r => r.recolectorId === Number(filtros.recolectorId));
        }
        if (filtros.fechaDesde) {
          const desde = new Date(filtros.fechaDesde);
          resultados = resultados.filter(r => {
            const fecha = new Date(r.fechaCreacion);
            return fecha >= desde;
          });
        }
        if (filtros.fechaHasta) {
          const hasta = new Date(filtros.fechaHasta);
          hasta.setHours(23, 59, 59, 999);
          resultados = resultados.filter(r => {
            const fecha = new Date(r.fechaCreacion);
            return fecha <= hasta;
          });
        }

        this.rutas = resultados;
        this.cargando = false;
      },
      error: () => {
        this.mostrarAlertaGlobal('Error al cargar rutas', 'error');
        this.cargando = false;
      },
    });
  }

  aplicarFiltros(): void {
    this.cargarRutas();
  }

  limpiarFiltros(): void {
    this.formFiltros.reset({
      nombre: '',
      estado: '',
      recolectorId: '',
      fechaDesde: '',
      fechaHasta: '',
    });
    this.cargarRutas();
  }

  // ========== MANEJADORES DE ACCIONES ==========
  abrirModalReportes(): void {
    this.modalReportes.isOpen = true;
  }

  abrirModalDetalle(ruta: RutaRecoleccion): void {
    this.rutaSeleccionada = ruta;
    this.modalDetalle.isOpen = true;
  }

  abrirModalEditar(ruta: RutaRecoleccion): void {
  this.rutaSeleccionada = ruta;
  this.formEditar.patchValue({ nombre: ruta.nombre });
  this.modalEditar.isOpen = true;
}

  abrirModalEliminar(ruta: RutaRecoleccion): void {
    this.rutaSeleccionada = ruta;
    this.modalEliminar.isOpen = true;
  }

 cerrarModalEditar(): void {
  this.modalEditar.isOpen = false;
  this.rutaSeleccionada = null;
  this.formEditar.reset();  
}

  cerrarModalEliminar(): void {
    this.modalEliminar.isOpen = false;
    this.rutaSeleccionada = null;
  }

  guardarEdicion(): void {
  if (!this.rutaSeleccionada) return;
  const nuevoNombre = this.formEditar.value.nombre;
  if (!nuevoNombre) return;

  this.rutaService.actualizarRuta(this.rutaSeleccionada.idRuta, { nombre: nuevoNombre }).subscribe({
    next: () => {
      this.mostrarAlertaGlobal('Ruta actualizada', 'success');
      this.cerrarModalEditar();
      this.cargarRutas();
    },
    error: () => this.mostrarAlertaGlobal('Error al actualizar ruta', 'error'),
  });
}

  confirmarEliminar(): void {
    if (!this.rutaSeleccionada) return;
    this.rutaService.eliminarRuta(this.rutaSeleccionada.idRuta).subscribe({
      next: () => {
        this.mostrarAlertaGlobal('Ruta eliminada', 'success');
        this.cerrarModalEliminar();
        this.cargarRutas();
      },
      error: () => this.mostrarAlertaGlobal('Error al eliminar ruta', 'error'),
    });
  }

  exportarPDF(): void {
    const filtros = this.formFiltros.value;
    this.rutaService.descargarPDF(filtros).subscribe({
      next: (data: Blob) => {
        const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'rutasReporte.pdf';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.mostrarAlertaGlobal('Error al exportar PDF', 'error'),
    });
  }

  exportarExcel(): void {
    const filtros = this.formFiltros.value;
    this.rutaService.descargarExcel(filtros).subscribe({
      next: (data: Blob) => {
        const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'rutasReporte.xlsx';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.mostrarAlertaGlobal('Error al exportar Excel', 'error'),
    });
  }

  mostrarAlertaGlobal(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;
    setTimeout(() => (this.mostrarAlerta = false), 4000);
  }
}
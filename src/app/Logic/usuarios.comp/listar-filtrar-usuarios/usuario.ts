import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UsuarioService } from '../../../Services/usuario.service';
import { UsuarioModel } from '../../../Models/usuario';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { ColumnaTabla, Tabla } from '../../../shared/tabla/tabla';
import { Boton } from '../../../shared/botones/boton/boton';
import { Modal } from '../../../shared/modal/modal';
import { FieldConfig, FormComp } from '../../../shared/form/form.comp/form.comp';
import { Alerta } from '../../../shared/alerta/alerta';
import { LocalidadNombrePipe } from "../../../core/pipes/LocalidadNombrePipe";

@Component({
  selector: 'app-usuario-tabla',
  templateUrl: './usuario.html',
  styleUrls: ['./usuario.css'],
  imports: [COMPARTIR_IMPORTS, Tabla, Boton, Modal, FormComp, Alerta, LocalidadNombrePipe],
})
export class Usuario implements OnInit {

  usuarios: UsuarioModel[] = [];
  cargando = false;





  // ============================
  // ALERTA (propiedades necesarias)
  // ============================
  tipoAlerta: 'success' | 'error' | 'warning' | 'info' = 'info';
  mensajeAlerta: string = '';
  mostrarAlerta: boolean = false;

  @ViewChild('modalReportes') modalReportes!: Modal;
  @ViewChild('modalEliminar') modalEliminar!: Modal;
  @ViewChild('modalVerPerfil') modalVerPerfil!: Modal;
  @ViewChild('modalEditarUsuario') modalEditarUsuario!: Modal;

  usuarioSeleccionado?: UsuarioModel | null = null;

  // =========================================
  // Filtros con FormComp
  // =========================================
  formFiltros: FormGroup = new FormGroup({});

  fieldsFiltros: FieldConfig[] = [
    {
      type: 'select', name: 'criterio', label: 'Criterio', cols: 4, options: [
        { value: 'nombre', text: 'Nombre' },
        { value: 'correo', text: 'Correo' },
        { value: 'documento', text: 'Documento' }
      ]
    },
    { type: 'select', name: 'rol', label: 'Rol', cols: 4 },

    {
      type: 'text', name: 'nombre', label: 'Buscar por nombre', placeholder: 'Ingrese nombre', cols: 4,
      showIf: () => this.formFiltros.get('criterio')?.value === 'nombre'
    },
    {
      type: 'text', name: 'correo', label: 'Buscar por correo', placeholder: 'Ingrese correo', cols: 4,
      showIf: () => this.formFiltros.get('criterio')?.value === 'correo'
    },
    {
      type: 'text', name: 'documento', label: 'Buscar por documento', placeholder: 'Ingrese documento', cols: 4,
      showIf: () => this.formFiltros.get('criterio')?.value === 'documento'
    },
    {
      type: 'select', name: 'estado', label: 'Estado', cols: 4, options: [
        { value: 'activo', text: 'Activo' },
        { value: 'inactivo', text: 'Inactivo' }
      ]
    }
  ];

  // =========================
  // Función para lanzar alerta
  // =========================
  mostrarAlertaGlobal(
    mensaje: string,
    tipo: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;

    setTimeout(() => {
      this.mostrarAlerta = false;
    }, 4000);
  }



  // ============================
  // Roles
  // ============================
  roles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Ciudadano' },
    { id: 3, nombre: 'Empresa' },
    { id: 4, nombre: 'Reciclador' }
  ];

  // ============================
  // Tabla
  // ============================
  columnasUsuarios: ColumnaTabla[] = [
    { campo: 'idUsuario', titulo: 'ID' },
    { campo: 'nombre', titulo: 'Nombre' },
    { campo: 'correo', titulo: 'Correo' },
    { campo: 'telefono', titulo: 'Teléfono' },
    { campo: 'localidad', titulo: 'Localidad' },
    { campo: 'rolId', titulo: 'Rol' },
    { campo: 'estado', titulo: 'Estado' }
  ];

  acciones = [
    {
      icon: 'bi bi-eye',
      texto: 'Ver',
      color: '#0d6efd',
      hover: '#0b5ed7',
      evento: (item: any) => this.abrirModalVer(item)
    },
    {
      icon: 'bi bi-pencil',
      texto: 'Editar',
      color: '#ffc107',
      hover: '#e0a800',
      evento: (item: any) => this.abrirModalEditar(item)
    },
    {
      icon: 'bi bi-trash',
      texto: 'Eliminar',
      color: '#dc3545',
      hover: '#bb2d3b',
      evento: (item: any) => this.eliminarUsuario(item.idUsuario)
    }
  ];

  cellTemplatesUsuarios = {
    localidad: (u: UsuarioModel) => {
      if (!u.localidad) return 'N/A';
      return String(u.localidad).replace(/_/g, ' ');
    },
    rolId: (u: UsuarioModel) => this.obtenerNombreRol(u.rolId),
    estado: (u: UsuarioModel) => {
      const clase = u.estado ? 'activo' : 'inactivo';
      const texto = u.estado ? 'Activo' : 'Inactivo';
      return `<span class="${clase}">${texto}</span>`;
    }
  };

  // ===============================
  // BOTONES MODALES — NO SE TOCARON
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

  HeaderbotonesHeader = [
    {
      texto: '',
      icono: 'bi-download',
      color: 'outline-custom-primary',
      accion: () => this.exportarPDF()
    }
  ];

  get accionesEliminar() {
  if (!this.usuarioSeleccionado) return [];

  const esActivo = this.usuarioSeleccionado.estado;

  return [
    {
      texto: esActivo ? 'Inactivar' : 'Activar',
      icono: esActivo ? 'bi-pause-circle' : 'bi-play-circle',
      color: esActivo ? 'warning' : 'success',
      accion: () => this.toggleEstadoUsuario()
    },
    {
      texto: 'Eliminar',
      icono: 'bi-trash',
      color: 'danger',
      accion: () => this.confirmarEliminacionFisica()
    }
  ];
}


  accionesEliminarFisico = [
    {
      texto: 'Cancelar',
      icono: 'bi-x-circle',
      color: 'cancelar',
      hover: 'btn-cancelar',
      accion: () => this.cerrarModalEliminar()
    },
    {
      texto: 'Eliminar',
      icono: 'bi-trash',
      color: 'pastel-danger',
      hover: 'btn-pastel-danger',
      accion: () => this.confirmarEliminacionFisica()
    }
  ];

  // Formulario de edición
  formEditarUsuario: FormGroup = new FormGroup({});
  fieldsEditarUsuario: FieldConfig[] = [];

  constructor(private usuarioService: UsuarioService) {
    // Inicializa controles del form
    this.fieldsFiltros.forEach(f => {
      if (f.type !== 'separator') {
        this.formFiltros.addControl(
          f.name!,
          new FormControl(f.name === 'criterio' ? 'nombre' : '')
        );
      }
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    // Inicializa el formulario de edición vacío
    this.initFormEditarUsuario();
  }

  // ===============================
  // MODALES
  // ===============================
  abrirModalReportes(): void {
    this.modalReportes.isOpen = true;
  }

  abrirModalEliminar(usuario: UsuarioModel): void {
    this.usuarioSeleccionado = usuario;
    this.modalEliminar.isOpen = true;
  }



  abrirModalVer(usuario: UsuarioModel): void {
    this.usuarioSeleccionado = usuario;
    this.modalVerPerfil.isOpen = true;
  }

  abrirModalEditar(usuario: UsuarioModel): void {
    // Asegúrate de que usuario tenga idUsuario y datos completos
    if (!usuario || !usuario.idUsuario) return;
    this.usuarioSeleccionado = usuario;
    this.initFormEditarUsuario(usuario);
    // Forzar apertura del modal
    if (this.modalEditarUsuario) {
      this.modalEditarUsuario.isOpen = true;
    }
  }

  cerrarModalEliminar(): void {
    this.modalEliminar.close();
    this.usuarioSeleccionado = null;
  }

  cerrarModalEditar(): void {
    this.modalEditarUsuario.close();
    this.usuarioSeleccionado = null;
    this.formEditarUsuario.reset();
  }

  confirmarEliminacion(): void {
    if (!this.usuarioSeleccionado?.idUsuario) return;
    this.eliminarUsuario(this.usuarioSeleccionado.idUsuario);
    this.cerrarModalEliminar();
  }

  confirmarEliminacionFisica(): void {
    if (!this.usuarioSeleccionado?.idUsuario) return;

    this.usuarioService.eliminarFisico(this.usuarioSeleccionado.idUsuario).subscribe({
      next: () => {
        this.mostrarAlertaGlobal('Usuario eliminado permanentemente', 'success');
        this.cargarUsuarios();
        this.cerrarModalEliminar();
      },
      error: () => {
        this.mostrarAlertaGlobal('Error al eliminar el usuario', 'error');
      }
    });
  }

  toggleEstadoUsuario(): void {
  if (!this.usuarioSeleccionado?.idUsuario) return;

  this.usuarioService.eliminarLogico(this.usuarioSeleccionado.idUsuario).subscribe({
    next: () => {
      const accion = this.usuarioSeleccionado?.estado ? 'inactivado' : 'activado';
      this.mostrarAlertaGlobal(`Usuario ${accion} correctamente`, 'success');
      this.cargarUsuarios();
      this.cerrarModalEliminar();
    },
    error: () => {
      this.mostrarAlertaGlobal('Error al cambiar el estado del usuario', 'error');
    }
  });
}


  // ===============================
  // USUARIOS
  // ===============================
  cargarUsuarios(): void {
    this.cargando = true;
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cargando = false;
      },
      error: () => {
        this.mostrarAlertaGlobal('Error al cargar usuarios', 'error');
        this.cargando = false;
      }
    });
  }

  // ===============================
  // FILTROS
  // ===============================
  aplicarFiltros(): void {
    this.cargando = true;
    this.usuarioService.listar().subscribe({
      next: (lista: UsuarioModel[]) => {
        let resultados = lista || [];

        const filtros = this.formFiltros.value;

        if (filtros.nombre) {
          const val = filtros.nombre.trim().toLowerCase();
          resultados = resultados.filter(u => u.nombre?.toLowerCase().includes(val));
        }

        if (filtros.correo) {
          const val = filtros.correo.trim().toLowerCase();
          resultados = resultados.filter(u => u.correo?.toLowerCase().includes(val));
        }

        if (filtros.documento) {
          const val = filtros.documento.trim().toLowerCase();
          resultados = resultados.filter(u => u.cedula?.toLowerCase().includes(val));
        }

        if (filtros.rol) {
          resultados = resultados.filter(u => u.rolId === Number(filtros.rol));
        }

        if (filtros.estado) {
          const estadoBool = filtros.estado === 'activo';
          resultados = resultados.filter(u => u.estado === estadoBool);
        }
        this.usuarios = resultados;
        this.cargando = false;
      },
      error: () => {
        this.mostrarAlertaGlobal('Error al filtrar usuarios', 'error');
        this.cargando = false;
      }
    });
  }

  limpiarFiltro(): void {
    this.formFiltros.reset({
      criterio: 'nombre',
      nombre: '',
      correo: '',
      documento: '',
      rol: '',
      estado: ''
    });
    this.cargarUsuarios();
  }

  // ===============================
  // EXPORTAR REPORTES
  // ===============================
  exportarPDF(): void {
    const filtros = this.formFiltros.value;
    this.usuarioService.descargarPDF(filtros).subscribe((data: Blob) => {
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'usuarioReporte.pdf';
      link.click();
    });
  }

  exportarExcel(): void {
    const filtros = this.formFiltros.value;
    this.usuarioService.descargarExcel(filtros).subscribe((data: Blob) => {
      const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.ms-excel' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'usuarioReporte.xlsx';
      link.click();
    });
  }

  // ===============================
  // EDICIÓN Y ELIMINACIÓN
  // ===============================
  eliminarUsuario(id: number): void {
    this.usuarioService.eliminarLogico(id).subscribe({
      next: () => {
        this.mostrarAlertaGlobal('Usuario eliminado correctamente', 'success');
        this.cargarUsuarios();
      },
      error: () => {
        this.mostrarAlertaGlobal('No se pudo eliminar el usuario', 'error');
      }
    });
  }



  // ===============================
  // EDICIÓN DE USUARIO
  // ===============================
  initFormEditarUsuario(usuario?: UsuarioModel) {
    // Campos base
    const baseFields: FieldConfig[] = [
      { type: 'text', name: 'nombre', label: 'Nombre', placeholder: 'Nombre', cols: 6 },
      { type: 'text', name: 'telefono', label: 'Teléfono', placeholder: 'Teléfono', cols: 6 },
      { type: 'text', name: 'cedula', label: 'Documento', placeholder: 'Documento', cols: 6 },
      { type: 'email', name: 'correo', label: 'Correo', placeholder: 'Correo', cols: 6 },
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
      { type: 'text', name: 'direccion', label: 'Dirección', placeholder: 'Dirección', cols: 6 },
      { type: 'text', name: 'barrio', label: 'Barrio', placeholder: 'Barrio', cols: 6 },
    ];

    // Campos por rol
    let extraFields: FieldConfig[] = [];
    const rolId = usuario?.rolId;

    if (rolId === 3) { // Empresa
      extraFields = [
        { type: 'text', name: 'nit', label: 'NIT', placeholder: 'NIT', cols: 6 },
        { type: 'text', name: 'representanteLegal', label: 'Representante Legal', placeholder: 'Representante Legal', cols: 6 }
      ];
    }
    if (rolId === 3 || rolId === 4) { // Empresa o Reciclador
      extraFields = [
        ...extraFields,
        { type: 'text', name: 'tipoMaterial', label: 'Tipo de material', placeholder: 'Tipo de material', cols: 6 },
        { type: 'text', name: 'cantidad_minima', label: 'Cantidad mínima', placeholder: 'Cantidad mínima', cols: 6 },
        { type: 'text', name: 'otrosMateriales', label: 'Otros materiales', placeholder: 'Otros materiales', cols: 12 },
        { type: 'text', name: 'horario', label: 'Horario', placeholder: 'Horario', cols: 6 },
        { type: 'text', name: 'zona_de_trabajo', label: 'Zona de trabajo', placeholder: 'Zona de trabajo', cols: 6 }
      ];
    }

    this.fieldsEditarUsuario = [
      ...baseFields,
      ...extraFields
    ];

    // Inicializa el formGroup
    const group: any = {};
    this.fieldsEditarUsuario.forEach(f => {
      group[f.name!] = new FormControl(usuario ? usuario[f.name as keyof UsuarioModel] ?? '' : '', f.type === 'email' ? [Validators.email] : []);
    });
    this.formEditarUsuario = new FormGroup(group);
  }

  actualizarUsuario(): void {
    if (!this.usuarioSeleccionado?.idUsuario) return;
    if (this.formEditarUsuario.invalid) return;

    const datosActualizados = {
      ...this.usuarioSeleccionado,
      ...this.formEditarUsuario.value
    };

    this.usuarioService.actualizar(this.usuarioSeleccionado.idUsuario, datosActualizados).subscribe({
      next: () => {
        this.mostrarAlertaGlobal('Usuario actualizado correctamente', 'success');
        this.cerrarModalEditar();
        this.cargarUsuarios();
      },
      error: () => {
        this.mostrarAlertaGlobal('Error al actualizar el usuario', 'error');
      }
    });
  }

  // ===============================
  // UTILES
  // ===============================
  obtenerNombreRol(rolId?: number): string {
    return this.roles.find(r => r.id === rolId)?.nombre ?? 'Desconocido';
  }
}

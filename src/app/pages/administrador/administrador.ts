import { RegistroAdmin } from './../../auth/registro-admin/registro-admin';
// src/app/usuario/administrador/administrador.ts
import { Component, ViewChild, ElementRef, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../Services/usuario.service';
import { UsuarioModel } from '../../Models/usuario';
import { COMPARTIR_IMPORTS } from '../../shared/imports';
import { Usuario } from "../../Logic/usuarios.comp/listar-filtrar-usuarios/usuario";
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { CapacitacionesLista } from '../../Logic/capacitaciones/listar-capacitaciones/listar-capacitaciones';
import { CargaMasiva } from '../../Logic/capacitaciones/carga-masiva/carga-masiva';
import { ListarTabla } from '../../Logic/recolecciones-comp/listar-tabla/listar-tabla';
import { GraficoUsuariosLocalidad } from '../../Logic/usuarios.comp/grafica-usuarios-localidad/grafica-usuarios-localidad';
import { BarraLateral } from '../../shared/barra-lateral/barra-lateral';
import { PuntosReciclajeService, PuntosResponse } from '../../Services/puntos-reciclaje.service';
import { PuntoReciclaje } from '../../Models/puntos-reciclaje.model';
import { SolicitudesLocalidadChartComponent } from "../../Logic/solicitudes-comp/solicitudes-localidad-chart-component/solicitudes-localidad-chart-component";
import { Titulo } from '../../shared/titulo/titulo';
import { Modal } from '../../shared/modal/modal';
import { EditarUsuario } from '../../Logic/usuarios.comp/editar-usuario/editar-usuario';
import { ReporteService } from '../../Services/reporte.service';
import { SolicitudRecoleccion } from '../../Models/solicitudes.model';
import { AceptarRechazarUsuarios } from '../../Logic/usuarios.comp/aceptar-rechazar-usuarios/aceptar-rechazar-usuarios';
import { CardsNoticias } from "../../Logic/cards-noticias.component/cards-noticias.component";
import { MapaComponent } from '../mapa/mapa.component';
import { firstValueFrom } from 'rxjs';
import Chart from 'chart.js/auto';
import type { TooltipItem } from 'chart.js';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { Boton } from '../../shared/botones/boton/boton';
import { SolicitudRecoleccionService } from '../../Services/solicitud.service';
import { Solicitudes } from "../../Logic/solicitudes-comp/listar-filtrar-solicitudes/solcitudes";
import { CapacitacionesService } from '../../Services/capacitacion.service';
import { CapacitacionDTO } from '../../Models/capacitacion.model';
import { ModulosAdminPageComponent } from '../../features/capacitaciones/pages/modulos-admin-page.component';


@Component({
  selector: 'app-administrador',
  standalone: true,
  imports: [...COMPARTIR_IMPORTS, SolicitudesLocalidadChartComponent, AceptarRechazarUsuarios, GraficoUsuariosLocalidad,
    RegistroAdmin, Usuario, ListarTabla,
    EditarUsuario, CapacitacionesLista, CargaMasiva, BarraLateral, Titulo, Modal, CardsNoticias, Tabla, Boton, Solicitudes,
    ModulosAdminPageComponent,
  ],
  templateUrl: './administrador.html',
  styleUrl: './administrador.css'
})
export class Administrador implements OnDestroy {
  usuarios: UsuarioModel[] = [];
  usuarioActual: UsuarioModel | null = null;
  nombreUsuario: string = '';
  nombreRol: string = '';
  totalUsuarios = 0;
  totalSolicitudes = 0;
  totalPuntos = 0;
  totalUsuariosPendientes = 0;
  usuariosPendientesError: string = '';

  filtroNombre: string = '';
  filtroCorreo: string = '';
  filtroDocumento: string = '';
  cargando: boolean = false;
  error: string = '';
  mensaje: string = '';
  cargandoReporte: boolean = false;

  modalRegistroOpen = false;
  modalCargaMasivaOpen = false;

  rolSeleccionado: string = '';
  archivoSeleccionado: File | null = null;
  cargandoArchivo = false;

  tipoAlerta: 'success' | 'error' | 'warning' | 'info' = 'info';
  mensajeAlerta: string = '';
  mostrarAlerta: boolean = false;

  mostrarAlertaGlobal(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info') {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;

    setTimeout(() => {
      this.mostrarAlerta = false;
    }, 5000);
  }

  vistaActual: 'panel' | 'editar-perfil' | 'usuarios' | 'solicitudes' | 'recolecciones' | 'Aceptar-Rechazar-Usuarios' | 'puntos' | 'capacitaciones' | 'noticias' = 'noticias';

  menuAbierto = true;
  perfilMenuAbierto = false;
  puntos: PuntoReciclaje[] = [];
  puntosFiltrados: PuntoReciclaje[] = [];
  vistaPuntos: 'mis' | 'todos' = 'todos';
  filtroTipoResiduo: string = ''; // Nuevo filtro
  tiposResiduoDisponibles: string[] = [
    'Plástico',
    'Papel',
    'Vidrio',
    'Metal',
    'Orgánico',
    'Electrónico',
    'Mixto',
    'Otro'
  ];
  mostrarModalRegistrarPunto = false;
  guardandoPunto = false;
  estadoRegistroPunto = '';
  errorRegistroPunto = '';
  editandoPunto = false;
  puntoEditandoId: number | null = null;
  nuevoPunto = {
    nombre: '',
    direccion: '',
    tipoResiduo: '',
    horario: '',
    descripcion: '',
  };

  columnasPuntos: ColumnaTabla[] = [
    { campo: 'nombre', titulo: 'Nombre' },
    { campo: 'direccion', titulo: 'Dirección' },
    { campo: 'horario', titulo: 'Horario' },
    { campo: 'tipoResiduo', titulo: 'Tipo de residuo' },
  ];

  puntosCellTemplates: { [campo: string]: (item: any) => string } = {
    horario: (item: any) => item?.horario || 'No informado',
    tipoResiduo: (item: any) => item?.tipoResiduo || item?.tipo_residuo || 'General',
  };

  // botones de alternar vistas
  mostrarNuevoUsuario = false;
  capacitaciones = false;
  mostrarGestionModulosCapacitaciones = false;
  capacitacionModuloSeleccionadaId: number | null = null;
  private forzarVistaCapacitaciones = false;
  creandoCapacitacion = false;
  errorCapacitacion = '';
  mensajeCapacitacion = '';
  imagenCapacitacionFile: File | null = null;
  nuevaCapacitacion: CapacitacionDTO = {
    nombre: '',
    descripcion: '',
    numeroDeClases: '',
    duracion: '',
    imagen: null,
  };
  registro: any;
  private readonly habilitarDebugSolicitudes = false;

  // Referencias a grÃ¡ficos para captura
  private usuariosPendientesChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('usuariosPendientesChart')
  set usuariosPendientesChartCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.usuariosPendientesChartRef = ref;
    if (ref) {
      setTimeout(() => this.actualizarGraficaUsuariosPendientes());
    }
  }
  @ViewChild('usuariosGrafico') usuariosGrafico!: ElementRef;
  @ViewChild('pendientesGraficoContainer') pendientesGraficoContainer?: ElementRef;
  @ViewChild('solicitudesLocalidadGrafico') solicitudesLocalidadGrafico?: ElementRef;

  @ViewChild(MapaComponent) mapaComponent?: MapaComponent;

  // Lista de solicitudes para reportes
  solicitudes: SolicitudRecoleccion[] = [];
  private readonly solicitudService = inject(SolicitudRecoleccionService);
  private usuariosPendientesChart?: Chart;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private readonly route: ActivatedRoute,
    private authService: AuthService,
    private puntosService: PuntosReciclajeService,
    private reporteService: ReporteService,
    private capacitacionesService: CapacitacionesService,
    private readonly http: HttpClient
  ) { }

  ngOnDestroy(): void {
    this.usuariosPendientesChart?.destroy();
  }

  cargarPuntos(): void {
    this.puntosService.getPuntos().subscribe({
      next: (response: PuntosResponse | PuntoReciclaje[]) => {
        const data = Array.isArray(response) ? response : response?.data ?? [];
        this.puntos = data.map((p: any) => ({
          ...p,
          latitud: p.latitud !== null && p.latitud !== undefined ? parseFloat(String(p.latitud)) : null,
          longitud: p.longitud !== null && p.longitud !== undefined ? parseFloat(String(p.longitud)) : null
        }));
        this.totalPuntos = this.puntos.length;
        this.actualizarPuntosFiltrados();
      },
      error: (err: unknown) => {
        console.error('Error al cargar puntos:', err);
        this.puntosFiltrados = [];
      }
    });
  }

  private actualizarPuntosFiltrados(): void {
    let resultado = [...this.puntos];

    // Filtrar por vista (mis puntos vs todos)
    if (this.vistaPuntos === 'mis') {
      const userId = this.authService.getUserId();
      if (userId == null) {
        this.puntosFiltrados = [];
        return;
      }
      resultado = resultado.filter((punto: any) => {
        const ownerId = punto?.usuario_id ?? punto?.usuarioId ?? punto?.idUsuario ?? null;
        return Number(ownerId) === Number(userId);
      });
    }

    // Filtrar por tipo de residuo si está seleccionado
    if (this.filtroTipoResiduo.trim()) {
      resultado = resultado.filter((punto: any) => {
        const tipoActual = this.normalizarTextoComparacion(
          (punto?.tipoResiduo || punto?.tipo_residuo || '').toString()
        );
        const filtro = this.normalizarTextoComparacion(this.filtroTipoResiduo);
        return tipoActual.includes(filtro);
      });
    }

    this.puntosFiltrados = resultado;
  }

  mostrarMisPuntos(): void {
    this.vistaPuntos = 'mis';
    this.actualizarPuntosFiltrados();
  }

  mostrarTodosLosPuntos(): void {
    this.vistaPuntos = 'todos';
    this.actualizarPuntosFiltrados();
  }

  filtrarPorTipoResiduo(): void {
    this.actualizarPuntosFiltrados();
  }

  limpiarFiltroResiduo(): void {
    this.filtroTipoResiduo = '';
    this.actualizarPuntosFiltrados();
  }

  /**
   * Calcula la distancia en km entre dos puntos usando la fÃ³rmula de Haversine
   */
  private calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  irAPaginaMapa(): void {
    this.router.navigate(['/puntos-reciclaje']);
  }

  abrirModalRegistrarPunto(): void {
    this.errorRegistroPunto = '';
    this.estadoRegistroPunto = '';
    this.editandoPunto = false;
    this.puntoEditandoId = null;
    this.reiniciarFormularioPunto();
    this.mostrarModalRegistrarPunto = true;
  }

  cerrarModalRegistrarPunto(): void {
    this.mostrarModalRegistrarPunto = false;
    this.errorRegistroPunto = '';
    this.estadoRegistroPunto = '';
    this.editandoPunto = false;
    this.puntoEditandoId = null;
  }

  async registrarPunto(): Promise<void> {
    if (!this.nuevoPunto.nombre.trim() || !this.nuevoPunto.direccion.trim() || !this.nuevoPunto.tipoResiduo.trim() ||
      !this.nuevoPunto.horario.trim() || !this.nuevoPunto.descripcion.trim()) {
      this.errorRegistroPunto = 'Todos los campos son obligatorios.';
      return;
    }

    this.guardandoPunto = true;
    this.errorRegistroPunto = '';
    this.estadoRegistroPunto = 'Convirtiendo direcciÃ³n...';

    try {
      const coords = await this.geocodificarDireccion(this.nuevoPunto.direccion.trim());
      const usuarioId = this.authService.getUserId();

      const payload: any = {
        nombre: this.nuevoPunto.nombre.trim(),
        direccion: this.nuevoPunto.direccion.trim(),
        tipoResiduo: this.nuevoPunto.tipoResiduo.trim(),
        horario: this.nuevoPunto.horario.trim(),
        descripcion: this.nuevoPunto.descripcion.trim(),
        latitud: coords.lat,
        longitud: coords.lng,
        imagen: null,
        usuarioId,
      };

      this.estadoRegistroPunto = this.editandoPunto ? 'Actualizando punto...' : 'Guardando punto...';

      const request$ = this.editandoPunto && this.puntoEditandoId != null
        ? this.puntosService.actualizarPunto(this.puntoEditandoId, payload)
        : this.puntosService.crearPunto(payload);

      request$.subscribe({
        next: (response: any) => {
          this.guardandoPunto = false;
          this.estadoRegistroPunto = '';

          // Si es creaciÃ³n de nuevo punto, agregarlo inmediatamente a la tabla
          if (!this.editandoPunto) {
            const datosPunto = response?.data || response;
            if (datosPunto) {
              const nuevoPunto: PuntoReciclaje = {
                ...datosPunto,
                latitud: datosPunto.latitud !== null && datosPunto.latitud !== undefined ? parseFloat(String(datosPunto.latitud)) : null,
                longitud: datosPunto.longitud !== null && datosPunto.longitud !== undefined ? parseFloat(String(datosPunto.longitud)) : null
              };
              this.puntos = [...this.puntos, nuevoPunto];
              this.actualizarPuntosFiltrados();
            }
          } else {
            // Si es actualizaciÃ³n, recargar desde servidor
            this.cargarPuntos();
          }

          this.reiniciarFormularioPunto();
          this.cerrarModalRegistrarPunto();
        },
        error: (err) => {
          console.error(this.editandoPunto ? 'Error al actualizar punto' : 'Error al registrar punto', err);
          this.guardandoPunto = false;
          this.estadoRegistroPunto = '';
          const detalle =
            err?.error?.message ||
            err?.error?.error ||
            (typeof err?.error === 'string' ? err.error : '') ||
            err?.message ||
            '';
          this.errorRegistroPunto = this.editandoPunto
            ? (detalle ? `No se pudo actualizar el punto: ${detalle}` : 'No se pudo actualizar el punto. Intenta nuevamente.')
            : (detalle ? `No se pudo registrar el punto: ${detalle}` : 'No se pudo registrar el punto. Intenta nuevamente.');
        }
      });
    } catch (error: any) {
      console.error('Error en conversiÃ³n de direcciÃ³n', error);
      this.guardandoPunto = false;
      this.estadoRegistroPunto = '';
      const detalle = typeof error?.message === 'string' ? error.message : '';
      this.errorRegistroPunto = detalle || 'No se pudo convertir la direcciÃ³n. Intenta con una direcciÃ³n mÃ¡s especÃ­fica.';
    }
  }

  editarPuntoDesdeTabla(punto: any): void {
    const id = this.obtenerIdPunto(punto);
    if (id == null) {
      this.errorRegistroPunto = 'No se pudo identificar el punto a editar.';
      return;
    }

    this.editandoPunto = true;
    this.puntoEditandoId = id;
    this.errorRegistroPunto = '';
    this.estadoRegistroPunto = '';
    this.nuevoPunto = {
      nombre: punto?.nombre || '',
      direccion: punto?.direccion || punto?.ubicacion || '',
      tipoResiduo: punto?.tipoResiduo || punto?.tipo_residuo || '',
      horario: punto?.horario || '',
      descripcion: punto?.descripcion || '',
    };
    this.mostrarModalRegistrarPunto = true;
  }

  eliminarPuntoDesdeTabla(punto: any): void {
    const id = this.obtenerIdPunto(punto);
    if (id == null) {
      return;
    }

    const nombre = punto?.nombre || 'este punto';
    const confirmado = window.confirm(`Â¿Deseas eliminar ${nombre}? Esta acciÃ³n no se puede deshacer.`);
    if (!confirmado) {
      return;
    }

    this.puntosService.eliminarPunto(id).subscribe({
      next: () => {
        this.cargarPuntos();
      },
      error: (err) => {
        console.error('Error al eliminar punto:', err);
      }
    });
  }

  verPuntoDesdeTabla(punto: any): void {
    const id = this.obtenerIdPunto(punto);
    const lat = Number(punto?.latitud);
    const lng = Number(punto?.longitud);

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      this.router.navigate(['/puntos-reciclaje'], {
        queryParams: { id, lat, lng, nombre: punto?.nombre || '' }
      });
      return;
    }

    this.irAPaginaMapa();
  }

  private obtenerIdPunto(punto: any): number | null {
    const raw = punto?.id ?? punto?.idPunto ?? punto?.id_punto ?? null;
    if (raw == null) {
      return null;
    }

    const id = Number(raw);
    return Number.isNaN(id) ? null : id;
  }

  private normalizeAddress(termino: string): string {
    const lower = termino.toLowerCase();
    const hasComma = termino.includes(',');
    const hasBogota = lower.includes('bogotÃ¡') || lower.includes('bogota');
    const hasColombia = lower.includes('colombia');

    if (!hasComma && !hasBogota && !hasColombia) {
      return `${termino}, BogotÃ¡, Colombia`;
    }

    return termino;
  }

  private normalizarTextoComparacion(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private async geocodificarDireccion(termino: string): Promise<{ lat: number; lng: number }> {
    const asCoords = this.parseLatLngString(termino);
    if (asCoords) {
      return asCoords;
    }

    const url = 'https://nominatim.openstreetmap.org/search';
    const query = this.normalizeAddress(termino.trim());
    const respuesta = await firstValueFrom(
      this.http.get<Array<{ lat: string; lon: string }>>(url, {
        params: {
          format: 'jsonv2',
          addressdetails: '0',
          limit: '1',
          countrycodes: 'co',
          q: query,
        },
        headers: {
          'Accept-Language': 'es',
        },
      })
    );

    const coincidencia = respuesta?.[0];
    if (!coincidencia) {
      throw new Error('No se encontrÃ³ la direcciÃ³n.');
    }

    const lat = Number(coincidencia.lat);
    const lng = Number(coincidencia.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new Error('DirecciÃ³n invÃ¡lida para coordenadas.');
    }

    return { lat, lng };
  }

  private parseLatLngString(value: string): { lat: number; lng: number } | null {
    const parts = value.split(',').map((part) => Number(part.trim()));
    if (parts.length !== 2) {
      return null;
    }

    const [lat, lng] = parts;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }

    return { lat, lng };
  }

  private reiniciarFormularioPunto(): void {
    this.nuevoPunto = {
      nombre: '',
      direccion: '',
      tipoResiduo: '',
      horario: '',
      descripcion: '',
    };
  }

  /**
   * Genera el reporte de usuarios en PDF
   */
  async generarReporteUsuarios(): Promise<void> {
    try {
      this.cargandoReporte = true;

      // Obtener el elemento del grÃ¡fico
      const graficoElement = this.usuariosGrafico?.nativeElement || null;

      // Generar el reporte
      await this.reporteService.generarReporteUsuarios(this.usuarios, graficoElement);

      this.mensaje = 'Reporte de usuarios generado exitosamente';
      setTimeout(() => this.mensaje = '', 3000);
    } catch (error) {
      console.error('Error al generar reporte de usuarios:', error);
      this.error = 'Error al generar el reporte de usuarios';
      setTimeout(() => this.error = '', 3000);
    } finally {
      this.cargandoReporte = false;
    }
  }

  /**
   * Genera el reporte de solicitudes en PDF
   */
  async generarReporteSolicitudes(): Promise<void> {
    try {
      this.cargandoReporte = true;

      // Cargar solicitudes si no las hay
      if (this.solicitudes.length === 0) {
        await new Promise((resolve, reject) => {
          this.solicitudService.listar().subscribe({
            next: (data) => {
              this.solicitudes = data;
              resolve(data);
            },
            error: reject
          });
        });
      }

      // Obtener referencias a los elementos de los grÃ¡ficos
      const graficoElements = {
        localidad: null,
        estado: null
      };

      // Generar el reporte
      await this.reporteService.generarReporteSolicitudes(this.solicitudes, graficoElements);

      this.mensaje = 'Reporte de solicitudes generado exitosamente';
      setTimeout(() => this.mensaje = '', 3000);
    } catch (error) {
      console.error('Error al generar reporte de solicitudes:', error);
      this.error = 'Error al generar el reporte de solicitudes';
      setTimeout(() => this.error = '', 3000);
    } finally {
      this.cargandoReporte = false;
    }
  }

  /**
   * Genera un único reporte general (usuarios + solicitudes)
   */
  async generarReporteGeneral(): Promise<void> {
    try {
      this.cargandoReporte = true;

      if (this.usuarios.length === 0) {
        await new Promise((resolve, reject) => {
          this.usuarioService.listar().subscribe({
            next: (lista) => {
              this.usuarios = lista.map(usuario => ({
                ...usuario,
                rol: this.obtenerNombreRol(usuario.rolId!)
              }));
              this.totalUsuarios = lista.length;
              resolve(lista);
            },
            error: reject
          });
        });
      }

      if (this.solicitudes.length === 0) {
        await new Promise((resolve, reject) => {
          this.solicitudService.listar().subscribe({
            next: (data) => {
              this.solicitudes = data;
              this.totalSolicitudes = data.length;
              resolve(data);
            },
            error: reject
          });
        });
      }

      const graficoUsuarios = this.usuariosGrafico?.nativeElement || null;
      const graficoPendientes = this.pendientesGraficoContainer?.nativeElement || null;
      const graficoSolicitudes = this.solicitudesLocalidadGrafico?.nativeElement || null;

      await this.reporteService.generarReporteGeneral(
        this.usuarios,
        this.solicitudes,
        graficoUsuarios,
        graficoSolicitudes,
        graficoPendientes,
        {
          totalUsuarios: this.totalUsuarios,
          totalSolicitudes: this.totalSolicitudes,
          totalPendientes: this.totalUsuariosPendientes,
          totalPuntos: this.totalPuntos
        }
      );

      this.mensaje = 'Reporte general generado exitosamente';
      setTimeout(() => this.mensaje = '', 3000);
    } catch (error) {
      console.error('Error al generar reporte general:', error);
      this.error = 'Error al generar el reporte general';
      setTimeout(() => this.error = '', 3000);
    } finally {
      this.cargandoReporte = false;
    }
  }

  async generarReportePuntos(): Promise<void> {
    try {
      this.cargandoReporte = true;

      let puntosReporte = this.puntosFiltrados;

      if (!puntosReporte || puntosReporte.length === 0) {
        const response = await firstValueFrom(this.puntosService.getPuntos());
        const data = Array.isArray(response) ? response : response?.data ?? [];
        puntosReporte = data as PuntoReciclaje[];
      }

      await this.reporteService.generarReportePuntos(puntosReporte, null);

      this.mensaje = 'Reporte de puntos generado exitosamente';
      setTimeout(() => this.mensaje = '', 3000);
    } catch (error) {
      console.error('Error al generar reporte de puntos:', error);
      this.error = 'Error al generar el reporte de puntos';
      setTimeout(() => this.error = '', 3000);
    } finally {
      this.cargandoReporte = false;
    }
  }

  menu: {
    vista: 'panel' | 'usuarios' | 'solicitudes' | 'recolecciones' | 'puntos' | 'capacitaciones' | 'noticias' |
    'Aceptar-Rechazar-Usuarios',
    label: string,
    icon: string
  }[] = [
      { vista: 'panel', label: 'Panel de Control', icon: 'bi bi-speedometer2' },
      { vista: 'usuarios', label: 'Usuarios', icon: 'bi bi-people' },
      { vista: 'solicitudes', label: 'Solicitudes', icon: 'bi bi-bar-chart-line' },
      { vista: 'recolecciones', label: 'Recolecciones', icon: 'bi bi-truck' },
      { vista: 'puntos', label: 'Puntos de Reciclaje', icon: 'bi bi-geo-alt' },
      { vista: 'capacitaciones', label: 'Capacitaciones', icon: 'bi bi-mortarboard-fill' },
      { vista: 'noticias', label: 'Noticias', icon: 'bi bi-newspaper' },
    ];

  registroAdmin = [
    {
      icono: 'bi bi-download',
      texto: '',
      color: 'outline-custom-success',
      hoverColor: 'custom-success-filled',
      onClick: () => this.RegistroAdmin()   // Llama al mÃ©todo correctamente
    }
  ];


  RegistroAdmin() {
    this.registro.emit();  // dispara el Output que ya tienes
  }



  // ========================
  // Botones de alternar vistas
  // ========================

  // Alternar vista de capacitaciones
  toggleVista(): void {
    this.capacitaciones = !this.capacitaciones;
    this.errorCapacitacion = '';
    this.mensajeCapacitacion = '';
  }

  crearCapacitacionDesdeAdmin(): void {
    this.errorCapacitacion = '';
    this.mensajeCapacitacion = '';

    if (!this.nuevaCapacitacion.nombre.trim() || !this.nuevaCapacitacion.descripcion.trim()) {
      this.errorCapacitacion = 'Nombre y descripcion son obligatorios.';
      return;
    }

    if (!String(this.nuevaCapacitacion.numeroDeClases || '').trim() || !String(this.nuevaCapacitacion.duracion || '').trim()) {
      this.errorCapacitacion = 'Numero de clases y duracion son obligatorios.';
      return;
    }

    this.creandoCapacitacion = true;

    const payload: CapacitacionDTO = {
      ...this.nuevaCapacitacion,
      numeroDeClases: String(this.nuevaCapacitacion.numeroDeClases).trim(),
      duracion: String(this.nuevaCapacitacion.duracion).trim(),
    };

    this.capacitacionesService.crearCapacitacion(payload).subscribe({
      next: (capacitacionCreada) => {
        const capacitacionId = capacitacionCreada?.id;

        if (this.imagenCapacitacionFile && capacitacionId) {
          this.capacitacionesService.subirImagenCapacitacion(capacitacionId, this.imagenCapacitacionFile).subscribe({
            next: () => {
              this.mensajeCapacitacion = 'Capacitacion creada correctamente.';
              this.creandoCapacitacion = false;
              this.restablecerFormularioCapacitacion();
              this.capacitaciones = false;
            },
            error: (err) => {
              const backendMessage =
                err?.error?.message ||
                err?.error?.error ||
                (typeof err?.error === 'string' ? err.error : '');
              this.errorCapacitacion = backendMessage || 'Capacitacion creada, pero no se pudo subir la imagen.';
              this.creandoCapacitacion = false;
            }
          });
          return;
        }

        this.mensajeCapacitacion = 'Capacitacion creada correctamente.';
        this.creandoCapacitacion = false;
        this.restablecerFormularioCapacitacion();
        this.capacitaciones = false;
      },
      error: (err) => {
        const backendMessage =
          err?.error?.message ||
          err?.error?.error ||
          (typeof err?.error === 'string' ? err.error : '');
        this.errorCapacitacion = backendMessage || 'No se pudo crear la capacitacion.';
        this.creandoCapacitacion = false;
      }
    });
  }

  onImagenCapacitacionSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.imagenCapacitacionFile = null;
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorCapacitacion = 'Solo se permiten archivos de imagen.';
      this.imagenCapacitacionFile = null;
      input.value = '';
      return;
    }

    this.errorCapacitacion = '';
    this.imagenCapacitacionFile = file;
  }

  cancelarCreacionCapacitacion(): void {
    this.restablecerFormularioCapacitacion();
    this.capacitaciones = false;
  }

  private restablecerFormularioCapacitacion(): void {
    this.errorCapacitacion = '';
    this.mensajeCapacitacion = '';
    this.imagenCapacitacionFile = null;
    this.nuevaCapacitacion = {
      nombre: '',
      descripcion: '',
      numeroDeClases: '',
      duracion: '',
      imagen: null,
    };
  }

  // Alternar vista de nuevo usuario
  toggleNuevoUsuario(): void {
    this.mostrarNuevoUsuario = !this.mostrarNuevoUsuario;
  }

  ngOnInit(): void {

    this.route.queryParamMap.subscribe((params) => {
      const vista = (params.get('vista') || '').toLowerCase();
      const seccion = (params.get('seccion') || '').toLowerCase();
      const capIdParam = Number(params.get('capacitacionId'));

      if (vista === 'capacitaciones' && seccion === 'modulos') {
        this.forzarVistaCapacitaciones = true;
        this.vistaActual = 'capacitaciones';
        this.capacitaciones = false;
        this.mostrarGestionModulosCapacitaciones = true;
        this.capacitacionModuloSeleccionadaId = Number.isNaN(capIdParam) || capIdParam <= 0 ? null : capIdParam;
      } else {
        this.forzarVistaCapacitaciones = false;
        this.mostrarGestionModulosCapacitaciones = false;
        this.capacitacionModuloSeleccionadaId = null;
      }
    });



    this.usuarioService.contarPendientesAdminDashboard().subscribe({
      next: (pendientes: number) => {
        this.usuariosPendientesError = '';
        this.totalUsuariosPendientes = Number(pendientes ?? 0);
        this.actualizarGraficaUsuariosPendientes();

        // Mantener la navegaciÃ³n existente: si hay pendientes â†’ vista Aceptar/Rechazar
        if (this.forzarVistaCapacitaciones) {
          return;
        }

        if (this.totalUsuariosPendientes > 0) {
          this.vistaActual = 'Aceptar-Rechazar-Usuarios';
        } else {
          this.vistaActual = 'panel';
        }
      },
      error: (err) => {
        console.error('Error contando usuarios pendientes (admin dashboard):', err);
        this.usuariosPendientesError = 'No se pudo cargar usuarios pendientes.';
        this.actualizarGraficaUsuariosPendientes();
        if (!this.forzarVistaCapacitaciones) {
          this.vistaActual = 'panel';
        }
      }
    });
    this.consultarUsuarios();

    // Cargar solicitudes para reportes
    this.solicitudService.listar().subscribe({
      next: (data) => {
        this.solicitudes = data;
        this.totalSolicitudes = data.length;
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
      }
    });

    // Cargar puntos para el mapa cuando el admin abra la secciÃ³n
    this.cargarPuntos();

    // Recuperar usuario logueado
    this.usuarioActual = this.usuarioService.obtenerUsuarioActual();
    if (this.usuarioActual) {
      this.nombreUsuario = this.usuarioActual.nombre;
      this.nombreRol = this.obtenerNombreRol(this.usuarioActual.rolId!);
    } else {
      // Si no hay sesiÃ³n, redirige al login

    }

    // DEBUGGING opcional (puede impactar rendimiento si hay muchos registros)
    if (this.habilitarDebugSolicitudes) {
      this.cargarDatosRealesParaDebug();
    }
  }

  private cargarDatosRealesParaDebug(): void {
    console.group('ANÃLISIS DE SOLICITUDES - DEBUG');

    // Obtener TODAS las solicitudes
    this.solicitudService.obtenerTodasLasSolicitudes().subscribe({
      next: (todas) => {
        console.log('TODAS LAS SOLICITUDES:', todas);

        // Agrupar por localidad
        const porLocalidad: { [key: string]: number } = {};
        const porEstado: { [key: string]: number } = {};
        const porEstadoYLocalidad: { [estado: string]: { [localidad: string]: number } } = {};

        todas.forEach((sol: any) => {
          const loc = sol.localidad || sol.localidadDescripcion || 'Sin localidad';
          const estRaw = sol.estadoPeticion ?? sol.estado ?? 'Sin estado';
          const est = String(estRaw);

          // Contar por localidad
          porLocalidad[loc] = (porLocalidad[loc] || 0) + 1;

          // Contar por estado
          porEstado[est] = (porEstado[est] || 0) + 1;

          // Contar por estado Y localidad
          if (!porEstadoYLocalidad[est]) {
            porEstadoYLocalidad[est] = {};
          }
          porEstadoYLocalidad[est][loc] = (porEstadoYLocalidad[est][loc] || 0) + 1;
        });

        console.log('SOLICITUDES POR LOCALIDAD:', porLocalidad);
        console.log('SOLICITUDES POR ESTADO:', porEstado);
        console.log('SOLICITUDES POR ESTADO Y LOCALIDAD:', porEstadoYLocalidad);

        // Resumen
        console.log(`RESUMEN:
- Total solicitudes: ${todas.length}
- Localidades: ${Object.keys(porLocalidad).length}
- Estados: ${Object.keys(porEstado).length}
- Pendientes: ${porEstado['Pendiente'] || 0}
- Aceptadas: ${porEstado['Aceptada'] || 0}
- Rechazadas: ${porEstado['Rechazada'] || 0}`);
      },
      error: (err) => {
        console.error('Error al obtener solicitudes:', err);
      }
    });

    // TambiÃ©n intentar los endpoints especÃ­ficos de grÃ¡ficos
    console.group('ENDPOINTS ESPECÃFICOS DE GRÃFICOS');

    this.solicitudService.getSolicitudesPorLocalidad().subscribe({
      next: (data) => {
        console.log('getSolicitudesPorLocalidad:', data);
      },
      error: (err) => {
        console.warn('getSolicitudesPorLocalidad fallÃ³:', err.message);
        this.solicitudService.getSolicitudesPorLocalidadFactory().subscribe({
          next: (data) => console.log('getSolicitudesPorLocalidadFactory (fallback):', data),
          error: (e) => console.warn('Fallback tambiÃ©n fallÃ³:', e.message)
        });
      }
    });

    this.solicitudService.getPendientesYAceptadas().subscribe({
      next: (data) => {
        console.log('getPendientesYAceptadas:', data);
      },
      error: (err) => {
        console.warn('getPendientesYAceptadas fallÃ³:', err.message);
      }
    });

    this.solicitudService.getRechazadasPorMotivo().subscribe({
      next: (data) => {
        console.log('getRechazadasPorMotivo:', data);
      },
      error: (err) => {
        console.warn('getRechazadasPorMotivo fallÃ³:', err.message);
      }
    });

    console.groupEnd();
    console.groupEnd();
  }

  // Estado de autenticaciÃ³n para mostrar en UI
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get tokenPreview(): string | null {
    const t = this.authService.getToken();
    if (!t) return null;
    return t.length > 24 ? `${t.slice(0, 12)}...${t.slice(-8)}` : t;
  }

  // ========================
  // CAMBIAR VISTA
  // ========================
  cambiarVista(vista: 'panel' | 'editar-perfil' | 'Aceptar-Rechazar-Usuarios' | 'usuarios' | 'solicitudes' | 'recolecciones' | 'puntos' | 'capacitaciones' | 'noticias') {
    this.vistaActual = vista;

    if (vista === 'panel') {
      setTimeout(() => this.actualizarGraficaUsuariosPendientes());
    }

    if (vista !== 'capacitaciones') {
      this.mostrarGestionModulosCapacitaciones = false;
      this.capacitacionModuloSeleccionadaId = null;
      this.forzarVistaCapacitaciones = false;
    }

    // Cargar puntos cuando se abre la vista de puntos
    if (vista === 'puntos') {
      this.cargarPuntos();
    }
  }

  volverAListaCapacitaciones(): void {
    this.mostrarGestionModulosCapacitaciones = false;
    this.capacitacionModuloSeleccionadaId = null;
    this.forzarVistaCapacitaciones = false;
    this.vistaActual = 'capacitaciones';

    this.router.navigate(['/administrador'], {
      queryParams: {
        vista: 'capacitaciones',
      },
      replaceUrl: true,
    });
  }

  // ========================
  // CONSULTAR TODOS LOS USUARIOS
  // ========================
  consultarUsuarios(): void {
    this.cargando = true;
    this.usuarioService.listar().subscribe({



      next: (lista) => {
        this.usuarios = lista.map(usuario => ({
          ...usuario,
          rol: this.obtenerNombreRol(usuario.rolId!)
        }));
        this.totalUsuarios = lista.length;
        this.actualizarGraficaUsuariosPendientes();

        this.cargando = false;
        this.mensaje = `Se cargaron ${lista.length} usuario(s)`;
        setTimeout(() => this.mensaje = '', 2500);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.error = 'Error al cargar la lista de usuarios';
        this.cargando = false;
        setTimeout(() => this.error = '', 2500);
      }
    });
  }

  private actualizarGraficaUsuariosPendientes(): void {
    if (!this.usuariosPendientesChartRef?.nativeElement) {
      return;
    }

    const canvas = this.usuariosPendientesChartRef.nativeElement;

    if (this.usuariosPendientesChart) {
      this.usuariosPendientesChart.destroy();
    }

    const pendientes = Math.max(this.totalUsuariosPendientes, 0);
    const hayPendientes = pendientes > 0;

    this.usuariosPendientesChart = new Chart(canvas, {
      type: 'doughnut',
      data: hayPendientes
        ? {
            labels: ['Pendientes'],
            datasets: [{
              data: [pendientes],
              backgroundColor: ['#8b1e2d'],
              borderColor: ['#ffffff'],
              borderWidth: 4,
              hoverOffset: 6
            }]
          }
        : {
            labels: ['Sin pendientes'],
            datasets: [{
              data: [1],
              backgroundColor: ['#e6efe7'],
              borderColor: ['#ffffff'],
              borderWidth: 4
            }]
          },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            display: false,
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 18,
              color: '#365241',
              font: {
                family: 'inherit',
                size: 12,
                weight: 600
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'doughnut'>) => {
                const valor = Number(context.raw ?? 0);
                return `${context.label}: ${this.formatMetric(valor)}`;
              }
            }
          }
        },
        animation: {
          duration: 650
        }
      }
    });
  }

  irAUsuariosPendientes(): void {
    this.cambiarVista('Aceptar-Rechazar-Usuarios');
  }

  // ========================
  // OBTENER NOMBRE DE ROL
  // ========================
  private obtenerNombreRol(rolId: number): string {
    switch (rolId) {
      case 1: return 'Administrador';
      case 2: return 'Ciudadano';
      case 3: return 'Empresa';
      case 4: return 'Reciclador';
      default: return 'Desconocido';
    }
  }

  // ========================
  // CERRAR SESIÃ“N
  // ========================
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
    if (!this.menuAbierto) this.perfilMenuAbierto = false;
  }

  togglePerfilMenu() {
    this.perfilMenuAbierto = !this.perfilMenuAbierto;
  }

  openCreateFromTitulo(): void {
    const mapId = this.mapaComponent?.mapContainerId;
    if (!mapId) {
      console.warn('No se encontrÃ³ el componente de mapa para enfocar.');
      return;
    }
    document.getElementById(mapId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  editarPerfil(): void {
    this.vistaActual = 'editar-perfil';
  }

  formatMetric(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: value % 1 === 0 ? 0 : 1,
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    }).format(value);
  }


  abrirModalRegistro() {
    this.modalRegistroOpen = true;
  }

  abrirModalCargaMasiva() {
    this.modalCargaMasivaOpen = true;
  }

  descargarPlantillaExcel() {
    if (!this.rolSeleccionado) {
      this.mostrarAlertaGlobal('Seleccione un rol', 'warning');
      return;
    }

    this.usuarioService.descargarPlantilla(this.rolSeleccionado)
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plantilla_${this.rolSeleccionado}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
    }
  }

 cargarExcel() {
  if (!this.rolSeleccionado || !this.archivoSeleccionado) {
    this.mostrarAlertaGlobal('Debe seleccionar rol y archivo', 'warning');
    return;
  }

  this.cargandoArchivo = true;

  this.usuarioService.cargarExcel(this.archivoSeleccionado, this.rolSeleccionado)
    .subscribe({
      next: (res: any) => {

        if (res?.errores && res.errores.length > 0) {
          this.mostrarAlertaGlobal(
            `âš ï¸ Carga completada con errores: ${res.errores.join(' | ')}`,
            'warning'
          );
        } else {
          this.mostrarAlertaGlobal(
            'âœ… Carga masiva de usuarios exitosa',
            'success'
          );
        }

        this.consultarUsuarios();
        this.archivoSeleccionado = null;
        this.cargandoArchivo = false;
        this.modalCargaMasivaOpen = false;
      },

      error: (err) => {
        console.error('ERROR REAL:', err);

        const mensaje =
          err?.error?.mensaje ||
          err?.error?.detalle ||
          'Error inesperado al cargar archivo';

        this.mostrarAlertaGlobal(mensaje, 'error');

        this.cargandoArchivo = false;
      }
    });
}
}


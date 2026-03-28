import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UsuarioService } from '../../Services/usuario.service';
import { UsuarioModel } from '../../Models/usuario';
import { COMPARTIR_IMPORTS } from '../../shared/imports';
import { Router } from '@angular/router';
import { CardARSolicitud } from '../../Logic/solicitudes-comp/card-a-r-solicitud/card-a-r-solicitud';
import { CardsRecoleccion } from '../../Logic/recolecciones-comp/cards-recoleccion/cards-recoleccion';
import { BarraLateral } from '../../shared/barra-lateral/barra-lateral';
import { Titulo } from '../../shared/titulo/titulo';
import { PuntosReciclajeService, PuntosResponse } from '../../Services/puntos-reciclaje.service';
import { PuntoReciclaje } from '../../Models/puntos-reciclaje.model';
import { EditarUsuario } from '../../Logic/usuarios.comp/editar-usuario/editar-usuario';
import { CardsNoticias } from "../../Logic/cards-noticias.component/cards-noticias.component";
import { DashboardEmpresaComponent } from '../../Logic/empresa/dashboard-empresa/dashboard-empresa';
import { Modal } from '../../shared/modal/modal';
import { Tabla, ColumnaTabla } from '../../shared/tabla/tabla';
import { AuthService } from '../../auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { MisCapacitacionesComponent } from '../../Logic/capacitaciones/mis-capacitaciones/mis-capacitaciones';
import { RecolectorRutas } from '../../Logic/rutas/recolector-rutas/recolector-rutas';
import { CrearRuta } from "../../Logic/rutas/crear-ruta/crear-ruta";
import { CapacitacionesCrudComponent } from '../../Logic/capacitaciones/card-crud-capacitacion/card-crud-capacitacion';

/**
 * Interfaz para los elementos del menú lateral.
 */
interface MenuItem {
  vista: 'panel' | 'solicitudes' | 'recolecciones' | 'rutas' | 'puntos' | 'capacitaciones' | 'noticias'|'editar-perfil';
  label: string;
  icon: string;
}

/**
 * Componente principal de la vista empresa.
 * Controla el menú lateral, la navegación y la sesión del usuario.
 */
@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [COMPARTIR_IMPORTS, CardARSolicitud, CardsRecoleccion, DashboardEmpresaComponent,

    EditarUsuario, BarraLateral, Titulo, CardsNoticias, Modal, Tabla, MisCapacitacionesComponent, RecolectorRutas, CrearRuta, CapacitacionesCrudComponent],

  templateUrl: './empresa.html',
  styleUrls: ['./empresa.css']
})
export class Empresa {

  // ========================
  // PROPIEDADES
  // ========================
  menuAbierto: boolean = true;
  perfilMenuAbierto: boolean = false;
  vistaActual: MenuItem['vista'] = 'panel'; // vista por defecto
  nombreUsuario: string = localStorage.getItem('nombreUsuario') ?? 'Usuario';
  nombreRol: string = localStorage.getItem('nombreRol') ?? 'Rol';
  mostrarInscripcionCapacitacion = false;
  detalleModulosCapacitacionAbierto = false;


  puntos: PuntoReciclaje[] = [];
  puntosList: PuntoReciclaje[] = [];
  puntosFiltrados: PuntoReciclaje[] = [];
  vistaPuntos: 'mis' | 'todos' = 'todos';
  filtroTipoResiduo = '';
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
  accionesPuntosVisibles: string[] = ['ver', 'editar', 'eliminar'];

  menu: MenuItem[] = [
    { vista: 'panel', label: 'Panel de Control', icon: 'bi bi-speedometer2' },
    { vista: 'solicitudes', label: 'Solicitudes', icon: 'bi bi-bar-chart-line' },
    { vista: 'recolecciones', label: 'Recolecciones', icon: 'bi bi-truck' },
    { vista: 'rutas', label: 'Rutas', icon: 'bi bi-map' },
    { vista: 'puntos', label: 'Puntos de Reciclaje', icon: 'bi bi-geo-alt' },
    { vista: 'capacitaciones', label: 'Capacitaciones', icon: 'bi bi-mortarboard-fill' },
    { vista: 'noticias', label: 'Noticias', icon: 'bi bi-newspaper' },
  ];
mostrarNuevaSolicitud: any;

  /**
   * Dependencias inyectadas por el constructor:
   * - usuarioService: Servicio de usuario para autenticación y sesión.
   * - router: Router para navegación.
   */

  constructor(
    public usuarioService: UsuarioService,
    public router: Router,
    private puntosService: PuntosReciclajeService,
    private authService: AuthService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cargarPuntos();
  }

  
  toggleVista(): void {
    this.mostrarNuevaSolicitud = !this.mostrarNuevaSolicitud;
  }

  cargarPuntos(): void {
    this.puntosService.getPuntos().subscribe({
      next: (response: PuntosResponse | PuntoReciclaje[]) => {
        const data = Array.isArray(response) ? response : response?.data ?? [];
        this.puntosList = data.map((p: any) => ({
          ...p,
          latitud: p.latitud !== null && p.latitud !== undefined ? parseFloat(String(p.latitud)) : null,
          longitud: p.longitud !== null && p.longitud !== undefined ? parseFloat(String(p.longitud)) : null
        }));
        this.puntos = this.puntosList;
        this.actualizarPuntosFiltrados();
      },
      error: (err: unknown) => {
        console.error('Error al cargar puntos:', err);
        this.puntos = [];
        this.puntosFiltrados = [];
      }
    });
  }

  private actualizarPuntosFiltrados(): void {
    let resultado = [...this.puntos];

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

    if (this.filtroTipoResiduo.trim()) {
      resultado = resultado.filter((punto: any) => {
        const tipoActual = (punto?.tipoResiduo || punto?.tipo_residuo || '').toString().toLowerCase();
        return tipoActual.includes(this.filtroTipoResiduo.toLowerCase());
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

  toggleVistaCapacitaciones(): void {
    this.mostrarInscripcionCapacitacion = !this.mostrarInscripcionCapacitacion;
    if (this.mostrarInscripcionCapacitacion) {
      this.detalleModulosCapacitacionAbierto = false;
    }
  }

  onCapacitacionInscrita(): void {
    this.mostrarInscripcionCapacitacion = false;
  }

  onDetalleModulosChange(abierto: boolean): void {
    this.detalleModulosCapacitacionAbierto = abierto;
  }

  filtrarPorTipoResiduo(): void {
    this.actualizarPuntosFiltrados();
  }

  limpiarFiltroResiduo(): void {
    this.filtroTipoResiduo = '';
    this.actualizarPuntosFiltrados();
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
    this.estadoRegistroPunto = 'Convirtiendo dirección...';

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

          if (!this.editandoPunto) {
            const datosPunto = response?.data || response;
            if (datosPunto) {
              const nuevoPuntoCreado: PuntoReciclaje = {
                ...datosPunto,
                latitud: datosPunto.latitud !== null && datosPunto.latitud !== undefined ? parseFloat(String(datosPunto.latitud)) : null,
                longitud: datosPunto.longitud !== null && datosPunto.longitud !== undefined ? parseFloat(String(datosPunto.longitud)) : null
              };
              this.puntos = [...this.puntos, nuevoPuntoCreado];
              this.puntosList = this.puntos;
              this.actualizarPuntosFiltrados();
            }
          } else {
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
      console.error('Error en conversión de dirección', error);
      this.guardandoPunto = false;
      this.estadoRegistroPunto = '';
      const detalle = typeof error?.message === 'string' ? error.message : '';
      this.errorRegistroPunto = detalle || 'No se pudo convertir la dirección. Intenta con una dirección más específica.';
    }
  }

  editarPuntoDesdeTabla(punto: any): void {
    if (!this.accionPuntoVisible('editar', punto)) {
      return;
    }

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
    if (!this.accionPuntoVisible('eliminar', punto)) {
      return;
    }

    const id = this.obtenerIdPunto(punto);
    if (id == null) {
      return;
    }

    const nombre = punto?.nombre || 'este punto';
    const confirmado = window.confirm(`¿Deseas eliminar ${nombre}? Esta acción no se puede deshacer.`);
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

  accionPuntoVisible(accion: string, punto: PuntoReciclaje): boolean {
    if (accion === 'ver') {
      return true;
    }

    if (accion === 'editar') {
      return this.vistaPuntos === 'mis' && this.esPuntoDelUsuario(punto);
    }

    if (accion === 'eliminar') {
      return this.vistaPuntos === 'mis' && this.esPuntoDelUsuario(punto);
    }

    return false;
  }

  private obtenerIdPunto(punto: any): number | null {
    const raw = punto?.id ?? punto?.idPunto ?? punto?.id_punto ?? null;
    if (raw == null) {
      return null;
    }

    const id = Number(raw);
    return Number.isNaN(id) ? null : id;
  }

  private esPuntoDelUsuario(punto: any): boolean {
    const userId = this.authService.getUserId();
    if (userId == null) {
      return false;
    }

    const ownerId = punto?.usuario_id ?? punto?.usuarioId ?? punto?.idUsuario ?? null;
    return Number(ownerId) === Number(userId);
  }

  private normalizeAddress(termino: string): string {
    const lower = termino.toLowerCase();
    const hasComma = termino.includes(',');
    const hasBogota = lower.includes('bogotá') || lower.includes('bogota');
    const hasColombia = lower.includes('colombia');

    if (!hasComma && !hasBogota && !hasColombia) {
      return `${termino}, Bogotá, Colombia`;
    }

    return termino;
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
      throw new Error('No se encontró la dirección.');
    }

    const lat = Number(coincidencia.lat);
    const lng = Number(coincidencia.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new Error('Dirección inválida para coordenadas.');
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

  // ========================
  // MÉTODOS DEL SIDEBAR
  // ========================

  /**
   * Alterna el estado del menú lateral.
   */
  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
    if (!this.menuAbierto) {
      this.perfilMenuAbierto = false; // cerrar perfil si colapsa
    }
  }

  /**
   * Cambia la vista actual del panel.
   * @param vista Vista seleccionada
   */
  cambiarVista(vista: MenuItem['vista']): void {
    this.vistaActual = vista;
    if (vista !== 'capacitaciones') {
      this.mostrarInscripcionCapacitacion = false;
      this.detalleModulosCapacitacionAbierto = false;
    }
    this.perfilMenuAbierto = false;
  }

  /**
   * Alterna el menú de perfil.
   */
  togglePerfilMenu(): void {
    this.perfilMenuAbierto = !this.perfilMenuAbierto;
  }

  /**
   * Cierra la sesión del usuario y redirige al inicio.
   */
  cerrarSesion(): void {
    this.authService.logout(); // limpia el localStorage
    this.router.navigate(['/']); // redirige al index

    // Opcional: mensaje de confirmación
    alert('Sesión cerrada correctamente');
  }

  editarPerfil(): void {
    this.vistaActual = 'editar-perfil';
}
}

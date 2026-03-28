import { Component } from '@angular/core';
import { COMPARTIR_IMPORTS } from '../../shared/imports';
import { BarraLateral } from '../../shared/barra-lateral/barra-lateral';
import { Titulo } from '../../shared/titulo/titulo';
import { UsuarioService } from '../../Services/usuario.service';
import { PuntoReciclaje, PuntosReciclajeService, PuntosResponse } from '../../Services/puntos-reciclaje.service';
import { Router } from '@angular/router';
import { EditarUsuario } from '../../Logic/usuarios.comp/editar-usuario/editar-usuario';
import { CardARSolicitud } from '../../Logic/solicitudes-comp/card-a-r-solicitud/card-a-r-solicitud';
import { CardsRecoleccion } from '../../Logic/recolecciones-comp/cards-recoleccion/cards-recoleccion';
import { ColumnaTabla, Tabla } from '../../shared/tabla/tabla';
import { DashboardRecicladorComponent } from '../../Logic/reciclador/dashboard-reciclador/dashboard-reciclador';
import { MisCapacitacionesComponent } from '../../Logic/capacitaciones/mis-capacitaciones/mis-capacitaciones';
import { RecolectorRutas } from "../../Logic/rutas/recolector-rutas/recolector-rutas";
import { CapacitacionesCrudComponent } from '../../Logic/capacitaciones/card-crud-capacitacion/card-crud-capacitacion';


interface MenuItem {
  vista: 'panel' | 'solicitudes' | 'recolecciones' | 'rutas' | 'puntos' | 'capacitaciones' | 'noticias'|'editar-perfil';
  label: string;
  icon: string;
}
@Component({
  selector: 'app-reciclador',
  standalone: true,
  imports: [COMPARTIR_IMPORTS, BarraLateral, Titulo, EditarUsuario, CardARSolicitud, CardsRecoleccion, Tabla,
    DashboardRecicladorComponent, MisCapacitacionesComponent, RecolectorRutas, CapacitacionesCrudComponent],
  templateUrl: './reciclador.html',
  styleUrls: ['./reciclador.css']
})
export class Reciclador {
  
  // ========================
  // PROPIEDADES
  // ========================
  menuAbierto: boolean = true;
  perfilMenuAbierto: boolean = false;
  vistaActual: MenuItem['vista'] = 'panel'; // vista por defecto
  mostrarInscripcionCapacitacion = false;
  detalleModulosCapacitacionAbierto = false;
  nombreUsuario: string = localStorage.getItem('nombreUsuario') ?? 'Usuario';
  nombreRol: string = localStorage.getItem('nombreRol') ?? 'Rol';
  puntos: PuntoReciclaje[] = [];
  vistaPuntos: 'todos' = 'todos';

  columnasPuntos: ColumnaTabla[] = [
    { campo: 'nombre', titulo: 'Nombre' },
    { campo: 'direccion', titulo: 'Dirección' },
    { campo: 'horario', titulo: 'Horario' },
    { campo: 'tipoResiduo', titulo: 'Tipo Residuo' },
  ];

  puntosCellTemplates: { [campo: string]: (item: any) => string } = {
    horario: (item: any) => item?.horario || 'No informado',
    tipoResiduo: (item: any) => item?.tipoResiduo || item?.tipo_residuo || 'General',
  };

  menu: MenuItem[] = [
    { vista: 'panel', label: 'Panel de Control', icon: 'bi bi-speedometer2' },
    { vista: 'solicitudes', label: 'Solicitudes', icon: 'bi bi-bar-chart-line' },
    { vista: 'recolecciones', label: 'Recolecciones', icon: 'bi bi-truck' },
    { vista: 'rutas', label: 'Rutas', icon: 'bi bi-map' },

    { vista: 'puntos', label: 'Puntos de Reciclaje', icon: 'bi bi-geo-alt' },
    { vista: 'capacitaciones', label: 'Capacitaciones', icon: 'bi bi-mortarboard-fill' },
    { vista: 'noticias', label: 'Noticias', icon: 'bi bi-newspaper' },
  ];

  /**
   * Dependencias inyectadas por el constructor:
   * - usuarioService: Servicio de usuario para autenticación y sesión.
   * - router: Router para navegación.
   */

  constructor(
    public usuarioService: UsuarioService,
    public router: Router,
    private puntosService: PuntosReciclajeService
  ) {}

  ngOnInit(): void {
    this.cargarPuntos();
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
      },
      error: (err: unknown) => {
        console.error('Error al cargar puntos:', err);
      }
    });
  }

  get puntosFiltrados(): PuntoReciclaje[] {
    return this.puntos;
  }

  mostrarTodosLosPuntos(): void {
    this.vistaPuntos = 'todos';
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

  irAPaginaMapa(): void {
    this.router.navigate(['/puntos-reciclaje']);
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
    this.usuarioService.logout(); // limpia el localStorage
    this.router.navigate(['/']); // redirige al index

    // Opcional: mensaje de confirmación
    alert('Sesión cerrada correctamente');
  }

  editarPerfil(): void {
    this.vistaActual = 'editar-perfil';
  }
}

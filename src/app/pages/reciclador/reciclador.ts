import { Component, ViewChild } from '@angular/core';
import { COMPARTIR_IMPORTS } from '../../shared/imports';
import { BarraLateral } from '../../shared/barra-lateral/barra-lateral';
import { Titulo } from '../../shared/titulo/titulo';
import { UsuarioService } from '../../Services/usuario.service';
import { MapaComponent } from '../mapa/mapa.component';
import { PuntoReciclaje, PuntosReciclajeService, PuntosResponse } from '../../Services/puntos-reciclaje.service';
import { Router } from '@angular/router';
import { EditarUsuario } from '../../Logic/usuarios.comp/editar-usuario/editar-usuario';
import { CardARSolicitud } from '../../Logic/solicitudes-comp/card-a-r-solicitud/card-a-r-solicitud';
import { CardsRecoleccion } from '../../Logic/recolecciones-comp/cards-recoleccion/cards-recoleccion';


interface MenuItem {
  vista: 'panel' | 'solicitudes' | 'recolecciones' | 'puntos' | 'noticias'|'editar-perfil';
  label: string;
  icon: string;
}
@Component({
  selector: 'app-reciclador',
  standalone: true,
  imports: [COMPARTIR_IMPORTS, BarraLateral, Titulo, MapaComponent, EditarUsuario, CardARSolicitud, CardsRecoleccion],
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
  nombreUsuario: string = localStorage.getItem('nombreUsuario') ?? 'Usuario';
  nombreRol: string = localStorage.getItem('nombreRol') ?? 'Rol';


  mostrarPuntos = false;
  puntosList: PuntoReciclaje[] = [];

  @ViewChild(MapaComponent) mapaComponent?: MapaComponent;

  menu: MenuItem[] = [
    { vista: 'panel', label: 'Panel de Control', icon: 'bi bi-speedometer2' },
    { vista: 'solicitudes', label: 'Solicitudes', icon: 'bi bi-bar-chart-line' },
    { vista: 'recolecciones', label: 'Recolecciones', icon: 'bi bi-truck' },
    { vista: 'puntos', label: 'Puntos de Reciclaje', icon: 'bi bi-geo-alt' },
    { vista: 'noticias', label: 'Noticias', icon: 'bi bi-newspaper' },
  ];


  // ========================
  // Botones alternar vistas
  // ========================
  togglePuntos(): void {
    this.mostrarPuntos = !this.mostrarPuntos;
  }

  openMyPointsFromPage(): void {
    this.vistaActual = 'puntos';
    this.mostrarPuntos = true;
  }

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
        this.puntosList = data.map((p: any) => ({
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

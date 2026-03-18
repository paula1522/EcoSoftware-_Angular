import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../Services/usuario.service'; // ajusta ruta según tu estructura
import { COMPARTIR_IMPORTS } from '../../shared/imports';
import { FormRegistro } from '../../Logic/solicitudes-comp/vista-solicitudes/form-registro/form-registro';
import { CardsSolicitud } from '../../Logic/solicitudes-comp/cards-solicitud/cards-solicitud';
import { CardsRecoleccionCiudadano } from '../../Logic/recolecciones-comp/cards-recoleccion-ciudadano/cards-recoleccion-ciudadano';
import { PuntosReciclajeService, PuntosResponse } from '../../Services/puntos-reciclaje.service';
import { PuntoReciclaje } from '../../Models/puntos-reciclaje.model';
import { BarraLateral } from '../../shared/barra-lateral/barra-lateral';
import { Titulo } from '../../shared/titulo/titulo';
import { EditarUsuario } from '../../Logic/usuarios.comp/editar-usuario/editar-usuario';
import { CardsNoticias } from "../../Logic/cards-noticias.component/cards-noticias.component";
import { CardInscripcion } from "../../Logic/capacitaciones/card-inscripcion/card-inscripcion";
import { ColumnaTabla, Tabla } from '../../shared/tabla/tabla';

@Component({
  selector: 'app-ciudadano',
  standalone: true,
  imports: [COMPARTIR_IMPORTS, FormRegistro,
    EditarUsuario,
    CardsSolicitud, CardsRecoleccionCiudadano, BarraLateral, Titulo, CardsNoticias, CardInscripcion, Tabla],

  templateUrl: './ciudadano.html',
  styleUrls: ['./ciudadano.css']
})
export class Ciudadano {

  menuAbierto: boolean = true;       
  perfilMenuAbierto: boolean = false; 
  vistaActual: 'panel' | 'solicitudes' | 'recolecciones' | 'capacitaciones' | 
  'noticias' | 'editar-perfil'| 'puntos' = 'panel'; 
  mostrarNuevaSolicitud = false;
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

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
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

  menu: { 
  vista: 'panel' | 'solicitudes' | 'recolecciones' | 'capacitaciones' | 'noticias' | 'puntos',
  label: string,
  icon: string
}[] = [
  { vista: 'panel', label: 'Panel de Control', icon: 'bi bi-speedometer2' },
  { vista: 'solicitudes', label: 'Solicitudes', icon: 'bi bi-bar-chart-line' },
  { vista: 'recolecciones', label: 'Recolecciones', icon: 'bi bi-truck' },
  { vista: 'puntos', label: 'Puntos de Reciclaje', icon: 'bi bi-geo-alt' }, 
  { vista: 'capacitaciones', label: 'Capacitaciones', icon: 'bi bi-mortarboard-fill' },
  { vista: 'noticias', label: 'Noticias', icon: 'bi bi-newspaper' }
];




  toggleVista(): void {
    this.mostrarNuevaSolicitud = !this.mostrarNuevaSolicitud;
  }

  get puntosFiltrados(): PuntoReciclaje[] {
    return this.puntos;
  }

  mostrarTodosLosPuntos(): void {
    this.vistaPuntos = 'todos';
  }

  irAPaginaMapa(): void {
    this.router.navigate(['/puntos-reciclaje']);
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
    if (!this.menuAbierto) {
      this.perfilMenuAbierto = false; 
    }
  }

  // ========================
  // CAMBIAR VISTA
  // ========================
  cambiarVista(vista: 'panel'|'solicitudes'|'recolecciones'|'capacitaciones'|'noticias'|'puntos'| 'editar-perfil'): void {
    this.vistaActual = vista;
  }

  togglePerfilMenu(): void {
    this.perfilMenuAbierto = !this.perfilMenuAbierto;
  }

editarPerfil(): void {
    this.vistaActual = 'editar-perfil';
}

  // ========================
  //  CERRAR SESIÓN
  // ========================
  cerrarSesion(): void {
    this.usuarioService.logout(); // limpia el localStorage
    this.router.navigate(['/']); // redirige al index

    // Opcional: mensaje de confirmación
    alert('Sesión cerrada correctamente');
  }
}

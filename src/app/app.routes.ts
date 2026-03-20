import { Routes } from '@angular/router';
// Pagina de inicio/Registro/login
import { Inicio } from './pages/inicio/inicio';
import { Login } from './auth/login/login';
import { Registro } from './auth/registro/registro';
// Paginas de usuarios
import { Administrador } from './pages/administrador/administrador';
import { Ciudadano } from './pages/ciudadano/ciudadano';
import { Empresa } from './pages/empresa/empresa';
import { Reciclador } from './pages/reciclador/reciclador';
import { MapaComponent } from './pages/mapa/mapa.component';

// Paginas de modulos
import { Usuario } from './Logic/usuarios.comp/listar-filtrar-usuarios/usuario';
import { Solcitudes } from './Logic/solicitudes-comp/listar-filtrar-solicitudes/solcitudes';

import { CardsSolicitud } from './Logic/solicitudes-comp/cards-solicitud/cards-solicitud';
import { CardARSolicitud } from './Logic/solicitudes-comp/card-a-r-solicitud/card-a-r-solicitud';
import { FormRegistro } from './Logic/solicitudes-comp/vista-solicitudes/form-registro/form-registro';
import { EditarUsuario } from './Logic/usuarios.comp/editar-usuario/editar-usuario';
import { Error } from './core/error/error';
import { AuthGuard } from './auth/auth.guard';
import { GraficoUsuariosBarrios } from './Logic/usuarios.comp/grafica-usuarios-barrio/grafica-usuarios-barrio';
import {PendientesAceptadasChartComponent} from "./Logic/solicitudes-comp/pendientes-aceptadas-chart-component/pendientes-aceptadas-chart-component";
import {RechazadasMotivoChartComponent} from "./Logic/solicitudes-comp/rechazadas-motivo-chart-component/rechazadas-motivo-chart-component";
import {SolicitudesLocalidadChartComponent} from "./Logic/solicitudes-comp/solicitudes-localidad-chart-component/solicitudes-localidad-chart-component";
import {ListarPorRecolector} from "./Logic/recolecciones-comp/listar-por-recolector/listar-por-recolector";
import { Rutas } from './Logic/rutas/rutas';
import { AceptarRechazarUsuarios } from './Logic/usuarios.comp/aceptar-rechazar-usuarios/aceptar-rechazar-usuarios';
import { CardsNoticias } from './Logic/cards-noticias.component/cards-noticias.component';
import { Capacitaciones } from './pages/capacitaciones/capacitaciones';
import { Noticias } from './pages/noticias/noticias';
import { SubirDocumentos } from './auth/subir-documentos/subir-documentos';
import { CardInscripcion } from './Logic/capacitaciones/card-inscripcion/card-inscripcion';
import { Solicitud } from './pages/solicitud/solicitud';

export const routes: Routes = [

  { path: '', component: Inicio },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },

  {
    path: 'administrador',
    component: Administrador,
    canActivate: [AuthGuard],
    data: { roles: ['Administrador'] }
  },

  {
    path: 'ciudadano',
    component: Ciudadano,
    canActivate: [AuthGuard],
    data: { roles: ['Ciudadano'] }
  },

  {
    path: 'empresa',
    component: Empresa,
    canActivate: [AuthGuard],
    data: { roles: ['Empresa'] }
  },

  {
    path: 'reciclador',
    component: Reciclador,
    canActivate: [AuthGuard],
    data: { roles: ['Reciclador'] }
  },

  {
    path: 'solicitudes',
    component: Solcitudes,
    canActivate: [AuthGuard],
    data: { roles: ['Administrador'] }
  },

  { path: 'usuarios', component: Usuario },
  { path: 'grafica', component: GraficoUsuariosBarrios },
  { path: 'grafica2', component: PendientesAceptadasChartComponent },
  { path: 'grafica3', component: RechazadasMotivoChartComponent },
  { path: 'grafica4', component: SolicitudesLocalidadChartComponent },
  { path: 'listar-por-recolector', component: ListarPorRecolector },
  { path: 'rutas', component: Rutas },
  { path: 'aceptar-rechazar-usuarios', component: AceptarRechazarUsuarios },
  { path: 'Cardsnoticias', component: CardsNoticias },
  { path: 'noticias', component: Noticias },
  { path: 'capacitaciones', component: Capacitaciones },
{ path: 'subir-documentos', component: SubirDocumentos },
  { path: 'editar-usuario', component: EditarUsuario },
  { path: 'card-solicitud', component: CardsSolicitud },
  { path: 'card-re-acpt-solicitud', component: CardARSolicitud },
  { path: 'card-inscripcion', component: CardInscripcion },
  { path: 'form-solicitud', component: FormRegistro },
  { path: 'mapa', component: MapaComponent },
  { path: 'puntos-reciclaje', component: MapaComponent },
  {path: 'Solicitud', component: Solicitud},

  { path: '**', component: Error }

];


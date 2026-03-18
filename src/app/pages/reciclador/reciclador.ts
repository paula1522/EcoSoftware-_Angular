import { Component, ViewChild } from '@angular/core';
import { COMPARTIR_IMPORTS } from '../../shared/imports';
import { BarraLateral } from '../../shared/barra-lateral/barra-lateral';
import { Titulo } from '../../shared/titulo/titulo';
import { UsuarioService } from '../../Services/usuario.service';
import { MapaComponent } from '../mapa/mapa.component';

@Component({
  selector: 'app-reciclador',
  standalone: true,
  imports: [COMPARTIR_IMPORTS, BarraLateral, Titulo, MapaComponent],
  templateUrl: './reciclador.html',
  styleUrls: ['./reciclador.css']
})
export class Reciclador {
  menuAbierto: boolean = true;
  vistaActual: 'panel' | 'puntos' | 'recolecciones' = 'panel';
  @ViewChild(MapaComponent) mapaComponent?: MapaComponent;

  constructor(
    public usuarioService: UsuarioService
  ) {}

  toggleMenu(): void { this.menuAbierto = !this.menuAbierto; }

  abrirCrearPunto(): void {
    const mapId = this.mapaComponent?.mapContainerId;
    document.getElementById(mapId ?? '')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

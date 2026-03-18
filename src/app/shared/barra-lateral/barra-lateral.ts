import { Component, Input, Output, EventEmitter } from '@angular/core';
import { COMPARTIR_IMPORTS } from '../imports';

export interface MenuItem<V> {
  vista: V;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-barra-lateral',
  imports: [COMPARTIR_IMPORTS],
  templateUrl: './barra-lateral.html',
  styleUrl: './barra-lateral.css',
})
export class BarraLateral<V = string> {
  @Input() menu: MenuItem<V>[] = [];
  @Input() vistaActual!: V;
  @Input() nombreUsuario: string = 'Usuario';

  @Output() vistaChange = new EventEmitter<V>();
  @Output() logout = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();

  menuAbierto = true;
  perfilMenuAbierto = false;

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
    if (!this.menuAbierto) this.perfilMenuAbierto = false;
  }

  togglePerfilMenu() {
    this.perfilMenuAbierto = !this.perfilMenuAbierto;
  }

  seleccionarVista(vista: V) {
    this.vistaChange.emit(vista);
    this.perfilMenuAbierto = false;
  }
}

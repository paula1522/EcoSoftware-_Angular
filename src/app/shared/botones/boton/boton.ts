import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgStyle } from '@angular/common';
import { COMPARTIR_IMPORTS } from '../../imports';

@Component({
  standalone: true,
  selector: 'app-boton',
  imports: [COMPARTIR_IMPORTS],
  templateUrl: './boton.html',
  styleUrl: './boton.css'
})
export class Boton {
  @Input() texto: string = '';           // Texto del botón
  @Input() icono: string = '';           // Ej: "bi bi-pencil"
  @Input() color: string = 'primary';    // primary | success | danger...
  @Input() size: string = '';            // sm | lg | ''
  @Input() tipo: string = 'button';      // button | submit
  @Input() deshabilitado: boolean = false;
  

  // Color del hover (Bootstrap)
  @Input() hoverColor: string = '';      // primary | danger | success | warning...
}

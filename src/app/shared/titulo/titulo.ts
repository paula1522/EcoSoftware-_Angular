import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Boton } from '../botones/boton/boton';
import { COMPARTIR_IMPORTS } from '../imports';

@Component({
  selector: 'app-titulo',
  imports: [Boton, COMPARTIR_IMPORTS],
  templateUrl: './titulo.html',
  styleUrl: './titulo.css',
})
export class Titulo {
@Input() titulo: string = '';
  @Input() subtitulo: string = '';
  @Input() textoBoton: string = '';
  @Input() iconoBoton: string = 'bi bi-plus-circle';
  @Input() colorBoton: string = 'outline-custom-success';
  @Input() hoverColorBoton: string = 'custom-success-filled';
  @Input() mostrarBoton: boolean = true;
  

  @Output() clickBoton = new EventEmitter<void>();

  onClick() {
    this.clickBoton.emit();
  }
}

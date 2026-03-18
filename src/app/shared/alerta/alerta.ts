import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-alerta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerta.html',
  styleUrls: ['./alerta.css'],
})
export class Alerta implements OnChanges {

  @Input() tipo: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() mensaje: string = '';
  @Input() mostrar: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mostrar'] && this.mostrar === true) {
      // Cerrar automáticamente en 5 segundos
      setTimeout(() => {
        this.mostrar = false;
      }, 5000);
    }
  }
}

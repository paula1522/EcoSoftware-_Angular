import { Component } from '@angular/core';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';

@Component({
  selector: 'app-vista-solicitudes',
  imports: [COMPARTIR_IMPORTS],
  templateUrl: './vista-solicitudes.html',
  styleUrl: './vista-solicitudes.css'
})
export class VistaSolicitudes {
  solicitudes = [
    { id: 1, descripcion: 'Recolección de plástico', estado: 'Pendiente' },
    { id: 2, descripcion: 'Recolección de vidrio', estado: 'Completada' }
  ]
}

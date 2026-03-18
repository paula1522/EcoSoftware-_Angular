import { Component } from '@angular/core';
import { COMPARTIR_IMPORTS } from '../../shared/imports';

interface WasteType {
  icon: string;
  name: string;
}

@Component({
  selector: 'app-waste-carrusel',
  imports: [COMPARTIR_IMPORTS],
  templateUrl: './waste-carrusel.html',
  styleUrl: './waste-carrusel.css'
})


export class WasteCarrusel {
  wasteTypes: WasteType[] = [
    { icon: '🗞️', name: 'Papel' },
    { icon: '🍾', name: 'Plástico' },
    { icon: '🥫', name: 'Metal' },
    { icon: '🍷', name: 'Vidrio' },
    { icon: '📦', name: 'Cartón' },
    { icon: '🔋', name: 'Baterías' },
    { icon: '💻', name: 'Electrónicos' },
    { icon: '👕', name: 'Textiles' },
  ];
}

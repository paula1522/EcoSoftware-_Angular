import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMPARTIR_IMPORTS } from '../../shared/imports';

interface EcoTip {
  icon: string;
  title: string;
  description: string;
}
@Component({
  selector: 'app-consejos',
  imports: [CommonModule,COMPARTIR_IMPORTS],
  templateUrl: './consejos.html',
styleUrls: ['./consejos.css']
})
export class Consejos  {
  tips: EcoTip[] = [
    {
      icon: 'bi-droplet-fill',
      title: 'Ducha Eficiente',
      description: 'Ahorra 2,000L de agua mensualmente'
    },
    
    {
      icon: 'bi-recycle',
      title: 'Recicla Vidrio',
      description: 'Energía para 4 días de carga móvil'
    },
    {
      icon: 'bi-plug-fill',
      title: 'Desconecta Aparatos',
      description: 'Ahorra 10% de energía anual'
    },
    {
      icon: 'bi-bicycle',
      title: 'Movilidad Verde',
      description: 'Evita 3kg de CO₂ diarios'
    },
    {
      icon: 'bi-phone-fill',
      title: 'Facturas Digitales',
      description: 'Salva 8M de árboles al año'
    },
    
    {
      icon: 'bi-bag-fill',
      title: 'Bolsa Reutilizable',
      description: 'Evita 500 bolsas plásticas anuales'
    }
  ];
}
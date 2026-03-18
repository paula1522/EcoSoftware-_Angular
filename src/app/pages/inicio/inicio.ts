

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../core/header/header';
import { Footer } from '../../core/footer/footer';
import { Hero } from '../../core/hero/hero'; 
import { ServiciosSection } from '../../core/servicios-section/servicios-section';
import { Consejos } from '../../core/consejos/consejos';
import { Cifras } from "../../core/cifras/cifras";

@Component({
  selector: 'app-Inicio',
  standalone: true,
  imports: [CommonModule, Header, Footer, Hero, ServiciosSection, Consejos, Cifras],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {
  
}






import { Component } from '@angular/core';
import { CapacitacionesCrudComponent } from "../../Logic/capacitaciones/card-crud-capacitacion/card-crud-capacitacion";
import { Header } from "../../core/header/header";

@Component({
  selector: 'app-capacitaciones',
  imports: [CapacitacionesCrudComponent, Header],
  templateUrl: './capacitaciones.html',
  styleUrl: './capacitaciones.css',
})
export class Capacitaciones {

}

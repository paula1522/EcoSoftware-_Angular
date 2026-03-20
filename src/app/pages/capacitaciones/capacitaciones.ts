import { Component, OnInit } from '@angular/core';
import { CapacitacionesCrudComponent } from "../../Logic/capacitaciones/card-crud-capacitacion/card-crud-capacitacion";
import { Header } from "../../core/header/header";
import { CapacitacionesService } from '../../Services/capacitacion.service';
import { Capacitacion } from '../../Models/capacitacion.model';

@Component({
  selector: 'app-capacitaciones',
  imports: [CapacitacionesCrudComponent, Header],
  templateUrl: './capacitaciones.html',
  styleUrl: './capacitaciones.css',
})
export class Capacitaciones implements OnInit {

 totalCapacitaciones: number = 0;

  constructor(private capService: CapacitacionesService) {}

  ngOnInit(): void {
    this.capService.listarTodasCapacitaciones().subscribe({
      next: (data: Capacitacion[]) => {
        this.totalCapacitaciones = data.length;
      },
      error: err => console.error(err)
    });
  }
}

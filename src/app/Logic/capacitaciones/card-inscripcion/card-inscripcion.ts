import { Component, OnInit } from '@angular/core';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common'; // 👈 IMPORTANTE


@Component({
  selector: 'app-card-inscripcion',
  imports: [CommonModule],
  templateUrl: './card-inscripcion.html',
  styleUrl: './card-inscripcion.css',
})
export class CardInscripcion implements OnInit {
capacitaciones: any[] = [];

  constructor(
    private capacitacionesService: CapacitacionesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarMisCapacitaciones();
  }

  cargarMisCapacitaciones(){

  const usuarioId = this.authService.getUserId();

  if(!usuarioId){
    return;
  }

  this.capacitacionesService.obtenerMisCapacitaciones(usuarioId)
  .subscribe({

    next: data => {
      this.capacitaciones = data;
    },

    error: err => {
      console.error("Error cargando capacitaciones", err);
    }

  });

}
}
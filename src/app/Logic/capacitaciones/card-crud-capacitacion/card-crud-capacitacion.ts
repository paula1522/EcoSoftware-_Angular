import { AuthService } from './../../../auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { Capacitacion } from '../../../Models/capacitacion.model';
import { CommonModule } from '@angular/common';
import { Modal } from '../../../shared/modal/modal'; // importa tu modal

@Component({
  selector: 'app-card-crud-capacitacion',
  standalone: true,
  imports: [CommonModule, Modal],
  templateUrl: './card-crud-capacitacion.html',
  styleUrls: ['./card-crud-capacitacion.css']
})
export class CapacitacionesCrudComponent implements OnInit {

  capacitaciones: Capacitacion[] = [];

  // CONTROL MODAL
  modalOpen = false;
  modalTitle = "";
  modalMessage = "";

  constructor(
    private capacitacionesService: CapacitacionesService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerCapacitaciones();
  }

  obtenerCapacitaciones(): void {
    this.capacitacionesService.listarTodasCapacitaciones().subscribe({
      next: data => this.capacitaciones = data,
      error: err => console.error('Error al obtener capacitaciones', err)
    });
  }

  // FUNCION PARA ABRIR MODAL
  abrirModal(titulo: string, mensaje: string) {
    this.modalTitle = titulo;
    this.modalMessage = mensaje;
    this.modalOpen = true;
  }

inscribirse(cap: Capacitacion) {

  const usuarioId = this.authService.getUserId();

  // ❗ Usuario no logueado
  if (!usuarioId) {
    this.abrirModal(
      "Acceso requerido",
      "Debes iniciar sesión para inscribirte en una capacitación."
    );
    return;
  }

  // Llamada al backend
  this.capacitacionesService.inscribirse(usuarioId, cap.id!).subscribe({

    next: () => {
      this.abrirModal(
        "Inscripción exitosa",
        `Te has inscrito correctamente en "${cap.nombre}".`
      );
    },

    error: () => {
      this.abrirModal(
        "Error",
        "No se pudo completar la inscripción."
      );
    }

  });

}

  cerrarModal() {
    this.modalOpen = false;
  }

}
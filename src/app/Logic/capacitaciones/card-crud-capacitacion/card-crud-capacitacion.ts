import { AuthService } from './../../../auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { CapacitacionesService } from '../../../Services/capacitacion.service';
import { Capacitacion } from '../../../Models/capacitacion.model';
import { CommonModule } from '@angular/common';
import { Modal } from '../../../shared/modal/modal'; // importa tu modal
import { Boton } from '../../../shared/botones/boton/boton';

@Component({
  selector: 'app-card-crud-capacitacion',
  standalone: true,
  imports: [CommonModule, Modal, Boton],
  templateUrl: './card-crud-capacitacion.html',
  styleUrls: ['./card-crud-capacitacion.css']
})
export class CapacitacionesCrudComponent implements OnInit {

  capacitaciones: Capacitacion[] = [];

  // CONTROL MODAL
  modalOpen = false;
  modalTitle = "";
  modalMessage = "";

  paginaActual: number = 1;
itemsPorPagina: number = 8;
inscripcionesIds: number[] = [];

capSeleccionada: Capacitacion | null = null;
modalConfirmacion = false;


  constructor(
    private capacitacionesService: CapacitacionesService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
  this.obtenerCapacitaciones();
  this.cargarInscripciones();
}
 

  // FUNCION PARA ABRIR MODAL
  abrirModal(titulo: string, mensaje: string) {
    this.modalTitle = titulo;
    this.modalMessage = mensaje;
    this.modalOpen = true;
  }

  inscribirse(cap: Capacitacion) {

  const usuarioId = this.authService.getUserId();

  if (!usuarioId) {
    this.abrirModal(
      "Acceso requerido",
      "Debes iniciar sesión para inscribirte en una capacitación."
    );
    return;
  }

  // 👇 si ya está inscrito, ni abras modal
  if (this.estaInscrito(cap.id!)) {
    this.abrirModal(
      "Ya estás inscrito",
      `Ya te encuentras inscrito en "${cap.nombre}".`
    );
    return;
  }

  // 👇 abre modal de confirmación
  this.capSeleccionada = cap;
  this.modalConfirmacion = true;
}

confirmarInscripcion() {
  if (!this.capSeleccionada) return;

  const usuarioId = this.authService.getUserId();

  this.capacitacionesService
.inscribirse(usuarioId!, this.capSeleccionada.id!)    .subscribe({

      next: () => {
        this.inscripcionesIds.push(this.capSeleccionada!.id!);

        this.abrirModal(
          "Inscripción exitosa",
          `Te has inscrito correctamente en "${this.capSeleccionada!.nombre}".`
        );

        this.modalConfirmacion = false;
      },

      error: (err) => {
        this.modalConfirmacion = false;

        if (err.error?.message === "YA_INSCRITO" || err.error === "YA_INSCRITO") {
          this.abrirModal(
            "Ya estás inscrito",
            `Ya te encuentras inscrito en "${this.capSeleccionada!.nombre}".`
          );
        } else {
          this.abrirModal(
            "Error",
            "No se pudo completar la inscripción."
          );
        }
      }

    });
}

get capacitacionesPaginadas(): Capacitacion[] {
  const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
  return this.capacitaciones.slice(inicio, inicio + this.itemsPorPagina);
}

get totalPaginas(): number {
  return Math.ceil(this.capacitaciones.length / this.itemsPorPagina);
}
cambiarPagina(pagina: number | string) {
  if (typeof pagina !== 'number') return;

  if (pagina < 1 || pagina > this.totalPaginas) return;

  this.paginaActual = pagina;

  // 👇 scroll suave hacia arriba
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
obtenerCapacitaciones(): void {
  this.capacitacionesService.listarTodasCapacitaciones().subscribe({
    next: data => {
      this.capacitaciones = data;
      this.paginaActual = 1; // 🔥 importante
    },
    error: err => console.error('Error', err)
  });
}

get paginasMostradas(): (number | string)[] {
  const total = this.totalPaginas;
  const actual = this.paginaActual;

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const paginas: (number | string)[] = [1];

  if (actual > 3) paginas.push('...');

  for (let i = Math.max(2, actual - 1); i <= Math.min(total - 1, actual + 1); i++) {
    paginas.push(i);
  }

  if (actual < total - 2) paginas.push('...');

  paginas.push(total);

  return paginas;
}

  cerrarModal() {
    this.modalOpen = false;
  }


  cargarInscripciones() {
  const usuarioId = this.authService.getUserId();

  if (!usuarioId) return;

  this.capacitacionesService
    .listarInscripcionesPorUsuario(usuarioId)
    .subscribe(data => {
      this.inscripcionesIds = data.map(i => i.cursoId);
    });
}

estaInscrito(cursoId: number): boolean {
  return this.inscripcionesIds.includes(cursoId);
}

}
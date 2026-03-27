import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SolicitudRecoleccionService } from '../../../../Services/solicitud.service';
import { Router } from '@angular/router';
import { LocalidadNombrePipe } from "../../../../core/pipes/LocalidadNombrePipe";
import { EstadoPeticion, Localidad, SolicitudRecoleccion, TipoResiduo } from '../../../../Models/solicitudes.model';
import { COMPARTIR_IMPORTS } from '../../../../shared/imports';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-form-registro',
  templateUrl: './form-registro.html',
  imports: [COMPARTIR_IMPORTS, LocalidadNombrePipe],
  styleUrls: ['./form-registro.css']
})
export class FormRegistro {

  registroForm: FormGroup;
  tiposResiduo = Object.values(TipoResiduo);
  localidades = Object.values(Localidad);
  mensaje = '';
  error = '';
  hoy: string;
  evidencia: File [] = [];


  constructor(private fb: FormBuilder, private solicitudService: SolicitudRecoleccionService, private router: Router) {
    const hoyDate = new Date();
    this.hoy = hoyDate.toISOString().split('T')[0];

    this.registroForm = this.fb.group({
      tipoResiduo: ['', Validators.required],
      cantidad: ['', Validators.required],
      descripcion: ['', Validators.required],
      localidad: ['', Validators.required],
      ubicacion: ['', Validators.required],
      fechaProgramada: ['', Validators.required],
      evidencia: [''] // valor opcional
    });
  }

  // Capturar archivo seleccionado
  onFilesSelected(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const selectedFiles = Array.from(target.files);

    // Limitar a máximo 5 fotos
    if (selectedFiles.length + this.evidencia.length > 5) {
      this.error = 'No puedes subir más de 5 fotos';
      return;
    }

    this.evidencia.push(...selectedFiles);
    this.error = '';
  }
}

  onSubmit(): void {
  if (this.registroForm.invalid) {
    this.error = 'Por favor complete todos los campos obligatorios';
    this.mensaje = '';
    return;
  }

  const raw = this.registroForm.getRawValue();

// Asegurarse de que tenga segundos
let fechaHora = raw.fechaProgramada;
if (!fechaHora.includes(':')) {
  fechaHora += ':00'; // añade minutos si falta
} else if (fechaHora.split(':').length === 2) {
  fechaHora += ':00'; // añade segundos
}

const nuevaSolicitud: Partial<SolicitudRecoleccion> = {
  usuarioId: 3,
  tipoResiduo: raw.tipoResiduo,
  cantidad: raw.cantidad,
  estadoPeticion: EstadoPeticion.Pendiente,
  descripcion: raw.descripcion,
  localidad: raw.localidad,
  ubicacion: raw.ubicacion,
  evidencia: 'Sin evidencia',
  fechaCreacionSolicitud: new Date().toISOString(),
  fechaProgramada: fechaHora, // ya incluye fecha y hora
};

  this.solicitudService.crearSolicitud(nuevaSolicitud as SolicitudRecoleccion).subscribe({
    next: (resp) => {
      this.mensaje = 'Solicitud registrada correctamente';
      this.error = '';
      this.registroForm.reset();
      this.router.navigate(['/ciudadano']);
    },
    error: (err) => {
      this.error = 'Error al registrar la solicitud: ' + (err.error?.message || err.message || 'Servidor');
      this.mensaje = '';
    }
  });
}


  
}
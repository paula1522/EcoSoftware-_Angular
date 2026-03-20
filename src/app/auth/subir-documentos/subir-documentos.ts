import { AuthService } from './../auth.service';
import { Component } from '@angular/core';
import { UsuarioService } from '../../Services/usuario.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subir-documentos',
  imports: [FormsModule, CommonModule],
  standalone: true,

  templateUrl: './subir-documentos.html',
  styleUrl: './subir-documentos.css',
})
export class SubirDocumentos {
  idUsuario!: number;
  archivo!: File;
  tipo: string = '';
  mensaje = '';
  error = '';
  rol: string | null = null;

  documentosRequeridos: string [] = [];

  tiposPermitidos: { label: string, value: string }[] = [];
  fileInput: any;

  constructor(
    private usuarioService: UsuarioService,
    private AuthService: AuthService,
    private router: Router
  ) { }

  seleccionarArchivo(event: any) {
    const file = event.target.files[0];

    if (!file) return;

    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
    const tamañoMaximo = 5 * 1024 * 1024; // 5MB

    if (!tiposPermitidos.includes(file.type)) {
      this.error = 'Solo se permiten PDF, JPG o PNG';
      this.mensaje = '';
      return;
    }

    if (file.size > tamañoMaximo) {
      this.error = 'El archivo excede el tamaño máximo permitido (5MB)';
      this.mensaje = '';
      return;
    }

    this.archivo = file;
    this.error = '';
  }

  subir() {

    if (!this.archivo || !this.tipo) {
      this.error = 'Debes seleccionar archivo y tipo';
      this.mensaje = '';
      return;
    }

    const idUsuario = this.AuthService.getUserId();

    if (!idUsuario) {
      this.error = 'Sesión no válida. Por favor, inicia sesión nuevamente.';
      this.mensaje = '';
      return;
    }

    this.usuarioService.subirDocumento(idUsuario, this.archivo, this.tipo)
      .subscribe({
  next: (res) => {
  console.log("RESPUESTA:", res);
  this.mensaje = 'Documento subido correctamente.';
  this.error = '';

  // Limpiar formulario para subir otro
  this.tipo = '';
  this.archivo = null!;
  this.fileInput.nativeElement.value = '';

  // Ocultar mensaje después de 3 segundos
  setTimeout(() => {
    this.mensaje = '';
  }, 3000);
},
  error: (err) => {
    console.log("ERROR COMPLETO:", err);
    console.log("MENSAJE BACKEND:", err.error);
    this.error = err.error?.error || 'Error al subir documento';
  }
});
       
  }

ngOnInit() {

  const user = this.AuthService.getUser();

  if (!user) {
    this.router.navigate(['/login']);
    return;
  }

  if (user.estadoRegistro !== 'PENDIENTE_DOCUMENTACION') {
    this.router.navigate(['/login']);
    return;
  }

  this.rol = user.rol;
  console.log("ROL DEL USUARIO:", user.rol);

  if (this.rol === 'Empresa') {
    this.tiposPermitidos = [
      { label: 'Cédula del Representante', value: 'cedula' },
      { label: 'RUT', value: 'rut' },
      { label: 'Cámara de Comercio', value: 'camara' }
    ];

    this.documentosRequeridos = [
      'Cédula del Representante',
      'RUT',
      'Cámara de Comercio'
    ];
  }

  if (this.rol === 'Reciclador') {
    this.tiposPermitidos = [
      { label: 'Cédula', value: 'cedula' }
    ];

    this.documentosRequeridos = [
      'Cédula'
    ];
  }

  
}

}

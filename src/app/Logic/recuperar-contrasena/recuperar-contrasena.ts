import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../Services/usuario.service';
import { Modal } from '../../shared/modal/modal';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './recuperar-contrasena.html',
  styleUrls: ['./recuperar-contrasena.css']
})
export class RecuperarContrasena {

  isOpen = false;

  paso: 'correo' | 'reset' | 'resultado' = 'correo';

  correo = '';
  token = '';
  nuevaPassword = '';

  mensaje = '';
  error = false;
  loading = false;

  // 🔥 VALIDACIONES
  correoValido = true;
  passwordValida = true;
  passwordErrores: string[] = [];

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  abrir() {
    this.isOpen = true;
    this.paso = 'correo';
    this.resetForm();
  }

  cerrar() {
    this.isOpen = false;
  }

  resetForm() {
    this.correo = '';
    this.token = '';
    this.nuevaPassword = '';
    this.mensaje = '';
    this.error = false;
    this.correoValido = true;
    this.passwordValida = true;
    this.passwordErrores = [];
  }

  // ==========================
  // VALIDAR CORREO
  // ==========================
  validarCorreo(): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.correoValido = regex.test(this.correo);
    return this.correoValido;
  }

  // ==========================
  // VALIDAR PASSWORD
  // ==========================
  validarPassword(): boolean {
    this.passwordErrores = [];

    if (this.nuevaPassword.length < 8) {
      this.passwordErrores.push('Mínimo 8 caracteres');
    }

    if (!/[A-Z]/.test(this.nuevaPassword)) {
      this.passwordErrores.push('Debe tener una mayúscula');
    }

    if (!/[a-z]/.test(this.nuevaPassword)) {
      this.passwordErrores.push('Debe tener una minúscula');
    }

    if (!/[^A-Za-z0-9]/.test(this.nuevaPassword)) {
      this.passwordErrores.push('Debe tener un carácter especial');
    }

    this.passwordValida = this.passwordErrores.length === 0;
    return this.passwordValida;
  }

  // ==========================
  // 1. ENVIAR CORREO
  // ==========================
  enviarCorreo() {

    if (!this.validarCorreo()) return;

    this.loading = true;

    this.usuarioService.recuperarPassword(this.correo).subscribe({
      next: () => {
        this.loading = false;
        this.paso = 'reset';
        this.mensaje = 'Se envió el código a tu correo';
        this.error = false;
      },
      error: (err) => {
        this.loading = false;
        this.mensaje = err.error || 'Error enviando correo';
        this.error = true;
      }
    });
  }

  // ==========================
  // 2. RESET PASSWORD
  // ==========================
  resetearPassword() {

    if (!this.token) {
      this.mensaje = 'Debes ingresar el código';
      this.error = true;
      return;
    }

    if (!this.validarPassword()) return;

    this.loading = true;

    this.usuarioService.resetPassword(this.token, this.nuevaPassword).subscribe({
      next: () => {
        this.loading = false;
        this.paso = 'resultado';
        this.mensaje = 'Contraseña actualizada correctamente';
        this.error = false;
      },
      error: (err) => {
        this.loading = false;
        this.paso = 'resultado';
        this.mensaje = err.error || 'Error al restablecer';
        this.error = true;
      }
    });
  }

  // ==========================
  // FINALIZAR
  // ==========================
  finalizar() {
    this.cerrar();
    this.router.navigate(['/login']);
  }
}

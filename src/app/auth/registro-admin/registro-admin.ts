// registro-admin.component.ts
import { Component } from '@angular/core';
import { UsuarioService } from '../../Services/usuario.service';
import { UsuarioModel, Localidad } from '../../Models/usuario';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalidadNombrePipe } from "../../core/pipes/LocalidadNombrePipe";

@Component({
  selector: 'app-registro-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LocalidadNombrePipe],
  templateUrl: './registro-admin.html',
  styleUrls: ['./registro-admin.css']
})
export class RegistroAdmin {

  usuario: UsuarioModel = {
    rolId: 1, // Por defecto Administrador
    nombre: '',
    contrasena: '',
    correo: '',
    cedula: '',
    telefono: '',
    direccion: '',
    localidad: '' as Localidad,
    estado: true,
    fechaCreacion: new Date().toISOString()
  };

  verificarContrasena: string = '';
  localidades = Object.values(Localidad);
  enviando = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  constructor(private usuarioService: UsuarioService) {}

  registrar() {
    if (this.enviando || !this.contrasenasCoinciden()) return;
    
    // Resetear mensajes
    this.mensajeExito = '';
    this.mensajeError = '';
    
    this.enviando = true;
    console.log('Datos a enviar:', this.usuario);

    this.usuarioService.guardar(this.usuario).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);
        this.enviando = false;
        this.mensajeExito = 'Usuario registrado exitosamente';
        
        // Resetear formulario después de registro exitoso
        this.resetearFormulario();
      },
      error: (error) => {
        console.error('Error:', error);
        this.enviando = false;
        
        if (error.status === 409) {
          this.mensajeError = 'El usuario ya existe (correo o cédula duplicados)';
        } else if (error.status === 400) {
          this.mensajeError = 'Datos inválidos. Verifique la información.';
        } else {
          this.mensajeError = 'Error al registrar usuario';
        }
      }
    });
  }

  // Resetear formulario a valores iniciales
  resetearFormulario(): void {
    this.usuario = {
      rolId: 1,
      nombre: '',
      contrasena: '',
      correo: '',
      cedula: '',
      telefono: '',
      direccion: '',
      localidad: '' as Localidad,
      estado: true,
      fechaCreacion: new Date().toISOString()
    };
    this.verificarContrasena = '';
  }

  validarFuerte(valor: string): boolean {
    if (!valor) return false;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[{\]};:<>|./?]).+$/;
    return regex.test(valor);
  }

  contrasenasCoinciden(): boolean {
    return this.usuario.contrasena === this.verificarContrasena;
  }

  // Método para verificar si es administrador
  esAdministrador(): boolean {
    return this.usuario.rolId === 1;
  }

  // Método para verificar si requiere campos adicionales
  requiereCamposAdicionales(): boolean {
    return this.usuario.rolId !== 1; // Solo administradores no requieren campos adicionales
  }
}
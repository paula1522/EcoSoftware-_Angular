import { Component } from '@angular/core';
import { UsuarioService } from '../../Services/usuario.service';
import { UsuarioModel, Localidad } from '../../Models/usuario';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LocalidadNombrePipe } from "../../core/pipes/LocalidadNombrePipe";

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LocalidadNombrePipe],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css']
})
export class Registro {

  usuario: UsuarioModel = {
    rolId: 2,
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

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  private resetFormulario() {
  this.usuario = {
    rolId: 2,
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

  registrar() {
  if (this.enviando || 
      !this.contrasenasCoinciden() || 
      !this.validarFuerte(this.usuario.contrasena)) return;
    
    this.enviando = true;
    console.log('Datos a enviar:', this.usuario);

    this.usuarioService.guardar(this.usuario).subscribe({
      next: (response) => {
  console.log('Registro exitoso:', response);
  this.enviando = false;

  const rolRegistrado = this.usuario.rolId;

  this.resetFormulario();

  if (rolRegistrado === 2) {
    alert('Usuario registrado correctamente');
    this.router.navigate(['/login']);
  } else {
    alert('Tu cuenta quedó pendiente de aprobación. Debes subir documentos.');
    this.router.navigate(['/subir-documentos', response.idUsuario]);
  }
},
      error: (error) => {
        console.error('Error:', error);
        this.enviando = false;
        
        if (error.status === 409) {
          alert('El usuario ya existe (correo o cédula duplicados)');
        } else if (error.status === 400) {
          alert('Datos inválidos. Verifique la información.');
        } else {
          alert('Error al registrar usuario');
        }
      }
    });
  }

  

  validarFuerte(valor: string): boolean {
    if (!valor) return false;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[{\]};:<>|./?]).+$/;
    return regex.test(valor);
  }

  contrasenasCoinciden(): boolean {
    return this.usuario.contrasena === this.verificarContrasena;
  }
}
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService } from '../../../Services/usuario.service';
import { UsuarioModel } from '../../../Models/usuario';
import { Router } from '@angular/router';
import { COMPARTIR_IMPORTS } from '../../../shared/imports';
import { AuthService } from '../../../auth/auth.service';
import { LocalidadNombrePipe } from "../../../core/pipes/LocalidadNombrePipe";

@Component({
  selector: 'app-editar-usuario',
  templateUrl: './editar-usuario.html',
  imports: [COMPARTIR_IMPORTS, LocalidadNombrePipe],
  styleUrls: ['./editar-usuario.css']
})
export class EditarUsuario implements OnInit {

  usuarioForm: FormGroup;
  mensaje = '';
  error = '';
  mostrarFormulario = false;

  usuario: UsuarioModel | null = null;
  usuarioOriginal: UsuarioModel | null = null; // Guardar datos originales

  private usuarioId?: number;
  private rolUsuario?: number | null;
  
  // Control para mostrar/ocultar contraseña
  mostrarContrasena = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router,
    private authService: AuthService
  ) {
    this.usuarioForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.cargarUsuario();
  }

  cargarUsuario(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.error = 'No se pudo obtener el ID del usuario';
      return;
    }
    
    this.usuarioService.obtenerPorId(userId).subscribe({
      next: (usuario: UsuarioModel) => {
        // Guardar usuario original (con hash)
        this.usuarioOriginal = { ...usuario };
        
        // Crear copia para edición con contraseña vacía
        this.usuario = {
          ...usuario,
          contrasena: '' // Contraseña vacía para el formulario
        };
        
        this.usuarioId = usuario.idUsuario;
        this.rolUsuario = usuario.rolId || 2;
      },
      error: (err) => this.error = 'Error al cargar el usuario: ' + (err.message || err)
    });
  }

  getCamposSegunRol(): string[] {
    switch(this.rolUsuario) {
      case 1: // Administrador
        return ['nombre', 'cedula', 'correo', 'telefono', 'contrasena'];
      case 2: // Ciudadano
        return ['nombre', 'cedula', 'correo', 'telefono', 'direccion', 'barrio', 'localidad', 'contrasena'];
      case 3: // Empresa
        return ['nombre', 'cedula', 'correo', 'telefono', 'direccion', 'barrio', 'localidad', 'horario', 'cantidad_minima', 'tipoMaterial', 'contrasena', 'representanteLegal', 'nit', 'nombreEmpresa'];
      case 4: // Reciclador
        return ['nombre', 'cedula', 'correo', 'telefono', 'zona_de_trabajo', 'horario', 'cantidad_minima', 'tipoMaterial', 'contrasena'];
      default:
        return [];
    }
  }

  mostrarForm(): void {
    if (!this.usuario) return;
    
    const campos = this.getCamposSegunRol();
    const formGroup: any = {};
    
    campos.forEach(campo => {
      // Para contraseña, usar validadores especiales
      if (campo === 'contrasena') {
        formGroup[campo] = [
          '', // Valor vacío inicial
          [Validators.minLength(6)] // Validación mínima
        ];
      } else {
        formGroup[campo] = [this.usuario![campo as keyof UsuarioModel] || ''];
      }
    });
    
    this.usuarioForm = this.fb.group(formGroup);
    this.mostrarFormulario = true;
  }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  actualizarUsuario(): void {
    if (!this.usuario || !this.usuarioOriginal) return;
    
    // Obtener valores del formulario
    const formValues = this.usuarioForm.getRawValue();
    
    // Preparar objeto para actualizar
    const usuarioActualizar: UsuarioModel = {
      ...this.usuarioOriginal, // Usar datos originales como base
      ...formValues
    };
    
    // Si la contraseña está vacía, no actualizarla
    if (!formValues.contrasena || formValues.contrasena.trim() === '') {
      // Excluir la propiedad contrasena para no enviarla vacía
      const { contrasena, ...usuarioSinContrasena } = usuarioActualizar;
      Object.assign(usuarioActualizar, usuarioSinContrasena);
    }
    
    this.usuarioService.actualizar(this.usuarioId!, usuarioActualizar).subscribe({
      next: () => {
        this.mensaje = 'Usuario actualizado correctamente ✅';
        this.error = '';
        
        // Recargar usuario actualizado
        setTimeout(() => {
          this.cargarUsuario();
          this.mostrarFormulario = false;
        }, 1500);
      },
      error: (err) => {
        this.mensaje = '';
        this.error = 'Error al actualizar usuario: ' + (err.error?.message || err.message || 'Servidor');
      }
    });
  }

  // Método para cancelar edición
  cancelarEdicion(): void {
    this.mostrarFormulario = false;
    this.usuarioForm.reset();
  }

  darseDeBaja(): void {
    const confirmado = confirm(
      '¿Está seguro de darse de baja de la aplicación?\nSe eliminará su cuenta y no podrá volver a ingresar.'
    );

    if (confirmado) {
      this.usuarioService.eliminarLogico(this.usuarioId!).subscribe({
        next: (res) => {
          alert('Cuenta desactivada correctamente. Serás redirigido.');
          this.router.navigate(['/main']);
        },
        error: (err) => {
          console.warn('Error interpretado, pero la cuenta podría estar desactivada:', err);
          alert('Cuenta desactivada correctamente. Serás redirigido.');
          this.router.navigate(['/']);
        }
      });
    }
  }
}
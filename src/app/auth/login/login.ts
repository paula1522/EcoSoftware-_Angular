import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { COMPARTIR_IMPORTS } from '../../shared/imports';
import { RouterModule } from '@angular/router';
import { FormComp, FieldConfig } from '../../shared/form/form.comp/form.comp';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [COMPARTIR_IMPORTS, RouterModule, FormComp],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit, OnDestroy {

  formGroup!: FormGroup;

  errorMessage = '';

  campos: FieldConfig[] = [
    { name: 'correo', label: 'Correo', type: 'email', placeholder: 'Ingrese su correo' },
    { name: 'contrasena', label: 'Contraseña', type: 'password', placeholder: 'Ingrese su contraseña', showToggle: true }
  ];

  fade = false;
  residues = [
    { icon: '🗑️', name: 'Residuos Ordinarios', color: '#6b7280' },
    { icon: '♻️', name: 'Residuos Reciclables', color: '#3b82f6' },
    { icon: '🍎', name: 'Residuos Orgánicos', color: '#84cc16' },
    { icon: '🔋', name: 'Residuos Peligrosos', color: '#ef4444' },
    { icon: '🏥', name: 'Residuos Hospitalarios', color: '#f59e0b' },
    { icon: '💻', name: 'Residuos Electrónicos', color: '#8b5cf6' },
    { icon: '🧪', name: 'Residuos Químicos', color: '#ec4899' },
    { icon: '🏗️', name: 'Residuos de Construcción', color: '#78716c' }
  ];
  currentIndex = 0;
  currentResidue = this.residues[0];
  private residueInterval: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Crear formulario con validación
    this.formGroup = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required]
    });

    // Animación de residuos
    this.residueInterval = setInterval(() => this.rotateResidue(), 3000);
  }

  ngOnDestroy(): void {
    // Limpiar intervalo
    clearInterval(this.residueInterval);
  }

  rotateResidue(): void {
    this.fade = true;
    setTimeout(() => {
      this.currentIndex = (this.currentIndex + 1) % this.residues.length;
      this.currentResidue = this.residues[this.currentIndex];
      this.fade = false;
    }, 500);
  }

  onLogin(formValue: any): void {
    console.log('Datos recibidos en Login:', formValue);

    this.errorMessage = '';

    const correo = formValue.correo?.trim() || '';
    const contrasena = formValue.contrasena?.trim() || '';

    if (!correo && !contrasena) {
      this.errorMessage = 'Por favor, ingrese su correo y contraseña.';
      return;
    }
    if (!correo) {
      this.errorMessage = 'Por favor, ingrese su correo.';
      return;
    }
    if (!contrasena) {
      this.errorMessage = 'Por favor, ingrese su contraseña.';
      return;
    }

    const credenciales = { correo, contrasena };

    this.authService.login(credenciales).subscribe({
      next: (response) => {

  this.authService.setSession(response);

  switch (response.rol) {
    case 'Administrador': this.router.navigate(['/administrador']); break;
    case 'Ciudadano': this.router.navigate(['/ciudadano']); break;
    case 'Empresa': this.router.navigate(['/empresa']); break;
    case 'Reciclador': this.router.navigate(['/reciclador']); break;
    default: this.router.navigate(['/login']);
  }
},
      error: (err) => {
  if (err.status === 401) {
    this.errorMessage = 'Correo o contraseña incorrectos.';
  } 
  else if (err.status === 403) {
    this.errorMessage = 'Tu cuenta aún no ha sido aprobada.';
  }
  else if (err.status === 500) {
    this.errorMessage = 'Error en el servidor.';
  } 
  else {
    this.errorMessage = 'Ha ocurrido un error inesperado.';
  }
}
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    const leaves = document.querySelectorAll('.floating-leaves');
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    leaves.forEach((leaf, index) => {
      const speed = (index + 1) * 10;
      const x = mouseX * speed;
      const y = mouseY * speed;
      (leaf as HTMLElement).style.transform = `translate(${x}px, ${y}px) rotate(${x}deg)`;
    });
  }
}

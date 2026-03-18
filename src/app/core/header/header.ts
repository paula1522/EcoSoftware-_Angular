import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Boton } from "../../shared/botones/boton/boton";
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, Boton],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header {

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToPerfil() {

  const role = this.authService.getUserRole();
  console.log("ROL HEADER:", role);

  switch (role) {
    case 'Administrador':
      this.router.navigate(['/administrador']);
      break;
    case 'Ciudadano':
      this.router.navigate(['/ciudadano']);
      break;
    case 'Empresa':
      this.router.navigate(['/empresa']);
      break;
    case 'Reciclador':
      this.router.navigate(['/reciclador']);
      break;
    default:
      this.router.navigate(['/login']);
  }

}

}
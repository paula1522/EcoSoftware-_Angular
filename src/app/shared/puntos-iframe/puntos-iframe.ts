import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-puntos-iframe',
  standalone: true,
  templateUrl: './puntos-iframe.html',
  styleUrls: ['./puntos-iframe.css']
})
export class PuntosIframe {
  url: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    // URL DE LA VISTA PARA LOS PUNTOS 
    this.url = this.sanitizer.bypassSecurityTrustResourceUrl('http://localhost/puntos/Eco_Software-/views/PuntosReciclaje.php');
  }
}

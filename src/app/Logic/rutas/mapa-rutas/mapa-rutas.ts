import { Component, Input } from '@angular/core';
import L from 'leaflet';

@Component({
  selector: 'app-mapa-rutas',
  imports: [],
  templateUrl: './mapa-rutas.html',
  styleUrl: './mapa-rutas.css',
})
export class MapaRutas {
 @Input() rutas: any[] = []; // Aquí vendrán tus rutas desde el servicio

  private map!: L.Map;

  constructor() { }

  ngAfterViewInit(): void {
    this.initMap();
    if (this.rutas.length > 0) {
      this.dibujarRutas();
    }
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [4.6482837, -74.2478958], 
      zoom: 12
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private dibujarRutas(): void {
    this.rutas.forEach(ruta => {
      if (ruta.geometriaRuta) {
        const latlngs = ruta.geometriaRuta.map((coord: any) => [coord.lat, coord.lng]);
        L.polyline(latlngs, { color: 'blue' }).addTo(this.map);
      }
    });
  }
}

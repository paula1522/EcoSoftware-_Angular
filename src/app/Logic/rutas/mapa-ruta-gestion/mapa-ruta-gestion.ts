import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import * as L from 'leaflet';
import { Parada, RutaRecoleccion } from '../../../Models/ruta-recoleccion';
import { RutaRecoleccionService } from '../../../Services/ruta-recoleccion';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { RouteService } from '../../../Services/route.service';
import { EstadoRecoleccion } from '../../../Models/modelo-recoleccion';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mapa-ruta-gestion',
  templateUrl: './mapa-ruta-gestion.html',
  styleUrls: ['./mapa-ruta-gestion.css'],
  standalone: true,
  imports: [CommonModule]
})
export class MapaRutaGestion implements OnInit, OnDestroy {
  @Input() rutaId!: number;
  @Input() modoGestion: boolean = true; // si es false, solo visualización
  @Output() rutaFinalizada = new EventEmitter<void>();

  ruta!: RutaRecoleccion;
  map!: L.Map;
  rutasLayer = L.layerGroup();
  userMarker!: L.Marker;
  watchId: number | null = null;

  EstadoRecoleccion = EstadoRecoleccion; // para usar en el template

  constructor(
    private rutaService: RutaRecoleccionService,
    private recoleccionService: RecoleccionService,
    private routeService: RouteService
  ) {}

  ngOnInit(): void {
    this.cargarRuta();
  }

  ngOnDestroy(): void {
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
  }

  cargarRuta(): void {
    this.rutaService.obtenerPorId(this.rutaId).subscribe({
      next: (ruta) => {
        this.ruta = ruta;
        this.inicializarMapa();
        this.dibujarRuta();
        if (this.modoGestion && this.ruta.estado === 'EN_PROGRESO') {
          this.iniciarTracking();
        }
      },
      error: (err) => console.error(err)
    });
  }

  private inicializarMapa(): void {
    if (this.map) return;
    this.map = L.map('map-gestion', { center: [4.6482837, -74.2478958], zoom: 12 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    this.rutasLayer.addTo(this.map);
  }

  private dibujarRuta(): void {
    this.rutasLayer.clearLayers();

    // Dibujar paradas
     this.ruta.paradas.forEach(parada => {
    const esCompletada = parada.estado === EstadoRecoleccion.Completada;
    const esSiguiente = this.esSiguiente(parada);
    const color = esCompletada ? 'green' : (esSiguiente ? 'red' : 'blue');
    const radio = esSiguiente ? 10 : (esCompletada ? 4 : 6);
    const marker = L.circleMarker([parada.latitud, parada.longitud], {
      radius: radio,
      color: color,
      fillColor: color,
      fillOpacity: 0.8
    }).addTo(this.rutasLayer);
    marker.bindPopup(`Parada ${parada.ordenParada}<br>Estado: ${parada.estado}`);
  });

    // Dibujar línea de ruta
    if (this.ruta.geometriaRuta && this.ruta.geometriaRuta !== '[]') {
    try {
      interface GeoPunto { lat: number; lng: number; }
      const puntos = JSON.parse(this.ruta.geometriaRuta) as GeoPunto[];
      const latlngs = puntos.map((p: GeoPunto) => [p.lat, p.lng] as L.LatLngTuple);
      L.polyline(latlngs, { color: 'green', weight: 5 }).addTo(this.rutasLayer);
      if (latlngs.length) this.map.fitBounds(latlngs, { padding: [50, 50] });
    } catch(e) { console.error(e); }
  } else {
      // Si no tiene geometría, calcularla con OSRM
      const coords = this.ruta.paradas.map(p => [p.latitud, p.longitud] as [number, number]);
      if (coords.length >= 2) {
        this.routeService.getRutaOptimizada(coords).subscribe({

          next: (resp) => {
            const trip = resp.trips[0];
            const latlngs = trip.geometry.coordinates.map(c => [c[1], c[0]] as L.LatLngTuple);
            L.polyline(latlngs, { color: 'green', weight: 5 }).addTo(this.rutasLayer);
            this.map.fitBounds(latlngs, { padding: [50, 50] });
            // Guardar geometría en backend
            const geometriaJson = JSON.stringify(latlngs.map(coord => ({ lat: coord[0], lng: coord[1] })));
            this.rutaService.actualizarRuta(this.ruta.idRuta, {
              distanciaTotal: trip.distance / 1000,
              tiempoEstimado: trip.duration / 60,
              geometriaRuta: geometriaJson
            }).subscribe();
          },
          error: err => console.error(err)
        });
      }
    }
  }

  completarParada(recoleccionId: number): void {
    this.recoleccionService.actualizarEstado(recoleccionId, EstadoRecoleccion.Completada).subscribe({
      next: () => {
        this.cargarRuta(); // refrescar
        if (this.obtenerSiguienteParada() === null) {
          this.finalizarRuta();
        }
      },
      error: err => console.error(err)
    });
  }

  marcarFallida(recoleccionId: number): void {
    this.recoleccionService.marcarFallida(recoleccionId).subscribe({
      next: () => this.cargarRuta(),
      error: err => console.error(err)
    });
  }

  private finalizarRuta(): void {
    this.rutaService.finalizarRuta(this.ruta.idRuta).subscribe({
      next: () => {
        this.rutaFinalizada.emit();
        this.cargarRuta();
      },
      error: err => console.error(err)
    });
  }

  private esSiguiente(parada: Parada): boolean {
    const siguiente = this.obtenerSiguienteParada();
    return siguiente?.recoleccionId === parada.recoleccionId;
  }

  private obtenerSiguienteParada(): Parada | null {
    const pendientes = this.ruta.paradas.filter(p => p.estado !== EstadoRecoleccion.Completada);
    return pendientes.length ? pendientes[0] : null;
  }

  private iniciarTracking(): void {
    if (!navigator.geolocation) return;
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const current: L.LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
        if (!this.userMarker) this.userMarker = L.marker(current).addTo(this.map);
        else this.userMarker.setLatLng(current);
        this.verificarLlegada(current);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  }

  private verificarLlegada(current: L.LatLngTuple): void {
    const siguiente = this.obtenerSiguienteParada();
    if (!siguiente) return;
    const distancia = this.calcularDistancia(current, [siguiente.latitud, siguiente.longitud]);
    if (distancia < 0.03) {
      this.completarParada(siguiente.recoleccionId);
    }
  }

  private calcularDistancia(a: L.LatLngTuple, b: [number, number]): number {
    const R = 6371;
    const dLat = this.toRad(b[0] - a[0]);
    const dLng = this.toRad(b[1] - a[1]);
    const lat1 = this.toRad(a[0]);
    const lat2 = this.toRad(b[0]);
    const x = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(lat1) * Math.cos(lat2);
    return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
  }

  private toRad(v: number): number {
    return v * Math.PI / 180;
  }
}
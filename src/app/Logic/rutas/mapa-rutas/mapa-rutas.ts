import { Component, Input, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { RutaParaMapa, Parada } from '../../../Models/ruta-recoleccion';
import { RouteService, OSRMTripResponse } from '../../../Services/route.service';
import { RutaRecoleccionService } from '../../../Services/ruta-recoleccion';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { EstadoRecoleccion } from '../../../Models/modelo-recoleccion';

@Component({
  selector: 'app-mapa-rutas',
  templateUrl: './mapa-rutas.html',
  styleUrls: ['./mapa-rutas.css']
})
export class MapaRutas implements AfterViewInit, OnChanges, OnDestroy {

  @Input() rutas: RutaParaMapa[] = [];

  private map!: L.Map;
  private rutasLayer = L.layerGroup();
  private userMarker!: L.Marker;
  private watchId: number | null = null;
  private ultimaParadaCompletada: number | null = null;

  constructor(
    private routeService: RouteService,
    private rutaService: RutaRecoleccionService,
    private recoleccionService: RecoleccionService
  ) {}

  ngAfterViewInit(): void {
    this.initMap();
    this.iniciarTracking();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && changes['rutas']) {
      this.dibujarRutas();
    }
  }

  ngOnDestroy(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
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
    this.rutasLayer.addTo(this.map);
  }

  private dibujarRutas(): void {
    this.rutasLayer.clearLayers();

    this.rutas.forEach(ruta => {
      // 1. Dibujar paradas (marcadores)
      if (ruta.paradas && ruta.paradas.length) {
        ruta.paradas.forEach(parada => {
          const esSiguiente = this.esSiguienteParada(ruta, parada);
          const marker = L.circleMarker([parada.latitud, parada.longitud], {
            radius: esSiguiente ? 10 : 6,
            color: esSiguiente ? 'red' : (parada.estado === EstadoRecoleccion.Completada ? 'green' : 'blue'),
            fillColor: esSiguiente ? 'red' : (parada.estado === EstadoRecoleccion.Completada ? 'green' : 'blue'),
            fillOpacity: 0.8
          }).addTo(this.rutasLayer);
          marker.bindPopup(`Parada ${parada.ordenParada}<br>Estado: ${parada.estado}`);
        });
      }

      // 2. Dibujar línea de ruta
      if (ruta.geometriaRuta && ruta.geometriaRuta !== '[]') {
        try {
          const puntos = JSON.parse(ruta.geometriaRuta); // array de {lat, lng}
          const latlngs = puntos.map((p: any) => [p.lat, p.lng] as L.LatLngTuple);
          L.polyline(latlngs, { color: 'green', weight: 5 }).addTo(this.rutasLayer);
          if (latlngs.length) this.map.fitBounds(latlngs, { padding: [50, 50] });
        } catch (e) {
          console.error('Error parsing geometriaRuta', e);
        }
      } else {
        // Si no tiene geometría, calcularla con OSRM si hay suficientes paradas
        const coords = ruta.paradas
          .filter(p => p.latitud != null && p.longitud != null)
          .map(p => [p.latitud, p.longitud] as [number, number]);
        if (coords.length >= 2) {
          this.routeService.getRutaOptimizada(coords).subscribe({
            next: (resp: OSRMTripResponse) => {
              const trip = resp.trips[0];
              const latlngs = trip.geometry.coordinates.map(c => [c[1], c[0]] as L.LatLngTuple);
              L.polyline(latlngs, { color: 'green', weight: 5 }).addTo(this.rutasLayer);
              this.map.fitBounds(latlngs, { padding: [50, 50] });

              // Guardar geometría en el backend
              const geometriaJson = JSON.stringify(latlngs.map(coord => ({ lat: coord[0], lng: coord[1] })));
              this.rutaService.actualizarRuta(ruta.idRuta, {
                distanciaTotal: trip.distance / 1000,
                tiempoEstimado: trip.duration / 60,
                geometriaRuta: geometriaJson
              }).subscribe({
                next: () => console.log('Ruta optimizada guardada'),
                error: err => console.error(err)
              });
            },
            error: err => console.error('Error obteniendo ruta optimizada', err)
          });
        }
      }
    });
  }

  private iniciarTracking(): void {
    if (!navigator.geolocation) return;
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const current: L.LatLngTuple = [lat, lng];
        if (!this.userMarker) {
          this.userMarker = L.marker(current).addTo(this.map);
        } else {
          this.userMarker.setLatLng(current);
        }
        this.verificarLlegada(current);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  }

  private verificarLlegada(current: L.LatLngTuple): void {
    this.rutas.forEach(ruta => {
      const siguiente = this.obtenerSiguienteParada(ruta);
      if (!siguiente) return;

      const distancia = this.calcularDistancia(current, [siguiente.latitud, siguiente.longitud]);
      if (distancia < 0.03 && this.ultimaParadaCompletada !== siguiente.recoleccionId) {
        this.ultimaParadaCompletada = siguiente.recoleccionId;
        this.recoleccionService.actualizarEstado(siguiente.recoleccionId, EstadoRecoleccion.Completada).subscribe({
          next: () => {
            // Actualizar estado localmente
            siguiente.estado = EstadoRecoleccion.Completada;
            // Refrescar rutas para actualizar visualmente
            this.dibujarRutas();
            // Si ya no hay paradas pendientes, finalizar ruta automáticamente
            if (this.obtenerSiguienteParada(ruta) === null) {
              this.rutaService.finalizarRuta(ruta.idRuta).subscribe({
                next: () => console.log('Ruta finalizada automáticamente'),
                error: err => console.error(err)
              });
            }
          },
          error: err => console.error('Error completando parada', err)
        });
      }
    });
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

  private obtenerSiguienteParada(ruta: RutaParaMapa): Parada | null {
    if (!ruta.paradas) return null;
    const pendientes = ruta.paradas.filter(p => p.estado !== EstadoRecoleccion.Completada);
    if (pendientes.length === 0) return null;
    return pendientes.sort((a, b) => a.ordenParada - b.ordenParada)[0];
  }

  private esSiguienteParada(ruta: RutaParaMapa, parada: Parada): boolean {
    const siguiente = this.obtenerSiguienteParada(ruta);
    return siguiente?.recoleccionId === parada.recoleccionId;
  }
}
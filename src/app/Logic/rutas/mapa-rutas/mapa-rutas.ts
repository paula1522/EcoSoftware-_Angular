import { Component, Input, AfterViewInit, OnChanges, SimpleChanges, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { RutaParaMapa, Parada } from '../../../Models/ruta-recoleccion';
import { RouteService, OSRMTripResponse } from '../../../Services/route.service';
import { RutaRecoleccionService } from '../../../Services/ruta-recoleccion';
import { EstadoRecoleccion } from '../../../Models/modelo-recoleccion';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mapa-rutas',
  templateUrl: './mapa-rutas.html',
  styleUrls: ['./mapa-rutas.css'],
  standalone: true,
  imports: [CommonModule]
})
export class MapaRutas implements AfterViewInit, OnChanges, OnDestroy {
  @Input() rutas: RutaParaMapa[] = [];
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map!: L.Map;
  private rutasLayer = L.layerGroup();
  private markersLayer = L.layerGroup();

  constructor(
    private routeService: RouteService,
    private rutaService: RutaRecoleccionService
  ) {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && changes['rutas']) {
      this.dibujarRutas();
    }
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    if (this.map) return;
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [4.6482837, -74.2478958],
      zoom: 12
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    this.rutasLayer.addTo(this.map);
    this.markersLayer.addTo(this.map);
    this.dibujarRutas();
  }

  private dibujarRutas(): void {
    this.rutasLayer.clearLayers();
    this.markersLayer.clearLayers();

    if (!this.rutas.length) return;

    const todasLasCoordenadas: L.LatLngTuple[] = [];

    this.rutas.forEach(ruta => {
      // Dibujar paradas como círculos de colores según estado
      if (ruta.paradas && ruta.paradas.length) {
        ruta.paradas.forEach(parada => {
          const estado = parada.estado;
          const color = estado === EstadoRecoleccion.Completada ? 'green' : 
                        (estado === EstadoRecoleccion.Fallida ? 'red' : 'blue');
          const radio = estado === EstadoRecoleccion.Completada ? 4 : 6;
          const marker = L.circleMarker([parada.latitud, parada.longitud], {
            radius: radio,
            color: color,
            fillColor: color,
            fillOpacity: 0.8
          }).addTo(this.markersLayer);
          marker.bindPopup(`
            <b>${ruta.nombre}</b><br>
            Parada ${parada.ordenParada}<br>
            Estado: ${parada.estado}
          `);
          todasLasCoordenadas.push([parada.latitud, parada.longitud]);
        });
      }

      // Dibujar línea de ruta si existe geometría guardada
      if (ruta.geometriaRuta && ruta.geometriaRuta !== '[]') {
        try {
          const puntos = JSON.parse(ruta.geometriaRuta);
          const latlngs = puntos.map((p: any) => [p.lat, p.lng] as L.LatLngTuple);
          L.polyline(latlngs, { color: '#198754', weight: 4, opacity: 0.7 }).addTo(this.rutasLayer);
          todasLasCoordenadas.push(...latlngs);
        } catch (e) {
          console.error('Error parseando geometría', e);
        }
      } else {
        // Si no tiene geometría, calcularla sobre la marcha (solo si tiene al menos 2 paradas)
        const coords = ruta.paradas
          .filter(p => p.latitud != null && p.longitud != null)
          .map(p => [p.latitud, p.longitud] as [number, number]);
        if (coords.length >= 2) {
          this.calcularYGuardarGeometria(ruta, coords);
        }
      }
    });

    // Ajustar vista para que quepan todos los puntos
    if (todasLasCoordenadas.length) {
      const bounds = L.latLngBounds(todasLasCoordenadas);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  private calcularYGuardarGeometria(ruta: RutaParaMapa, coords: [number, number][]): void {
    this.routeService.getRutaOptimizada(coords).subscribe({
      next: (resp) => {
        const trip = resp.trips[0];
        const latlngs = trip.geometry.coordinates.map(c => [c[1], c[0]] as L.LatLngTuple);
        L.polyline(latlngs, { color: '#198754', weight: 4, opacity: 0.7 }).addTo(this.rutasLayer);
        // Guardar geometría en el backend para futuras visualizaciones
        const geometriaJson = JSON.stringify(latlngs.map(coord => ({ lat: coord[0], lng: coord[1] })));
        this.rutaService.actualizarRuta(ruta.idRuta, {
          distanciaTotal: trip.distance / 1000,
          tiempoEstimado: trip.duration / 60,
          geometriaRuta: geometriaJson
        }).subscribe();
      },
      error: err => console.error('Error obteniendo ruta optimizada', err)
    });
  }


  
}
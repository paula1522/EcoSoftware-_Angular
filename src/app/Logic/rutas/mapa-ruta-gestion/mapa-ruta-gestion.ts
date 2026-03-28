import {
  Component, Input, OnInit, OnDestroy, Output, EventEmitter,
  ElementRef, ViewChild, AfterViewInit
} from '@angular/core';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';
import { RutaRecoleccionService } from '../../../Services/ruta-recoleccion';
import { RecoleccionService } from '../../../Services/recoleccion.service';
import { RouteService } from '../../../Services/route.service';
import { EstadoRecoleccion } from '../../../Models/modelo-recoleccion';
import { Parada, RutaRecoleccion } from '../../../Models/ruta-recoleccion';
import { Alerta } from '../../../shared/alerta/alerta';

@Component({
  selector: 'app-mapa-ruta-gestion',
  templateUrl: './mapa-ruta-gestion.html',
  styleUrls: ['./mapa-ruta-gestion.css'],
  standalone: true,
  imports: [CommonModule, Alerta]
})
export class MapaRutaGestion implements OnInit, AfterViewInit, OnDestroy {
  @Input() rutaId!: number;
  @Input() modoGestion: boolean = true;
  @Output() rutaFinalizada = new EventEmitter<void>();
  @Output() paradaSeleccionada = new EventEmitter<number>(); // para notificar al padre si lo necesita

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  ruta!: RutaRecoleccion;
  map!: L.Map;
  routeLine?: L.Polyline;
  markersLayer = L.layerGroup();
  userMarker!: L.Marker;
  watchId: number | null = null;
  cargando = true;
  error = '';

  EstadoRecoleccion = EstadoRecoleccion;
  paradaSeleccionadaId: number | null = null; // para resaltar en la lista

  tipoAlerta: 'success' | 'error' | 'warning' | 'info' = 'info';
  mensajeAlerta = '';
  mostrarAlerta = false;

  constructor(
    private rutaService: RutaRecoleccionService,
    private recoleccionService: RecoleccionService,
    private routeService: RouteService
  ) {}

  ngOnInit(): void {
    this.cargarRuta();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    if (this.map) this.map.remove();
  }

  cargarRuta(): void {
    this.cargando = true;
    this.rutaService.obtenerPorId(this.rutaId).subscribe({
      next: (ruta) => {
        this.ruta = ruta;
        this.cargando = false;
        this.inicializarMapa();
        this.dibujarRuta();
        if (this.modoGestion && this.ruta.estado === 'EN_PROGRESO') {
          this.iniciarTracking();
        }
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar la ruta';
        this.cargando = false;
        this.mostrarAlertaGlobal(this.error, 'error');
      }
    });
  }

  private inicializarMapa(): void {
    if (this.map) return;
    // Centro temporal (se ajustará luego con tracking o con la primera parada)
    const centro: L.LatLngTuple = this.ruta.paradas.length
      ? [this.ruta.paradas[0].latitud, this.ruta.paradas[0].longitud]
      : [4.6482837, -74.2478958];
    this.map = L.map(this.mapContainer.nativeElement, { center: centro, zoom: 12 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    this.markersLayer.addTo(this.map);
  }

  private dibujarRuta(): void {
    this.markersLayer.clearLayers();
    if (this.routeLine) this.routeLine.remove();

    // Dibujar paradas
    this.ruta.paradas.forEach(parada => {
      const esCompletada = parada.estado === EstadoRecoleccion.Completada;
      const esSiguiente = this.esSiguiente(parada);
      const esSeleccionada = parada.recoleccionId === this.paradaSeleccionadaId;
      const color = esCompletada ? 'green' : (esSiguiente ? 'red' : (esSeleccionada ? 'orange' : 'blue'));
      const radio = esSiguiente ? 10 : (esCompletada ? 4 : (esSeleccionada ? 8 : 6));
      const marker = L.circleMarker([parada.latitud, parada.longitud], {
        radius: radio,
        color: color,
        fillColor: color,
        fillOpacity: 0.8
      }).addTo(this.markersLayer);
      marker.bindPopup(`
        <b>Parada ${parada.ordenParada}</b><br>
        Estado: ${parada.estado}<br>
        <button class="btn-popup" data-id="${parada.recoleccionId}">Seleccionar</button>
      `);
      marker.on('click', () => {
        this.seleccionarParada(parada.recoleccionId);
      });
    });

    // Dibujar línea de ruta si existe geometría
    if (this.ruta.geometriaRuta && this.ruta.geometriaRuta !== '[]') {
      try {
        const puntos = JSON.parse(this.ruta.geometriaRuta);
        const latlngs = puntos.map((p: any) => [p.lat, p.lng] as L.LatLngTuple);
        this.routeLine = L.polyline(latlngs, { color: '#198754', weight: 5 }).addTo(this.map);
        if (latlngs.length) this.map.fitBounds(latlngs, { padding: [50, 50] });
      } catch (e) {
        console.error('Error parsing geometriaRuta', e);
      }
    }
  }

  // Método para seleccionar una parada desde la lista o desde el mapa
  seleccionarParada(recoleccionId: number): void {
    this.paradaSeleccionadaId = recoleccionId;
    this.dibujarRuta(); // redibuja para resaltar
    // Opcional: centrar el mapa en la parada seleccionada
    const parada = this.ruta.paradas.find(p => p.recoleccionId === recoleccionId);
    if (parada && this.map) {
      this.map.setView([parada.latitud, parada.longitud], 16);
    }
    this.paradaSeleccionada.emit(recoleccionId);
  }

  // ========== LÓGICA DE PARADAS ==========
  obtenerDireccionParada(parada: Parada): string {
    return `📍 Parada ${parada.ordenParada} - Coordenadas: ${parada.latitud.toFixed(5)}, ${parada.longitud.toFixed(5)}`;
  }

  completarParada(recoleccionId: number): void {
    this.recoleccionService.actualizarEstado(recoleccionId, EstadoRecoleccion.Completada).subscribe({
      next: () => {
        const parada = this.ruta.paradas.find(p => p.recoleccionId === recoleccionId);
        if (parada) {
          parada.estado = EstadoRecoleccion.Completada;
          this.dibujarRuta(); // actualizar mapa
        }
        if (this.obtenerSiguienteParada() === null) {
          this.finalizarRuta();
        }
      },
      error: (err) => {
        console.error(err);
        this.mostrarAlertaGlobal('Error al completar la parada', 'error');
      }
    });
  }

  marcarFallida(recoleccionId: number): void {
    this.recoleccionService.marcarFallida(recoleccionId).subscribe({
      next: () => {
        const parada = this.ruta.paradas.find(p => p.recoleccionId === recoleccionId);
        if (parada) {
          parada.estado = EstadoRecoleccion.Fallida;
          this.dibujarRuta();
        }
      },
      error: (err) => {
        console.error(err);
        this.mostrarAlertaGlobal('Error al marcar como fallida', 'error');
      }
    });
  }

  completarParadaDesdeLista(parada: Parada): void {
    this.completarParada(parada.recoleccionId);
  }

  marcarFallidaDesdeLista(parada: Parada): void {
    this.marcarFallida(parada.recoleccionId);
  }

  private finalizarRuta(): void {
    this.rutaService.finalizarRuta(this.ruta.idRuta).subscribe({
      next: () => {
        this.rutaFinalizada.emit();
        this.cargarRuta();
        this.mostrarAlertaGlobal('Ruta finalizada', 'success');
      },
      error: (err) => {
        console.error(err);
        this.mostrarAlertaGlobal('Error al finalizar ruta', 'error');
      }
    });
  }

  private esSiguiente(parada: Parada): boolean {
    const siguiente = this.obtenerSiguienteParada();
    return siguiente?.recoleccionId === parada.recoleccionId;
  }

  private obtenerSiguienteParada(): Parada | null {
    const pendientes = this.ruta.paradas.filter(p => p.estado !== EstadoRecoleccion.Completada);
    if (pendientes.length === 0) return null;
    return pendientes.sort((a, b) => a.ordenParada - b.ordenParada)[0];
  }

  // ========== TRACKING ==========
  private iniciarTracking(): void {
    if (!navigator.geolocation) {
      this.mostrarAlertaGlobal('Geolocalización no soportada', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const current: L.LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
        // Centrar el mapa en la ubicación actual
        if (this.map) this.map.setView(current, 14);
        this.watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const currentPos: L.LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
            if (!this.userMarker) {
              this.userMarker = L.marker(currentPos, { icon: this.vehiculoIcon() }).addTo(this.map);
            } else {
              this.userMarker.setLatLng(currentPos);
            }
            this.verificarLlegada(currentPos);
          },
          (err) => {
            console.error('Error de geolocalización', err);
            this.mostrarAlertaGlobal('Error obteniendo ubicación', 'error');
          },
          { enableHighAccuracy: true }
        );
      },
      (err) => {
        console.error('Permiso denegado', err);
        this.mostrarAlertaGlobal('Permiso de ubicación denegado', 'warning');
      }
    );
  }

  private vehiculoIcon(): L.Icon {
    return L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      shadowSize: [41, 41]
    });
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

  private mostrarAlertaGlobal(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info'): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;
    setTimeout(() => (this.mostrarAlerta = false), 4000);
  }

  estadoBadgeClass(estado?: string): string {
    switch (estado) {
      case 'PLANIFICADA': return 'badge-planificada';
      case 'EN_PROGRESO': return 'badge-progreso';
      case 'FINALIZADA': return 'badge-finalizada';
      case 'CANCELADA': return 'badge-cancelada';
      default: return '';
    }
  }
}
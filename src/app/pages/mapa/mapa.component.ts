import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Header } from '../../core/header/header';
import { ActivatedRoute } from '@angular/router';
import {
  Icon,
  Map as LeafletMap,
  Marker,
  Polyline,
  divIcon,
  latLngBounds,
  marker,
  polyline,
  tileLayer,
} from 'leaflet';
import { Subscription, firstValueFrom } from 'rxjs';
import {
  PuntoReciclaje,
  PuntosReciclajeService,
} from '../../Services/puntos-reciclaje.service';
import { OsrmService } from '../../Services/osrm.service';

interface OsrmStep {
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    location?: [number, number];
    bearing_after?: number;
  };
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
  legs: Array<{
    steps: OsrmStep[];
  }>;
}

interface OsrmResponse {
  routes: OsrmRoute[];
}

interface RutaPaso {
  texto: string;
  lat: number;
  lng: number;
  angulo?: number;
}

interface RutaCalculada {
  etiqueta: string;
  distanciaKm: number;
  duracionMin: number;
  pasos: RutaPaso[];
  geometria: [number, number][];
}

interface GeocodeSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

interface PuntoDecorado extends PuntoReciclaje {
  cardColor: string;
  borderColor: string;
  chipBg: string;
  chipColor: string;
}

@Component({
  selector: 'app-mapa',
  standalone: true,
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css'],
  imports: [CommonModule, FormsModule, Header],
})
export class MapaComponent implements AfterViewInit, OnDestroy, OnInit {
  private static instanceCounter = 0;
  private readonly bogotaCoords: [number, number] = [4.711, -74.0721];
  private readonly defaultZoom = 13;
  private readonly bogotaViewBox = '-74.227,4.836,-73.986,4.469';
  private mapInstance?: LeafletMap;
  private resizeObserver?: ResizeObserver;
  private dataMarkers: Marker[] = [];
  private markerIndex = new Map<number, Marker>();
  private routeLine?: Polyline;
  private origenMarker?: Marker;
  private destinoMarker?: Marker;
  private cursorMarker?: Marker;
  private origenCoords?: { lat: number; lng: number };
  private puntosSub?: Subscription;
  private refreshSub?: Subscription;
  private queryParamsSub?: Subscription;
  private colorRutaActual = '#2563eb';
  private puntoEnfocado?: { id?: number; lat?: number; lng?: number; nombre?: string };
  private origenBusquedaTimer?: ReturnType<typeof setTimeout>;
  private destinoBusquedaTimer?: ReturnType<typeof setTimeout>;
  private origenSugerenciaSeleccionada?: GeocodeSuggestion;
  private destinoSugerenciaSeleccionada?: GeocodeSuggestion;
  private usarOrigenCoordsConfirmadas = false;
  private destinoCoordsConfirmadas?: { lat: number; lng: number };
  private readonly materialesBase = ['papel', 'plastico', 'vidrio', 'metal'];

  @ViewChild('mapHost') private mapHostRef?: ElementRef<HTMLDivElement>;
  @ViewChild('destinoInputRef') private destinoInputRef?: ElementRef<HTMLInputElement>;

  public readonly mapContainerId = `mapa-bogota-${++MapaComponent.instanceCounter}`;
  public puntos: PuntoReciclaje[] = [];
  public puntosDecorados: PuntoDecorado[] = [];
  public origenInput = '';
  public destinoInput = '';
  public destinoSeleccionadoId: number | null = null;
  public rutasCalculadas: RutaCalculada[] = [];
  public rutaSeleccionadaIndex = 0;
  public mostrarPasosOverlay = false;
  public pasosVisibles: RutaPaso[] = [];
  public rutaCalculando = false;
  public rutaError = '';
  public mostrarPuntosCercanos = false;
  public puntosFiltroCercano: PuntoReciclaje[] = [];
  public destinoDropdownAbierto = false;
  public origenSugerencias: GeocodeSuggestion[] = [];
  public destinoSugerencias: GeocodeSuggestion[] = [];
  public buscandoOrigen = false;
  public buscandoDestino = false;
  public mensajePrecisionUbicacion = '';
  public readonly materialesFiltro = [
    { value: 'papel', label: 'Papel' },
    { value: 'plastico', label: 'Plástico' },
    { value: 'vidrio', label: 'Vidrio' },
    { value: 'metal', label: 'Metal' },
  ];
  public materialesSeleccionados = new Set<string>();

  constructor(
    private readonly puntosService: PuntosReciclajeService,
    private readonly http: HttpClient,
    private readonly osrmService: OsrmService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.refreshSub = this.puntosService.refresh$.subscribe(() => this.cargarPuntos());
    this.queryParamsSub = this.route.queryParamMap.subscribe((params) => {
      const id = this.parseNumberParam(params.get('id'));
      const lat = this.parseNumberParam(params.get('lat'));
      const lng = this.parseNumberParam(params.get('lng'));
      const nombre = params.get('nombre')?.trim() || undefined;

      this.puntoEnfocado = id != null || (lat != null && lng != null) || nombre
        ? { id: id ?? undefined, lat: lat ?? undefined, lng: lng ?? undefined, nombre }
        : undefined;

      this.aplicarEnfoquePunto();
    });
  }

  ngAfterViewInit(): void {
    this.mapInstance = new LeafletMap(this.mapContainerId, {
      center: this.bogotaCoords,
      zoom: this.defaultZoom,
      zoomControl: false,
    });

    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.mapInstance);

    this.inicializarObservadorRedimension();
    this.programarAjusteMapa();
    this.cargarPuntos();
  }

  ngOnDestroy(): void {
    this.puntosSub?.unsubscribe();
    this.refreshSub?.unsubscribe();
    this.queryParamsSub?.unsubscribe();
    if (this.origenBusquedaTimer) {
      clearTimeout(this.origenBusquedaTimer);
    }
    if (this.destinoBusquedaTimer) {
      clearTimeout(this.destinoBusquedaTimer);
    }
    this.resizeObserver?.disconnect();
    this.routeLine?.remove();
    this.origenMarker?.remove();
    this.destinoMarker?.remove();
    this.cursorMarker?.remove();
    this.limpiarMarcadores();
    this.mapInstance?.remove();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.programarAjusteMapa();
  }

  private cargarPuntos(): void {
    this.puntosSub?.unsubscribe();
    this.puntosSub = this.puntosService.getPuntos().subscribe({
      next: (response) => {
        const puntos = response?.data ?? [];
        this.puntos = puntos;
        this.aplicarFiltrosPuntos();
        this.aplicarEnfoquePunto();
        this.programarAjusteMapa();
      },
      error: (err) => {
        console.error('Error al obtener los puntos de reciclaje', err);
      },
    });
  }

  private crearMarcador(punto: PuntoReciclaje): void {
    if (!this.mapInstance) {
      return;
    }

    const lat = Number(punto.latitud);
    const lng = Number(punto.longitud);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }

    const nuevoMarcador = marker([lat, lng], {
      icon: this.getIconoResiduo(punto.tipoResiduo ?? ''),
    })
      .addTo(this.mapInstance)
      .bindPopup(this.obtenerPopupContenido(punto));

    nuevoMarcador.on('click', () => {
      this.seleccionarPuntoComoDestino(punto, false);
    });

    this.dataMarkers.push(nuevoMarcador);
    if (punto.id !== undefined) {
      this.markerIndex.set(punto.id, nuevoMarcador);
    }
  }

  private obtenerPopupContenido(punto: PuntoReciclaje): string {
    const nombre = punto.nombre ?? 'Punto sin nombre';
    const direccion = punto.direccion ?? 'Dirección no disponible';
    const horario = punto.horario ?? 'Horario no informado';
    const tipoResiduo = punto.tipoResiduo ?? 'Tipo no especificado';
    const descripcion = punto.descripcion ?? '';

    return `
      <div class="popup-punto">
        <strong>${nombre}</strong><br>
        <small>${direccion}</small>
        <hr>
        <div><strong>Horario:</strong> ${horario}</div>
        <div><strong>Residuo:</strong> ${tipoResiduo}</div>
        ${descripcion ? `<div><strong>Descripción:</strong> ${descripcion}</div>` : ''}
      </div>
    `;
  }

  private limpiarMarcadores(): void {
    this.dataMarkers.forEach((mk) => mk.remove());
    this.dataMarkers = [];
    this.markerIndex.clear();
  }

  private ajustarVistaMapa(): void {
    if (!this.mapInstance) {
      return;
    }

    if (!this.dataMarkers.length) {
      this.mapInstance.setView(this.bogotaCoords, this.defaultZoom);
      return;
    }

    const bounds = latLngBounds(this.dataMarkers.map((mk) => mk.getLatLng()));
    this.mapInstance.fitBounds(bounds, { padding: [24, 24] });
  }

  private aplicarFiltrosPuntos(): void {
    const puntosBase = this.mostrarPuntosCercanos ? this.puntosFiltroCercano : this.puntos;
    const puntosFiltrados = puntosBase.filter((punto) => this.coincideConFiltrosMateriales(punto.tipoResiduo ?? ''));

    this.puntosDecorados = puntosFiltrados.map((punto) => ({
      ...punto,
      ...this.obtenerColoresTarjeta(punto.tipoResiduo ?? ''),
    }));

    this.limpiarMarcadores();
    puntosFiltrados.forEach((punto) => this.crearMarcador(punto));
    this.ajustarVistaMapa();
  }

  private coincideConFiltrosMateriales(tipoResiduo: string): boolean {
    if (!this.materialesSeleccionados.size) {
      return true;
    }

    const tokens = this.extraerMateriales(tipoResiduo);
    return Array.from(this.materialesSeleccionados).some((material) => tokens.includes(material));
  }

  private extraerMateriales(tipoResiduo: string): string[] {
    const normalized = this.normalizarTextoResiduo(tipoResiduo);
    return this.materialesBase.filter((material) => normalized.includes(material));
  }

  private normalizarTextoResiduo(valor: string): string {
    return (valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private inicializarObservadorRedimension(): void {
    const hostElement = this.mapHostRef?.nativeElement;
    if (!hostElement || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.programarAjusteMapa();
    });

    this.resizeObserver.observe(hostElement);
  }

  private programarAjusteMapa(): void {
    if (!this.mapInstance) {
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.mapInstance?.invalidateSize();
      });
    });
  }

  public usarMiUbicacion(): void {
    if (!navigator.geolocation) {
      this.rutaError = 'Tu navegador no soporta geolocalización.';
      return;
    }

    this.rutaError = '';
    this.mensajePrecisionUbicacion = 'Buscando la mejor precisión disponible...';

    this.obtenerMejorUbicacionActual()
      .then(async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let origen = { lat: latitude, lng: longitude };

        try {
          origen = await this.snapToRoad(latitude, longitude);
        } catch (snapErr) {
          console.warn('No se pudo ajustar el origen a la vía', snapErr);
        }

        this.origenCoords = origen;
        this.origenSugerenciaSeleccionada = undefined;
        this.usarOrigenCoordsConfirmadas = true;
        localStorage.setItem('ubicacionActual', JSON.stringify({
          lat: origen.lat,
          lng: origen.lng,
          accuracy,
          timestamp: new Date().toISOString()
        }));

        this.mensajePrecisionUbicacion = this.crearMensajePrecision(accuracy);
        this.mapInstance?.setView([origen.lat, origen.lng], 16);
        this.marcarOrigen(origen);
        await this.actualizarDireccionDesdeCoordenadas(origen.lat, origen.lng);
      })
      .catch((error: GeolocationPositionError | Error) => {
        console.error('Error geolocalización', error);
        this.mensajePrecisionUbicacion = '';
        this.rutaError = 'No pudimos obtener tu ubicación con precisión suficiente.';
      });
  }

  public async calcularRuta(): Promise<void> {
    this.rutaError = '';
    this.rutasCalculadas = [];
    this.mostrarPasosOverlay = false;
    this.pasosVisibles = [];
    this.routeLine?.remove();
    this.destinoMarker?.remove();

    let origen: { lat: number; lng: number };
    try {
      origen = await this.obtenerCoordenadasOrigen();
    } catch (error) {
      this.rutaError =
        error instanceof Error
          ? error.message
          : 'No pudimos interpretar el origen indicado.';
      return;
    }

    try {
      origen = await this.snapToRoad(origen.lat, origen.lng);
    } catch (snapErr) {
      console.warn('No se pudo ajustar el origen a la vía', snapErr);
    }

    let destLat: number;
    let destLng: number;

    if (this.destinoSeleccionadoId === -1) {
      // user chose to type an address
      const texto = this.destinoInput.trim();
      if (!texto) {
        this.rutaError = 'Ingresa una dirección de destino.';
        return;
      }

      try {
        const coords = this.destinoCoordsConfirmadas
          ? this.destinoCoordsConfirmadas
          : this.destinoSugerenciaSeleccionada && this.destinoInput.trim() === this.destinoSugerenciaSeleccionada.displayName
            ? this.destinoSugerenciaSeleccionada
            : await this.geocodificarDireccion(texto);
        destLat = coords.lat;
        destLng = coords.lng;
      } catch (error) {
        this.rutaError =
          error instanceof Error ? error.message : 'No pudimos interpretar el destino indicado.';
        return;
      }

      // keep default route color for free-text destinations
      this.colorRutaActual = '#0ea5e9';

      // attempt to snap to nearest road to improve OSRM acceptance
      try {
        const snap = await this.snapToRoad(destLat, destLng);
        destLat = snap.lat;
        destLng = snap.lng;
      } catch (snapErr) {
        console.warn('No se pudo ajustar destino a la vía', snapErr);
      }
    } else {
      const destino = this.puntos.find((p) => p.id === this.destinoSeleccionadoId);
      if (!destino) {
        this.rutaError = 'Selecciona un punto de destino.';
        return;
      }

      destLat = Number(destino.latitud);
      destLng = Number(destino.longitud);
      if (Number.isNaN(destLat) || Number.isNaN(destLng)) {
        this.rutaError = 'El destino no tiene coordenadas válidas.';
        return;
      }

      this.colorRutaActual = this.obtenerColorResiduo(destino.tipoResiduo ?? '');
    }
    this.marcarOrigen(origen);

    this.rutaCalculando = true;

    // log coordinates for debugging
    console.debug('calculating OSRM route', { origen, destLat, destLng });
    this.osrmService.calcularRuta<OsrmResponse>(
      { lat: origen.lat, lng: origen.lng },
      { lat: destLat, lng: destLng },
      2
    ).subscribe({
      next: (response) => {
        this.rutaCalculando = false;
        const routes = response?.routes ?? [];
        if (!routes.length) {
          this.rutaError = 'No encontramos rutas disponibles. Puede que el destino esté fuera de la zona de enrutamiento.';
          return;
        }

        this.rutasCalculadas = routes.slice(0, 2).map((route, index) => ({
          etiqueta: index === 0 ? 'Ruta recomendada' : 'Opción alternativa',
          distanciaKm: +(route.distance / 1000).toFixed(2),
          duracionMin: +(route.duration / 60).toFixed(1),
          pasos: this.extraerInstrucciones(route.legs?.[0]?.steps ?? []),
          geometria: route.geometry.coordinates,
        }));

        this.seleccionarRuta(0);
      },
      error: (err) => {
        console.error('Error OSRM', err);
        this.rutaCalculando = false;
        const msg = err?.message || '';
        // if we have coords, include them in message for debugging
        this.rutaError = `Error de enrutamiento${destLat != null && destLng != null ? ` (coords ${destLat.toFixed(6)},${destLng.toFixed(6)})` : ''}: ${msg || 'No se pudo calcular la ruta con OSRM.'}`;
      },
    });
  }

  public seleccionarRuta(index: number): void {
    const ruta = this.rutasCalculadas[index];
    if (!ruta) {
      return;
    }

    this.rutaSeleccionadaIndex = index;
    this.pasosVisibles = ruta.pasos;
    this.mostrarPasosOverlay = true;
    this.dibujarRuta(ruta.geometria);

    const ultimoPunto = ruta.geometria[ruta.geometria.length - 1];
    if (ultimoPunto) {
      const [lng, lat] = ultimoPunto;
      this.marcarDestino({ lat, lng });
    }
  }

  public centrarEnPunto(punto: PuntoReciclaje): void {
    if (!this.mapInstance) {
      return;
    }

    const lat = Number(punto.latitud);
    const lng = Number(punto.longitud);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }

    const centrarMarcador = (markerRef?: Marker): void => {
      this.mapInstance?.setView([lat, lng], 16, { animate: true } as any);
      markerRef?.openPopup();

      // Leaflet hace auto-pan al abrir el popup y desplaza el marcador.
      // Recentramos después para mantener el punto en la perspectiva principal del usuario.
      setTimeout(() => {
        this.mapInstance?.panTo([lat, lng], { animate: true } as any);
      }, 120);
    };

    if (punto.id !== undefined) {
      const markerRef = this.markerIndex.get(punto.id);
      centrarMarcador(markerRef);
      return;
    }

    const markerRef = this.buscarMarcadorPorCoordenadas(lat, lng);
    centrarMarcador(markerRef);
  }

  public seleccionarPuntoComoDestino(punto: PuntoReciclaje, centrar = true): void {
    const lat = Number(punto.latitud);
    const lng = Number(punto.longitud);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }

    this.destinoSeleccionadoId = punto.id ?? null;
    this.destinoCoordsConfirmadas = undefined;
    this.destinoSugerenciaSeleccionada = undefined;
    this.destinoSugerencias = [];
    this.destinoInput = '';
    this.destinoDropdownAbierto = false;
    this.rutaError = '';

    if (centrar) {
      this.centrarEnPunto(punto);
      return;
    }

    this.marcarDestino({ lat, lng });
  }

  public esDestinoSeleccionado(punto: PuntoReciclaje): boolean {
    return punto.id !== undefined && this.destinoSeleccionadoId === punto.id;
  }

  private aplicarEnfoquePunto(): void {
    if (!this.mapInstance || !this.puntoEnfocado || !this.puntos.length) {
      return;
    }

    const punto = this.buscarPuntoEnfocado();
    if (!punto) {
      return;
    }

    this.centrarEnPunto(punto);
  }

  private buscarPuntoEnfocado(): PuntoReciclaje | undefined {
    const objetivo = this.puntoEnfocado;
    if (!objetivo) {
      return undefined;
    }

    if (objetivo.id != null) {
      const porId = this.puntos.find((punto) => Number(punto.id) === objetivo.id);
      if (porId) {
        return porId;
      }
    }

    if (objetivo.lat != null && objetivo.lng != null) {
      const porCoordenadas = this.puntos.find((punto) =>
        this.sonCoordenadasIguales(Number(punto.latitud), objetivo.lat!) &&
        this.sonCoordenadasIguales(Number(punto.longitud), objetivo.lng!)
      );
      if (porCoordenadas) {
        return porCoordenadas;
      }
    }

    if (objetivo.nombre) {
      return this.puntos.find((punto) =>
        (punto.nombre || '').trim().toLowerCase() === objetivo.nombre!.toLowerCase()
      );
    }

    return undefined;
  }

  private buscarMarcadorPorCoordenadas(lat: number, lng: number): Marker | undefined {
    return this.dataMarkers.find((marcador) => {
      const position = marcador.getLatLng();
      return this.sonCoordenadasIguales(position.lat, lat) && this.sonCoordenadasIguales(position.lng, lng);
    });
  }

  private sonCoordenadasIguales(valorA: number, valorB: number): boolean {
    if (Number.isNaN(valorA) || Number.isNaN(valorB)) {
      return false;
    }

    return Math.abs(valorA - valorB) < 0.00001;
  }

  private parseNumberParam(value: string | null): number | null {
    if (value == null || value.trim() === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private async obtenerCoordenadasOrigen(): Promise<{ lat: number; lng: number }> {
    const valor = this.origenInput.trim();

    if (this.usarOrigenCoordsConfirmadas && this.origenCoords) {
      return this.origenCoords;
    }

    if (valor) {
      if (this.origenSugerenciaSeleccionada && valor === this.origenSugerenciaSeleccionada.displayName) {
        this.origenCoords = {
          lat: this.origenSugerenciaSeleccionada.lat,
          lng: this.origenSugerenciaSeleccionada.lng,
        };
        this.usarOrigenCoordsConfirmadas = true;
        return this.origenCoords;
      }

      const parsed = this.parseLatLngString(valor);
      if (parsed) {
        this.origenCoords = parsed;
        this.usarOrigenCoordsConfirmadas = true;
        return parsed;
      }

      const geocoded = await this.geocodificarDireccion(valor);
      this.origenCoords = geocoded;
      this.usarOrigenCoordsConfirmadas = true;
      return geocoded;
    }

    if (this.origenCoords) {
      return this.origenCoords;
    }

    throw new Error('Ingresa una dirección de origen o utiliza tu ubicación actual.');
  }

  private parseLatLngString(value: string): { lat: number; lng: number } | null {
    const parts = value.split(',').map((part) => Number(part.trim()));
    if (parts.length !== 2) {
      return null;
    }

    const [lat, lng] = parts;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    return { lat, lng };
  }

  private dibujarRuta(coordinates: [number, number][]): void {
    if (!this.mapInstance || !coordinates.length) {
      return;
    }

    const latLngCoords = coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    this.routeLine?.remove();
    this.cursorMarker?.remove();
    this.routeLine = polyline(latLngCoords, {
      color: this.colorRutaActual,
      weight: 6,
      opacity: 0.85,
      lineJoin: 'round',
    }).addTo(this.mapInstance);

    this.mapInstance.fitBounds(this.routeLine.getBounds(), { padding: [36, 36] });
    this.colocarCursorDireccion(latLngCoords);
    this.programarAjusteMapa();
  }

  private colocarCursorDireccion(coords: [number, number][]): void {
    if (!this.mapInstance || coords.length < 2) {
      return;
    }

    this.cursorMarker?.remove();
    const [inicioLat, inicioLng] = coords[0];
    const [sigLat, sigLng] = coords[1];
    const angulo = Math.atan2(sigLat - inicioLat, sigLng - inicioLng) * (180 / Math.PI);

    this.cursorMarker = marker([inicioLat, inicioLng], {
      icon: divIcon({
        className: 'route-cursor-wrapper',
        html: `<div class="route-cursor" style="--cursor-angle: ${angulo}deg"></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
      interactive: false,
    }).addTo(this.mapInstance);
  }

  private marcarOrigen(coords: { lat: number; lng: number }): void {
    if (!this.mapInstance) {
      return;
    }

    this.origenMarker?.remove();
    this.origenMarker = marker([coords.lat, coords.lng], {
      icon: divIcon({
        className: 'origin-dot-wrapper',
        html: `
          <div style="position: relative; width: 42px; height: 42px; pointer-events: none;">
            <span style="position: absolute; inset: 0; border-radius: 999px; background: rgba(14, 165, 233, 0.22); box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.08);"></span>
            <span style="position: absolute; left: 50%; top: 50%; width: 24px; height: 24px; transform: translate(-50%, -50%); border-radius: 999px; background: rgba(255, 255, 255, 0.96); border: 2px solid rgba(14, 165, 233, 0.45); box-shadow: 0 0 0 6px rgba(14, 165, 233, 0.14);"></span>
            <span style="position: absolute; left: 50%; top: 50%; width: 12px; height: 12px; transform: translate(-50%, -50%); border-radius: 999px; background: radial-gradient(circle at 30% 30%, #67e8f9, #0ea5e9 70%, #0369a1 100%); box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.94), 0 6px 16px rgba(14, 165, 233, 0.42);"></span>
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      }),
    }).addTo(this.mapInstance);
  }

  private marcarDestino(coords: { lat: number; lng: number }): void {
    if (!this.mapInstance) {
      return;
    }

    this.destinoMarker?.remove();
    this.destinoMarker = marker([coords.lat, coords.lng], {
      icon: divIcon({
        className: 'destination-dot-wrapper',
        html: '<div class="destination-dot"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    }).addTo(this.mapInstance);
  }

  private extraerInstrucciones(steps: OsrmStep[]): RutaPaso[] {
    if (!steps.length) {
      const lat = this.origenCoords?.lat ?? this.bogotaCoords[0];
      const lng = this.origenCoords?.lng ?? this.bogotaCoords[1];
      return [{ texto: 'Sigue la vía principal hasta tu destino.', lat, lng }];
    }

    return steps.map((step, index) => {
      const accion = this.obtenerTextoPaso(step.maneuver.type, step.maneuver.modifier);
      const via = step.name ? ` hacia ${step.name}` : '';
      const location = step.maneuver.location;
      const lat = location ? location[1] : this.bogotaCoords[0];
      const lng = location ? location[0] : this.bogotaCoords[1];
      const bearing = step.maneuver.bearing_after;
      const angulo = typeof bearing === 'number'
        ? bearing - 90
        : this.obtenerAnguloPorModifier(step.maneuver.modifier);
      return { texto: `${accion}${via}`.trim(), lat, lng, angulo };
    });
  }

  private obtenerTextoPaso(type: string, modifier?: string): string {
    switch (type) {
      case 'depart':
        return 'Inicia el recorrido';
      case 'arrive':
        return 'Has llegado al destino';
      case 'turn':
      case 'continue':
      case 'new name':
      case 'merge':
      case 'exit':
        return this.traducirGiro(modifier);
      case 'roundabout':
        return 'Ingresa a la rotonda';
      default:
        return 'Continúa recto';
    }
  }

  private traducirGiro(modifier?: string): string {
    const map: Record<string, string> = {
      left: 'Gira a la izquierda',
      right: 'Gira a la derecha',
      straight: 'Continúa recto',
      slight_left: 'Gira levemente a la izquierda',
      slight_right: 'Gira levemente a la derecha',
      sharp_left: 'Gira pronunciadamente a la izquierda',
      sharp_right: 'Gira pronunciadamente a la derecha',
      uturn: 'Realiza un giro en U',
    };

    if (!modifier) {
      return 'Continúa recto';
    }

    return map[modifier] ?? 'Continúa recto';
  }

  private normalizeAddress(termino: string): string {
    const compact = termino
      .replace(/\s+#\s*/g, ' # ')
      .replace(/\s+/g, ' ')
      .trim();
    const normalized = compact
      .replace(/\b(cra|cr|kr)\b/gi, 'carrera')
      .replace(/\b(cll|cl|cal)\b/gi, 'calle')
      .replace(/\b(av|avda|aven)\b/gi, 'avenida')
      .replace(/\b(dg|diag)\b/gi, 'diagonal')
      .replace(/\b(tv|transv)\b/gi, 'transversal')
      .replace(/\s+/g, ' ')
      .trim();

    const lower = normalized.toLowerCase();
    const hasComma = normalized.includes(',');
    const hasBogota = lower.includes('bogotá') || lower.includes('bogota');
    const hasColombia = lower.includes('colombia');

    if (!hasComma && !hasBogota && !hasColombia) {
      return `${normalized}, Bogotá, Colombia`;
    }

    if (!hasBogota && hasColombia) {
      return `${normalized}, Bogotá`;
    }

    return normalized;
  }

  private async geocodificarDireccion(termino: string): Promise<{ lat: number; lng: number }> {
    const sugerencias = await this.buscarSugerenciasDireccion(termino, 1);
    const coincidencia = sugerencias[0];

    if (!coincidencia) {
      throw new Error('No encontramos la dirección especificada. Prueba con calle, carrera y número.');
    }

    return { lat: coincidencia.lat, lng: coincidencia.lng };
  }

  private async buscarSugerenciasDireccion(termino: string, limite = 5): Promise<GeocodeSuggestion[]> {
    const url = 'https://nominatim.openstreetmap.org/search';
    const query = this.normalizeAddress(termino.trim());
    try {
      const respuesta = await firstValueFrom(
        this.http.get<Array<{ lat: string; lon: string; display_name?: string }>>(url, {
          params: {
            format: 'json',
            addressdetails: '1',
            limit: String(limite),
            countrycodes: 'co',
            viewbox: this.bogotaViewBox,
            bounded: '1',
            dedupe: '1',
            q: query,
          },
          headers: {
            'Accept-Language': 'es',
          },
        })
      );

      return (respuesta ?? [])
        .map((item) => ({
          displayName: item.display_name?.trim() || query,
          lat: Number(item.lat),
          lng: Number(item.lon),
        }))
        .filter((item) => !Number.isNaN(item.lat) && !Number.isNaN(item.lng));
    } catch (error) {
      console.error('Error geocodificando dirección', error);
      throw new Error('No pudimos convertir la dirección a coordenadas.');
    }
  }

  private async actualizarDireccionDesdeCoordenadas(lat: number, lng: number): Promise<void> {
    const url = 'https://nominatim.openstreetmap.org/reverse';
    try {
      const respuesta = await firstValueFrom(
        this.http.get<{ display_name?: string }>(url, {
          params: {
            format: 'json',
            lat: lat.toString(),
            lon: lng.toString(),
            zoom: '18',
            addressdetails: '1',
          },
          headers: {
            'Accept-Language': 'es',
          },
        })
      );

      this.origenInput = respuesta?.display_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      this.origenSugerencias = [];
    } catch (error) {
      console.error('Error al obtener la dirección desde coordenadas', error);
      this.origenInput = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      this.origenSugerencias = [];
    }
  }

  public onOrigenInputChange(valor: string): void {
    this.usarOrigenCoordsConfirmadas = false;
    this.origenSugerenciaSeleccionada = undefined;
    this.mensajePrecisionUbicacion = '';
    this.programarBusquedaDireccion('origen', valor);
  }

  public onDestinoInputChange(valor: string): void {
    this.destinoCoordsConfirmadas = undefined;
    this.destinoSugerenciaSeleccionada = undefined;
    this.programarBusquedaDireccion('destino', valor);
  }

  public seleccionarSugerenciaOrigen(sugerencia: GeocodeSuggestion): void {
    this.origenSugerenciaSeleccionada = sugerencia;
    this.usarOrigenCoordsConfirmadas = true;
    this.origenInput = sugerencia.displayName;
    this.origenCoords = { lat: sugerencia.lat, lng: sugerencia.lng };
    this.origenSugerencias = [];
    this.rutaError = '';
  }

  public seleccionarSugerenciaDestino(sugerencia: GeocodeSuggestion): void {
    this.destinoSugerenciaSeleccionada = sugerencia;
    this.destinoCoordsConfirmadas = { lat: sugerencia.lat, lng: sugerencia.lng };
    this.destinoInput = sugerencia.displayName;
    this.destinoSugerencias = [];
    this.rutaError = '';
  }

  private programarBusquedaDireccion(tipo: 'origen' | 'destino', valor: string): void {
    const texto = valor.trim();
    const esOrigen = tipo === 'origen';

    if (esOrigen && this.origenBusquedaTimer) {
      clearTimeout(this.origenBusquedaTimer);
    }

    if (!esOrigen && this.destinoBusquedaTimer) {
      clearTimeout(this.destinoBusquedaTimer);
    }

    if (texto.length < 3 || this.parseLatLngString(texto)) {
      if (esOrigen) {
        this.origenSugerencias = [];
        this.buscandoOrigen = false;
      } else {
        this.destinoSugerencias = [];
        this.buscandoDestino = false;
      }
      return;
    }

    const ejecutar = async () => {
      if (esOrigen) {
        this.buscandoOrigen = true;
      } else {
        this.buscandoDestino = true;
      }

      try {
        const sugerencias = await this.buscarSugerenciasDireccion(texto);
        if (esOrigen) {
          this.origenSugerencias = sugerencias;
        } else {
          this.destinoSugerencias = sugerencias;
        }
      } catch {
        if (esOrigen) {
          this.origenSugerencias = [];
        } else {
          this.destinoSugerencias = [];
        }
      } finally {
        if (esOrigen) {
          this.buscandoOrigen = false;
        } else {
          this.buscandoDestino = false;
        }
      }
    };

    const timer = setTimeout(() => {
      void ejecutar();
    }, 220);

    if (esOrigen) {
      this.origenBusquedaTimer = timer;
    } else {
      this.destinoBusquedaTimer = timer;
    }
  }

  private async obtenerMejorUbicacionActual(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      let mejorPosicion: GeolocationPosition | undefined;
      let watcherId: number | undefined;
      let cerrado = false;
      const objetivoPrecisionAlta = 30;
      const precisionAceptableRapida = 55;
      const tiempoEsperaMaximo = 4500;
      const inicio = Date.now();

      const finalizar = (callback: () => void): void => {
        if (cerrado) {
          return;
        }
        cerrado = true;
        if (watcherId != null) {
          navigator.geolocation.clearWatch(watcherId);
        }
        callback();
      };

      const registrarPosicion = (position: GeolocationPosition): void => {
        if (!mejorPosicion || position.coords.accuracy < mejorPosicion.coords.accuracy) {
          mejorPosicion = position;
        }

        const tiempoTranscurrido = Date.now() - inicio;
        if (
          position.coords.accuracy <= objetivoPrecisionAlta ||
          (tiempoTranscurrido >= 1800 && position.coords.accuracy <= precisionAceptableRapida)
        ) {
          clearTimeout(timeoutId);
          finalizar(() => resolve(position));
        }
      };

      const timeoutId = setTimeout(() => {
        if (mejorPosicion) {
          const posicionFinal = mejorPosicion;
          finalizar(() => resolve(posicionFinal));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => finalizar(() => resolve(position)),
          (error) => finalizar(() => reject(error)),
          {
            enableHighAccuracy: true,
            timeout: 3500,
            maximumAge: 0,
          }
        );
      }, tiempoEsperaMaximo);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cerrado) {
            return;
          }

          registrarPosicion(position);
        },
        () => {
          // Ignoramos el fallo rápido y dejamos continuar la lectura precisa.
        },
        {
          enableHighAccuracy: true,
          timeout: 1800,
          maximumAge: 20000,
        }
      );

      watcherId = navigator.geolocation.watchPosition(
        (position) => {
          registrarPosicion(position);
        },
        (error) => {
          clearTimeout(timeoutId);
          finalizar(() => reject(error));
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 0,
        }
      );
    });
  }

  private crearMensajePrecision(accuracy: number): string {
    const precision = Math.round(accuracy);
    if (precision <= 20) {
      return `Ubicación detectada con alta precisión (${precision} m).`;
    }
    if (precision <= 50) {
      return `Ubicación detectada con precisión aceptable (${precision} m).`;
    }
    return `Ubicación aproximada (${precision} m). Si puedes, activa GPS o vuelve a intentarlo.`;
  }

  private getIconoResiduo(tipo: string): Icon {
    const normalized = (tipo || '').toLowerCase();
    const iconMap: Record<string, string> = {
      papel: 'assets/papel.png',
      vidrio: 'assets/vidrio.png',
      plastico: 'assets/plastico.png',
      plástico: 'assets/plastico.png',
      metal: 'assets/metal.png',
    };

    let iconPath = 'assets/default.png';
    if (normalized.includes('papel')) iconPath = iconMap['papel'];
    else if (normalized.includes('vidrio')) iconPath = iconMap['vidrio'];
    else if (normalized.includes('plastico') || normalized.includes('plástico')) iconPath = iconMap['plastico'];
    else if (normalized.includes('metal') || normalized.includes('metálico')) iconPath = iconMap['metal'];

    return new Icon({
      iconUrl: iconPath,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -32],
    });
  }

  private obtenerColorResiduo(tipo: string): string {
    const normalized = (tipo || '').toLowerCase();
    if (normalized.includes('papel')) return '#2563eb';
    if (normalized.includes('plastico') || normalized.includes('plástico')) return '#fff200';
    if (normalized.includes('metal') || normalized.includes('metálico')) return '#dc2626';
    if (normalized.includes('vidrio')) return '#0f9d58';
    return '#0ea5e9';
  }

  private obtenerColoresTarjeta(tipo: string): {
    cardColor: string;
    borderColor: string;
    chipBg: string;
    chipColor: string;
  } {
    const normalized = (tipo || '').toLowerCase();
    if (normalized.includes('papel')) {
      return {
        cardColor: 'rgba(59, 130, 246, 0.12)',
        borderColor: 'rgba(30, 64, 175, 0.55)',
        chipBg: 'rgba(59, 130, 246, 0.25)',
        chipColor: '#1d4ed8',
      };
    }
    if (normalized.includes('plastico') || normalized.includes('plástico')) {
      return {
        cardColor: 'rgba(250, 204, 21, 0.22)',
        borderColor: 'rgba(202, 138, 4, 0.65)',
        chipBg: 'rgba(250, 204, 21, 0.35)',
        chipColor: '#a16207',
      };
    }
    if (normalized.includes('metal') || normalized.includes('metálico')) {
      return {
        cardColor: 'rgba(220, 38, 38, 0.12)',
        borderColor: 'rgba(153, 27, 27, 0.55)',
        chipBg: 'rgba(248, 113, 113, 0.25)',
        chipColor: '#991b1b',
      };
    }
    if (normalized.includes('vidrio')) {
      return {
        cardColor: 'rgba(34, 197, 94, 0.18)',
        borderColor: 'rgba(22, 101, 52, 0.6)',
        chipBg: 'rgba(74, 222, 128, 0.25)',
        chipColor: '#166534',
      };
    }

    return {
      cardColor: 'rgba(15, 118, 110, 0.12)',
      borderColor: 'rgba(15, 118, 110, 0.5)',
      chipBg: 'rgba(20, 184, 166, 0.28)',
      chipColor: '#0f766e',
    };
  }

  public onDestinoChange(): void {
    if (this.destinoSeleccionadoId !== -1) {
      this.destinoInput = '';
      this.destinoCoordsConfirmadas = undefined;
      this.destinoSugerenciaSeleccionada = undefined;
      this.destinoSugerencias = [];
    }
  }

  public get destinoSeleccionadoTexto(): string {
    if (this.destinoSeleccionadoId == null) {
      return 'Selecciona un punto...';
    }

    if (this.destinoSeleccionadoId === -1) {
      return 'Otra dirección...';
    }

    const destino = this.puntos.find((p) => p.id === this.destinoSeleccionadoId);
    return destino?.nombre ?? 'Selecciona un punto...';
  }

  public toggleDestinoDropdown(): void {
    this.destinoDropdownAbierto = !this.destinoDropdownAbierto;
  }

  public toggleMaterial(material: string): void {
    if (this.materialesSeleccionados.has(material)) {
      this.materialesSeleccionados.delete(material);
    } else {
      this.materialesSeleccionados.add(material);
    }

    this.materialesSeleccionados = new Set(this.materialesSeleccionados);
    this.aplicarFiltrosPuntos();
  }

  public limpiarFiltrosMateriales(): void {
    if (!this.materialesSeleccionados.size) {
      return;
    }

    this.materialesSeleccionados = new Set<string>();
    this.aplicarFiltrosPuntos();
  }

  public materialSeleccionado(material: string): boolean {
    return this.materialesSeleccionados.has(material);
  }

  public seleccionarDestino(valor: number | null): void {
    this.destinoSeleccionadoId = valor;
    this.destinoDropdownAbierto = false;
    this.onDestinoChange();

    if (valor === -1) {
      this.destinoCoordsConfirmadas = undefined;
      setTimeout(() => {
        this.destinoInputRef?.nativeElement.focus();
        if (this.destinoInput.trim().length >= 3) {
          this.programarBusquedaDireccion('destino', this.destinoInput);
        }
      });
    }
  }

  public irAPaso(paso: RutaPaso): void {
    if (!this.mapInstance) {
      return;
    }

    this.mapInstance.setView([paso.lat, paso.lng], 17, { animate: true } as any);
    this.cursorMarker?.remove();
    this.cursorMarker = marker([paso.lat, paso.lng], {
      icon: divIcon({
        className: 'route-cursor-wrapper',
        html: `<div class="route-cursor route-cursor--active" style="--cursor-angle: ${(paso.angulo ?? 0)}deg"></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
      interactive: false,
    }).addTo(this.mapInstance);
  }

  private async snapToRoad(lat: number, lng: number): Promise<{ lat: number; lng: number }> {
    try {
      const respuesta = await firstValueFrom(this.osrmService.nearest(lat, lng, 1));
      const wp = respuesta?.waypoints?.[0];
      if (wp && Array.isArray(wp.location) && wp.location.length === 2) {
        // OSRM returns [lon, lat]
        return { lat: wp.location[1], lng: wp.location[0] };
      }
    } catch (err) {
      console.warn('snapToRoad failed', err);
    }
    return { lat, lng };
  }

  private obtenerAnguloPorModifier(modifier?: string): number {
    switch (modifier) {
      case 'right':
        return 90;
      case 'left':
        return -90;
      case 'straight':
        return 0;
      case 'uturn':
        return 180;
      case 'slight_right':
        return 45;
      case 'slight_left':
        return -45;
      case 'sharp_right':
        return 135;
      case 'sharp_left':
        return -135;
      default:
        return 0;
    }
  }

  /**
   * Calcula la distancia en km entre dos puntos usando la fórmula de Haversine
   */
  private calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Obtiene la ubicación actual del localStorage y muestra los puntos cercanos
   */
  public filtrarPuntosCercanos(): void {
    const ubicacionGuardada = localStorage.getItem('ubicacionActual');
    
    if (!ubicacionGuardada) {
      this.rutaError = 'Por favor, activa tu ubicación actual primero.';
      return;
    }

    try {
      const ubicacion = JSON.parse(ubicacionGuardada);
      const { lat, lng } = ubicacion;

      if (!lat || !lng) {
        this.rutaError = 'Ubicación inválida. Intenta nuevamente.';
        return;
      }

      // Calcular distancia para cada punto
      const puntosConDistancia = this.puntos.map(punto => ({
        ...punto,
        distancia: this.calcularDistancia(lat, lng, Number(punto.latitud || 0), Number(punto.longitud || 0))
      }));

      // Ordenar por distancia (menor primero) y tomar los 10 más cercanos
      const puntosCercanos = puntosConDistancia
        .sort((a, b) => (a.distancia || 0) - (b.distancia || 0))
        .slice(0, 10);

      this.puntosFiltroCercano = puntosCercanos;
      this.mostrarPuntosCercanos = true;
      this.rutaError = '';
      this.aplicarFiltrosPuntos();
      this.programarAjusteMapa();
    } catch (error) {
      console.error('Error procesando ubicación:', error);
      this.rutaError = 'Error al procesar tu ubicación.';
    }
  }

  /**
   * Limpia el filtro de puntos cercanos y vuelve a mostrar todos
   */
  public limpiarPuntosCercanos(): void {
    this.mostrarPuntosCercanos = false;
    this.puntosFiltroCercano = [];
    this.rutaError = '';
    this.aplicarFiltrosPuntos();
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SolicitudesPorLocalidad, SolicitudRecoleccionService } from '../../../Services/solicitud.service';

@Component({
  selector: 'app-solicitudes-localidad-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './solicitudes-localidad-chart-component.html',
  styleUrls: ['./solicitudes-localidad-chart-component.css']
})
export class SolicitudesLocalidadChartComponent implements OnInit {
  public chartOptions: any = {
    series: [],
    chart: { type: 'bar', height: 300 },
    xaxis: { categories: [] },
    colors: [],
    dataLabels: { enabled: true }
  };
  public errorMessage: string | null = null;

  constructor(private solicitudService: SolicitudRecoleccionService) {}

  ngOnInit() {
    // Placeholder inmediato
    try {
      this.initChart([{ localidad: 'Sin datos para mostrar', cantidad: 0 }]);
    } catch (e) {
      console.warn('[SolicitudesLocalidad] No se pudo inicializar chart placeholder', e);
    }

    // Admin: consumir endpoint agregado (no agrupar en frontend)
    this.solicitudService.getAdminSolicitudesPorLocalidad().subscribe({
      next: (data: SolicitudesPorLocalidad[]) => {
        this.errorMessage = null;
        const total = (data || []).reduce((sum, d) => sum + Number(d?.cantidad ?? 0), 0);
        console.log('[SolicitudesLocalidad][admin] items:', data?.length ?? 0, 'total:', total, 'data:', data);

        // Si el backend devuelve un total demasiado bajo, validar con conteo en frontend.
        // Esto ayuda a detectar rápidamente filtros/paginación/joins en Spring Boot.
        if (total > 0 && total < 10) {
          console.warn('[SolicitudesLocalidad] total admin sospechoso, recalculando desde listar() para validar. totalAdmin=', total);
          this.recalcularDesdeListar();
          return;
        }

        if (data && data.length > 0) {
          this.initChart(data);
        } else {
          this.errorMessage = 'No hay solicitudes para mostrar.';
        }
      },
      error: (err: any) => {
        console.error('Error cargando solicitudes por localidad (admin):', err);
        this.errorMessage = 'Error cargando datos: ' + (err?.message || err);

        // Fallback de validación si falla el endpoint
        this.recalcularDesdeListar();
      }
    });
  }

  private recalcularDesdeListar(): void {
    this.solicitudService.listar().subscribe({
      next: (solicitudes: any[]) => {
        const porLocalidad: Record<string, number> = {};
        (solicitudes || []).forEach((s: any) => {
          const loc = String(s?.localidad ?? 'Sin localidad');
          porLocalidad[loc] = (porLocalidad[loc] || 0) + 1;
        });
        const data: SolicitudesPorLocalidad[] = Object.keys(porLocalidad).map(localidad => ({
          localidad,
          cantidad: porLocalidad[localidad]
        }));
        const total = data.reduce((sum, d) => sum + Number(d?.cantidad ?? 0), 0);
        console.log('[SolicitudesLocalidad][listar fallback] items:', data.length, 'total:', total, 'data:', data);
        if (data.length > 0) {
          this.errorMessage = null;
          this.initChart(data);
        } else {
          this.errorMessage = 'No hay solicitudes para mostrar.';
        }
      },
      error: (err: any) => {
        console.error('[SolicitudesLocalidad][listar fallback] error:', err);
      }
    });
  }


  private initChart(data: SolicitudesPorLocalidad[]): void {
    // Ordenar por cantidad descendente para mejor visualización
    const sorted = data.slice().sort((a, b) => Number(b.cantidad) - Number(a.cantidad));
    const counts = sorted.map(d => Math.round(Number(d.cantidad)));
    const labels = sorted.map(d => String(d.localidad));
    const maxCount = counts.length ? Math.max(...counts) : 1;
    // asegurar tickAmount razonable y entero
    const tickAmount = Math.min(6, Math.max(1, Math.ceil(maxCount)));

    // Generar paleta de verdes/azules (variaciones) con la función central
    const colors = this.generateColors(labels.length);

    // Altura dinámica (máx 720px para evitar overflow)
    const height = Math.min(720, Math.max(200, 44 * labels.length + 60));

    this.chartOptions = {
      series: [{ name: 'Solicitudes', data: counts }],
      chart: { type: 'bar', height, toolbar: { show: false }, animations: { enabled: true } },
      plotOptions: {
        bar: {
          borderRadius: 8,
          horizontal: true,
          distributed: false,
          dataLabels: { position: 'right' }
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: labels,
        labels: { style: { colors: '#0b3d1a' }, formatter: function(val: number) { return String(Math.round(val)); } },
        min: 0,
        tickAmount: tickAmount
      },
      yaxis: {
        labels: { style: { colors: '#0b3d1a', fontSize: '14px' } }
      },
      grid: { show: true, borderColor: '#f0f4f0' },
      colors,
      title: { text: 'Solicitudes por Localidad', align: 'center', style: { color: '#0b3d1a', fontSize: '20px', fontWeight: '700' } },
      tooltip: {
        y: { formatter: function(val: number) { return `${Math.round(val)} solicitudes`; } }
      },
      legend: { show: false }
    };
  }

  private generateColors(count: number): string[] {
    // Paleta restringida a tonos de verde y azul
    const colorPalette = [
      '#165b33', '#2e7d32', '#388e3c', '#4caf50', '#6fbf73',
      '#155fa0', '#1976d2', '#1e88e5', '#4dabf7', '#82c0ff',
      '#117a65', '#16a085', '#48c9b0', '#5dade2', '#2b788b'
    ];

    if (count <= colorPalette.length) {
      return colorPalette.slice(0, count);
    }

    // Generar variaciones adicionales dentro de la gama verde-azul
    const additionalColors: string[] = [];
    for (let i = colorPalette.length; i < count; i++) {
      const hue = 150 + (i * 23) % 90; // rango 150-239 (verde-azul)
      const saturation = 55 + (i % 20); // 55-74
      const lightness = 40 + (i % 25); // 40-64
      additionalColors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }

    return [...colorPalette, ...additionalColors].slice(0, count);
  }
}// correcciones para graficas
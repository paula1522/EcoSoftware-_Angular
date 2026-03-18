import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Service, SolicitudesPorLocalidad } from '../../../Services/solicitud.service';

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

  constructor(private service: Service) {}

  ngOnInit() {
    // Obtener TODAS las solicitudes y agrupar por localidad en el frontend
      // Mostrar una gráfica placeholder inmediatamente para acelerar render
      try {
        this.initChart([{ localidad: 'Sin datos para mostrar', cantidad: 0 }]);
      } catch (e) {
        console.warn('[SolicitudesLocalidad] No se pudo inicializar chart placeholder', e);
      }

    // Así los datos siempre están sincronizados con la BD
    this.service.listar().subscribe({
      next: (todasLasSolicitudes: any[]) => {
        console.log('[SolicitudesLocalidad] Todas las solicitudes:', todasLasSolicitudes);
        
        // Agrupar por localidad
        const porLocalidad: { [key: string]: number } = {};
        
        todasLasSolicitudes.forEach((sol: any) => {
          const loc = sol.localidad || 'Sin localidad';
          porLocalidad[loc] = (porLocalidad[loc] || 0) + 1;
        });

        // Convertir a array
        const data = Object.keys(porLocalidad).map(localidad => ({
          localidad,
          cantidad: porLocalidad[localidad]
        }));

        console.log('[SolicitudesLocalidad] Datos agrupados por localidad:', data);
        this.errorMessage = null;
        
        if (data && data.length > 0) {
          this.initChart(data);
        } else {
          this.errorMessage = 'No hay solicitudes para mostrar.';
        }
      },
      error: (err) => {
        console.error('Error cargando solicitudes:', err);
        this.errorMessage = 'Error cargando datos: ' + (err?.message || err);
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
}
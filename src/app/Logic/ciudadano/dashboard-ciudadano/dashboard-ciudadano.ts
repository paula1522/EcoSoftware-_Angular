import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  CiudadanoDashboardEstado,
  CiudadanoDashboardImpacto,
  CiudadanoDashboardResiduo,
  CiudadanoDashboardService,
  CiudadanoDashboardTiempo,
} from '../../../Services/ciudadano-dashboard.service';

interface ImpactoCardViewModel {
  label: string;
  value: string;
  note: string;
  icon: string;
  tone: 'emerald' | 'blue' | 'forest' | 'teal';
}

@Component({
  selector: 'app-dashboard-ciudadano',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './dashboard-ciudadano.html',
  styleUrls: ['./dashboard-ciudadano.css']
})
export class DashboardCiudadanoComponent implements OnInit {
  loadingEstado = true;
  loadingTiempo = true;
  loadingResiduos = true;
  loadingImpacto = true;

  errorEstado: string | null = null;
  errorTiempo: string | null = null;
  errorResiduos: string | null = null;
  errorImpacto: string | null = null;

  totalSolicitudes = 0;
  estadoDominante = 'Sin datos';
  residuosTotales = 0;

  impactoCards: ImpactoCardViewModel[] = [];
  estadoChartOptions: any = null;
  tiempoChartOptions: any = null;
  residuosChartOptions: any = null;

  constructor(private readonly ciudadanoDashboardService: CiudadanoDashboardService) {}

  ngOnInit(): void {
    this.initCharts();
    this.cargarSolicitudesPorEstado();
    this.cargarSolicitudesEnTiempo();
    this.cargarResiduosPorTipo();
    this.cargarImpactoAmbiental();
  }

  private initCharts(): void {
    this.estadoChartOptions = {
      series: [0],
      chart: { type: 'donut', height: 300, toolbar: { show: false } },
      labels: ['Sin datos'],
      colors: ['#A5D6A7'],
      legend: {
        position: 'bottom',
        fontSize: '13px',
        fontWeight: 600,
        labels: { colors: '#365241' },
        itemMargin: { horizontal: 10, vertical: 6 }
      },
      stroke: { width: 0 },
      dataLabels: {
        enabled: true,
        style: { fontSize: '12px', fontWeight: '700' },
        dropShadow: { enabled: false }
      },
      tooltip: {
        theme: 'light',
        y: { formatter: (value: number) => `${this.formatMetric(value)} solicitudes` }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '58%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                color: '#365241',
                formatter: (w: any) => this.formatMetric(w.globals.seriesTotals.reduce((acc: number, current: number) => acc + current, 0))
              },
              value: {
                color: '#123b1d',
                fontWeight: 700,
                formatter: (value: string) => this.formatMetric(Number(value))
              }
            }
          }
        }
      }
    };

    this.tiempoChartOptions = {
      series: [{ name: 'Solicitudes', data: [0] }],
      chart: { type: 'line', height: 320, toolbar: { show: false } },
      stroke: { curve: 'smooth', width: 3 },
      markers: {
        size: 5,
        strokeWidth: 0,
        hover: { size: 7 }
      },
      xaxis: {
        categories: ['Sin datos'],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#547162', fontSize: '12px', fontWeight: 600 } }
      },
      yaxis: {
        min: 0,
        title: { text: 'Cantidad', style: { color: '#547162', fontWeight: 600 } },
        labels: { style: { colors: '#547162' } }
      },
      colors: ['#1565C0'],
      dataLabels: { enabled: false },
      tooltip: {
        theme: 'light',
        y: { formatter: (value: number) => `${this.formatMetric(value)} solicitudes` }
      },
      grid: { borderColor: '#E8F0E8', strokeDashArray: 4 }
    };

    this.residuosChartOptions = {
      series: [{ name: 'Cantidad', data: [0] }],
      chart: { type: 'bar', height: 320, toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          barHeight: '56%',
          distributed: true
        }
      },
      xaxis: {
        categories: ['Sin datos'],
        title: { text: 'Cantidad', style: { color: '#547162', fontWeight: 600 } },
        labels: { style: { colors: '#547162' } }
      },
      yaxis: { labels: { style: { colors: '#365241', fontWeight: 600 } } },
      colors: ['#0ea5e9'],
      dataLabels: { enabled: false },
      tooltip: {
        theme: 'light',
        y: { formatter: (value: number) => this.formatMetric(value) }
      },
      grid: { borderColor: '#E8F0E8', strokeDashArray: 4 }
    };
  }

  private cargarSolicitudesPorEstado(): void {
    this.ciudadanoDashboardService.obtenerSolicitudesPorEstado().subscribe({
      next: (response) => {
        const data = (response ?? []).filter(item => this.toNumber(item?.cantidad) > 0 || this.getEstadoLabel(item));
        const labels = data.map(item => this.getEstadoLabel(item));
        const values = data.map(item => this.toNumber(item?.cantidad));

        this.estadoChartOptions = {
          ...this.estadoChartOptions,
          labels: labels.length ? labels : ['Sin datos'],
          series: values.length ? values : [0],
          colors: ['#1B5E20', '#2E7D32', '#F9A825', '#1565C0', '#8E24AA']
        };
        this.totalSolicitudes = values.reduce((acc, current) => acc + current, 0);
        this.estadoDominante = labels.length
          ? labels[values.indexOf(Math.max(...values))] ?? 'Sin datos'
          : 'Sin datos';
        this.errorEstado = data.length ? null : 'No hay datos de solicitudes para mostrar.';
        this.loadingEstado = false;
      },
      error: () => {
        this.errorEstado = 'No se pudieron cargar las solicitudes por estado.';
        this.loadingEstado = false;
      }
    });
  }

  private cargarSolicitudesEnTiempo(): void {
    this.ciudadanoDashboardService.obtenerSolicitudesEnTiempo().subscribe({
      next: (response) => {
        const data = (response ?? []).filter(item => item != null);
        const categories = data.map(item => this.normalizeMes(item?.mes));
        const values = data.map(item => this.toNumber(item?.cantidad));

        this.tiempoChartOptions = {
          ...this.tiempoChartOptions,
          xaxis: { ...this.tiempoChartOptions.xaxis, categories: categories.length ? categories : ['Sin datos'] },
          series: [{ name: 'Solicitudes', data: values.length ? values : [0] }]
        };
        this.errorTiempo = data.length ? null : 'No hay historial temporal para mostrar.';
        this.loadingTiempo = false;
      },
      error: () => {
        this.errorTiempo = 'No se pudo cargar la evolución de solicitudes.';
        this.loadingTiempo = false;
      }
    });
  }

  private cargarResiduosPorTipo(): void {
    this.ciudadanoDashboardService.obtenerResiduosPorTipo().subscribe({
      next: (response) => {
        const data = (response ?? []).filter(item => item != null);
        const normalized = data
          .map(item => ({
            label: this.getResiduoLabel(item),
            value: this.toNumber(item?.cantidad),
          }))
          .filter(item => item.label || item.value > 0);

        const categories = normalized.map(item => item.label);
        const values = normalized.map(item => item.value);

        this.residuosChartOptions = {
          ...this.residuosChartOptions,
          xaxis: { ...this.residuosChartOptions.xaxis, categories: categories.length ? categories : ['Sin datos'] },
          series: [{ name: 'Cantidad', data: values.length ? values : [0] }],
          colors: categories.length ? categories.map(category => this.getResiduoColor(category)) : ['#0ea5e9']
        };
        this.residuosTotales = values.reduce((acc, current) => acc + current, 0);
        this.errorResiduos = normalized.length ? null : 'No hay residuos registrados para mostrar.';
        this.loadingResiduos = false;
      },
      error: () => {
        this.errorResiduos = 'No se pudieron cargar los residuos por tipo.';
        this.loadingResiduos = false;
      }
    });
  }

  private cargarImpactoAmbiental(): void {
    this.ciudadanoDashboardService.obtenerImpactoAmbiental().subscribe({
      next: (response) => {
        const normalized = (response ?? [])
          .map((item, index) => this.mapImpactoCard(item, index))
          .filter((item): item is ImpactoCardViewModel => item !== null);

        this.impactoCards = normalized;
        this.errorImpacto = normalized.length ? null : 'No hay métricas de impacto para mostrar.';
        this.loadingImpacto = false;
      },
      error: () => {
        this.errorImpacto = 'No se pudo cargar el impacto ambiental.';
        this.loadingImpacto = false;
      }
    });
  }

  private getEstadoLabel(item: CiudadanoDashboardEstado): string {
    const raw = item?.estado ?? item?.nombre ?? 'Sin estado';
    return String(raw).trim() || 'Sin estado';
  }

  private getResiduoLabel(item: CiudadanoDashboardResiduo): string {
    const raw = item?.tipoResiduo ?? item?.tipo ?? item?.material ?? 'Sin tipo';
    return String(raw).trim() || 'Sin tipo';
  }

  private getResiduoColor(tipo: string): string {
    const normalized = (tipo || '').toLowerCase();
    if (normalized.includes('papel')) return '#2563eb';
    if (normalized.includes('plastico') || normalized.includes('plástico')) return '#22c55e';
    if (normalized.includes('metal')) return '#dc2626';
    if (normalized.includes('vidrio')) return '#0f9d58';
    if (normalized.includes('organico') || normalized.includes('orgánico')) return '#f59e0b';
    return '#0ea5e9';
  }

  private mapImpactoCard(item: CiudadanoDashboardImpacto, index: number): ImpactoCardViewModel | null {
    const label = String(item?.metrica ?? '').trim();
    const rawValue = item?.valor;
    const unidad = String(item?.unidad ?? '').trim();

    if (!label && (rawValue === null || rawValue === undefined || String(rawValue).trim() === '')) {
      return null;
    }

    const tones: ImpactoCardViewModel['tone'][] = ['emerald', 'blue', 'forest', 'teal'];
    const icons = ['bi bi-recycle', 'bi bi-cloud-check', 'bi bi-tree', 'bi bi-droplet-half'];
    const tone = tones[index % tones.length];
    const icon = icons[index % icons.length];

    return {
      label: label || 'Impacto',
      value: this.formatMetric(this.toNumber(rawValue)),
      note: unidad || 'avance acumulado',
      icon,
      tone,
    };
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').trim();
      const parsedString = Number(normalized);
      return Number.isFinite(parsedString) ? parsedString : 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private normalizeMes(value: string | number | undefined): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    if (typeof value === 'number') {
      return meses[value - 1] ?? String(value);
    }

    const text = String(value ?? '').trim();
    const numeric = Number(text);
    if (Number.isFinite(numeric) && text !== '') {
      return meses[numeric - 1] ?? text;
    }

    return text || 'Sin mes';
  }

  formatMetric(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: value % 1 === 0 ? 0 : 1,
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    }).format(value);
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  RecicladorDashboardCumplimiento,
  RecicladorDashboardEstado,
  RecicladorDashboardMaterial,
  RecicladorDashboardPeriodo,
  RecicladorDashboardService,
} from '../../../Services/reciclador-dashboard.service';

@Component({
  selector: 'app-dashboard-reciclador',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './dashboard-reciclador.html',
  styleUrls: ['./dashboard-reciclador.css']
})
export class DashboardRecicladorComponent implements OnInit {
  loadingPeriodo = true;
  loadingEstado = true;
  loadingCumplimiento = true;
  loadingMaterial = true;

  errorPeriodo: string | null = null;
  errorEstado: string | null = null;
  errorCumplimiento: string | null = null;
  errorMaterial: string | null = null;

  totalRecolecciones = 0;
  estadoDominante = 'Sin datos';
  materialTotal = 0;
  cumplimientoLabel = 'Sin datos';

  cumplimientoPorcentaje = 0;
  cumplimientoCompletadas = 0;
  cumplimientoTotal = 0;

  periodoChartOptions: any = null;
  estadoChartOptions: any = null;
  materialChartOptions: any = null;

  constructor(private readonly recicladorDashboardService: RecicladorDashboardService) {}

  ngOnInit(): void {
    this.initCharts();
    this.cargarRecoleccionesPorPeriodo();
    this.cargarRecoleccionesPorEstado();
    this.cargarCumplimiento();
    this.cargarMaterialRecolectado();
  }

  private initCharts(): void {
    this.periodoChartOptions = {
      series: [{ name: 'Recolecciones', data: [0] }],
      chart: { type: 'bar', height: 320, toolbar: { show: false } },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '48%',
          distributed: false
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.15,
          opacityFrom: 0.95,
          opacityTo: 0.72,
          stops: [0, 100]
        }
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
        y: { formatter: (value: number) => `${this.formatMetric(value)} recolecciones` }
      },
      grid: { borderColor: '#E8F0E8', strokeDashArray: 4 }
    };

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
        y: { formatter: (value: number) => `${this.formatMetric(value)} recolecciones` }
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

    this.materialChartOptions = {
      series: [{ name: 'Cantidad', data: [0] }],
      chart: { type: 'bar', height: 320, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 8, barHeight: '56%', distributed: true } },
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

  private cargarRecoleccionesPorPeriodo(): void {
    this.recicladorDashboardService.obtenerRecoleccionesPorPeriodo().subscribe({
      next: (response) => {
        const data = (response ?? []).filter(item => item != null);
        const categories = data.map(item => this.getPeriodoLabel(item));
        const values = data.map(item => this.toNumber(item?.cantidad));

        this.periodoChartOptions = {
          ...this.periodoChartOptions,
          xaxis: { ...this.periodoChartOptions.xaxis, categories: categories.length ? categories : ['Sin datos'] },
          series: [{ name: 'Recolecciones', data: values.length ? values : [0] }]
        };
        this.totalRecolecciones = values.reduce((acc, current) => acc + current, 0);
        this.errorPeriodo = data.length ? null : 'No hay recolecciones por periodo para mostrar.';
        this.loadingPeriodo = false;
      },
      error: () => {
        this.errorPeriodo = 'No se pudieron cargar las recolecciones por periodo.';
        this.loadingPeriodo = false;
      }
    });
  }

  private cargarRecoleccionesPorEstado(): void {
    this.recicladorDashboardService.obtenerRecoleccionesPorEstado().subscribe({
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
        this.estadoDominante = labels.length
          ? labels[values.indexOf(Math.max(...values))] ?? 'Sin datos'
          : 'Sin datos';
        this.errorEstado = data.length ? null : 'No hay estados de recoleccion para mostrar.';
        this.loadingEstado = false;
      },
      error: () => {
        this.errorEstado = 'No se pudieron cargar las recolecciones por estado.';
        this.loadingEstado = false;
      }
    });
  }

  private cargarCumplimiento(): void {
    this.recicladorDashboardService.obtenerCumplimiento().subscribe({
      next: (response) => {
        const item = (response ?? []).find(entry => entry != null) ?? null;
        if (!item) {
          this.errorCumplimiento = 'No hay datos de cumplimiento para mostrar.';
          this.loadingCumplimiento = false;
          return;
        }

        this.cumplimientoLabel = String(item.metrica ?? 'Cumplimiento').trim() || 'Cumplimiento';
        this.cumplimientoPorcentaje = Math.max(0, Math.min(100, this.toNumber(item.porcentaje)));
        this.cumplimientoCompletadas = this.toNumber(item.completadas);
        this.cumplimientoTotal = this.toNumber(item.total);
        this.errorCumplimiento = null;
        this.loadingCumplimiento = false;
      },
      error: () => {
        this.errorCumplimiento = 'No se pudo cargar el cumplimiento de rutas.';
        this.loadingCumplimiento = false;
      }
    });
  }

  private cargarMaterialRecolectado(): void {
    this.recicladorDashboardService.obtenerMaterialRecolectado().subscribe({
      next: (response) => {
        const data = (response ?? []).filter(item => item != null);
        const normalized = data
          .map(item => ({
            label: this.getMaterialLabel(item),
            value: this.toNumber(item?.cantidad),
          }))
          .filter(item => item.label || item.value > 0);

        const categories = normalized.map(item => item.label);
        const values = normalized.map(item => item.value);

        this.materialChartOptions = {
          ...this.materialChartOptions,
          xaxis: { ...this.materialChartOptions.xaxis, categories: categories.length ? categories : ['Sin datos'] },
          series: [{ name: 'Cantidad', data: values.length ? values : [0] }],
          colors: categories.length ? categories.map(category => this.getMaterialColor(category)) : ['#0ea5e9']
        };
        this.materialTotal = values.reduce((acc, current) => acc + current, 0);
        this.errorMaterial = normalized.length ? null : 'No hay material recolectado para mostrar.';
        this.loadingMaterial = false;
      },
      error: () => {
        this.errorMaterial = 'No se pudo cargar el material recolectado.';
        this.loadingMaterial = false;
      }
    });
  }

  private getPeriodoLabel(item: RecicladorDashboardPeriodo): string {
    const raw = item?.periodo ?? item?.mes ?? 'Sin periodo';
    return String(raw).trim() || 'Sin periodo';
  }

  private getEstadoLabel(item: RecicladorDashboardEstado): string {
    const raw = item?.estado ?? item?.nombre ?? 'Sin estado';
    return String(raw).trim() || 'Sin estado';
  }

  private getMaterialLabel(item: RecicladorDashboardMaterial): string {
    const raw = item?.tipo ?? item?.tipoResiduo ?? item?.material ?? 'Sin tipo';
    return String(raw).trim() || 'Sin tipo';
  }

  private getMaterialColor(tipo: string): string {
    const normalized = (tipo || '').toLowerCase();
    if (normalized.includes('papel')) return '#2563eb';
    if (normalized.includes('plastico') || normalized.includes('plástico')) return '#22c55e';
    if (normalized.includes('metal')) return '#dc2626';
    if (normalized.includes('vidrio')) return '#0f9d58';
    if (normalized.includes('organico') || normalized.includes('orgánico')) return '#f59e0b';
    return '#0ea5e9';
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

  formatMetric(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: value % 1 === 0 ? 0 : 1,
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    }).format(value);
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  EmpresaDashboardEstado,
  EmpresaDashboardMaterial,
  EmpresaDashboardMes,
  EmpresaDashboardService,
  EmpresaDashboardTiempoPromedio,
} from '../../../Services/empresa-dashboard.service';

@Component({
  selector: 'app-dashboard-empresa',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './dashboard-empresa.html',
  styleUrls: ['./dashboard-empresa.css']
})
export class DashboardEmpresaComponent implements OnInit {
  loadingEstado = true;
  loadingMensual = true;
  loadingMaterial = true;
  loadingTiempo = true;

  totalSolicitudes = 0;
  estadoDominante = 'Sin datos';
  materialTotal = 0;
  mejorMes = 'Sin datos';

  errorEstado: string | null = null;
  errorMensual: string | null = null;
  errorMaterial: string | null = null;
  errorTiempo: string | null = null;

  estadoChartOptions: any = null;
  mensualChartOptions: any = null;
  materialChartOptions: any = null;
  tiempoChartOptions: any = null;

  constructor(private readonly empresaDashboardService: EmpresaDashboardService) {}

  ngOnInit(): void {
    this.initCharts();
    this.cargarSolicitudesPorEstado();
    this.cargarSolicitudesMensuales();
    this.cargarMaterialesPorTipo();
    this.cargarTiempoPromedio();
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
      title: { text: '', align: 'left' },
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

    this.mensualChartOptions = {
      series: [{ name: 'Solicitudes', data: [0] }],
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
      title: { text: '', align: 'left' },
      tooltip: {
        theme: 'light',
        y: { formatter: (value: number) => `${this.formatMetric(value)} solicitudes` }
      },
      grid: { borderColor: '#E8F0E8', strokeDashArray: 4 }
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
      colors: ['#1B5E20', '#2E7D32', '#4CAF50', '#5C6BC0', '#00897B', '#039BE5'],
      dataLabels: { enabled: false },
      title: { text: '', align: 'left' },
      tooltip: {
        theme: 'light',
        y: { formatter: (value: number) => this.formatMetric(value) }
      },
      grid: { borderColor: '#E8F0E8', strokeDashArray: 4 }
    };

    this.tiempoChartOptions = {
      series: [{ name: 'Material', data: [0] }],
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
        title: { text: 'Cantidad gestionada', style: { color: '#547162', fontWeight: 600 } },
        labels: { style: { colors: '#547162' } }
      },
      colors: ['#00897B'],
      dataLabels: { enabled: false },
      title: { text: '', align: 'left' },
      tooltip: {
        theme: 'light',
        y: { formatter: (value: number) => this.formatMetric(value) }
      },
      grid: { borderColor: '#E8F0E8', strokeDashArray: 4 }
    };
  }

  private cargarSolicitudesPorEstado(): void {
    this.empresaDashboardService.obtenerSolicitudesPorEstado().subscribe({
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
        this.errorEstado = data.length ? null : 'No hay datos para mostrar.';
        this.loadingEstado = false;
      },
      error: (error) => {
        console.error('Error cargando solicitudes por estado:', error);
        this.errorEstado = 'No se pudieron cargar las solicitudes por estado.';
        this.loadingEstado = false;
      }
    });
  }

  private cargarSolicitudesMensuales(): void {
    this.empresaDashboardService.obtenerSolicitudesMensuales().subscribe({
      next: (response) => {
        const data = (response ?? []).filter(item => item != null);
        const categories = data.map(item => this.normalizeMes(item?.mes));
        const values = data.map(item => this.toNumber(item?.cantidad));

        this.mensualChartOptions = {
          ...this.mensualChartOptions,
          xaxis: { ...this.mensualChartOptions.xaxis, categories: categories.length ? categories : ['Sin datos'] },
          series: [{ name: 'Solicitudes', data: values.length ? values : [0] }]
        };
        if (categories.length && values.length) {
          const highestValue = Math.max(...values);
          this.mejorMes = categories[values.indexOf(highestValue)] ?? 'Sin datos';
        }
        this.errorMensual = data.length ? null : 'No hay datos mensuales para mostrar.';
        this.loadingMensual = false;
      },
      error: (error) => {
        console.error('Error cargando solicitudes mensuales:', error);
        this.errorMensual = 'No se pudo cargar la tendencia mensual.';
        this.loadingMensual = false;
      }
    });
  }

  private cargarMaterialesPorTipo(): void {
    this.empresaDashboardService.obtenerMaterialesPorTipo().subscribe({
      next: (response) => {
        const data = (response ?? []).filter(item => item != null);
        const normalized = data
          .map(item => ({
            categoria: this.getMaterialLabel(item),
            valor: this.getMaterialCantidad(item),
          }))
          .filter(item => item.categoria || item.valor > 0);
        const categories = normalized.map(item => item.categoria);
        const values = normalized.map(item => item.valor);

        this.materialChartOptions = {
          ...this.materialChartOptions,
          xaxis: { ...this.materialChartOptions.xaxis, categories: categories.length ? categories : ['Sin datos'] },
          series: [{ name: 'Cantidad', data: values.length ? values : [0] }]
        };
        this.materialTotal = values.reduce((acc, current) => acc + current, 0);
        this.errorMaterial = normalized.length ? null : 'No hay materiales para mostrar.';
        this.loadingMaterial = false;
      },
      error: (error) => {
        console.error('Error cargando materiales por tipo:', error);
        this.errorMaterial = 'No se pudieron cargar los materiales por tipo.';
        this.loadingMaterial = false;
      }
    });
  }

  private cargarTiempoPromedio(): void {
    this.empresaDashboardService.obtenerMaterialGestionadoPorMes().subscribe({
      next: (response) => {
        const data = (response ?? []).filter(item => item != null);
        const normalized = data
          .map(item => ({
            mes: this.getTiempoMes(item),
            valor: this.getTiempoPromedio(item),
          }))
          .filter(item => item.mes || item.valor > 0);
        const categories = normalized.map(item => item.mes);
        const values = normalized.map(item => item.valor);

        this.tiempoChartOptions = {
          ...this.tiempoChartOptions,
          xaxis: { ...this.tiempoChartOptions.xaxis, categories: categories.length ? categories : ['Sin datos'] },
          series: [{ name: 'Material', data: values.length ? values : [0] }]
        };
        this.errorTiempo = normalized.length ? null : 'No hay material gestionado para mostrar.';
        this.loadingTiempo = false;
      },
      error: (error) => {
        console.error('Error cargando material gestionado por mes:', error);
        this.errorTiempo = 'No se pudo cargar el material gestionado por mes.';
        this.loadingTiempo = false;
      }
    });
  }

  private getEstadoLabel(item: EmpresaDashboardEstado): string {
    const raw = item?.estado ?? item?.nombre ?? 'Sin estado';
    return String(raw).trim() || 'Sin estado';
  }

  private getMaterialLabel(item: EmpresaDashboardMaterial): string {
    const raw =
      item?.tipo ??
      item?.tipoMaterial ??
      item?.material ??
      this.pickFirstTextValue(item as Record<string, unknown>, ['cantidad', 'total', 'valor', 'peso', 'kilos']) ??
      'Sin tipo';
    return String(raw).trim() || 'Sin tipo';
  }

  private getMaterialCantidad(item: EmpresaDashboardMaterial): number {
    return this.pickNumericValue(item as Record<string, unknown>, [
      'cantidad',
      'total',
      'totalCantidad',
      'peso',
      'kilos',
      'valor'
    ]);
  }

  private getTiempoPromedio(item: EmpresaDashboardTiempoPromedio): number {
    const material = item?.cantidad ?? item?.total ?? item?.kilos ?? item?.peso;
    if (material !== undefined && material !== null && String(material).trim() !== '') {
      return this.toNumber(material);
    }

    const preferred = item?.promedioHoras ?? item?.tiempoPromedioHoras ?? item?.promedio;
    if (preferred !== undefined && preferred !== null && String(preferred).trim() !== '') {
      return this.toNumber(preferred);
    }

    return this.pickNumericValue(item as Record<string, unknown>, [
      'cantidad',
      'total',
      'kilos',
      'peso',
      'promedioHoras',
      'tiempoPromedioHoras',
      'promedio',
      'horasPromedio',
      'promedioAtencion',
      'tiempoPromedio',
      'valor'
    ]);
  }

  private getTiempoMes(item: EmpresaDashboardTiempoPromedio): string {
    const mes =
      item?.mes ??
      this.pickFirstValue(item as Record<string, unknown>, ['promedioHoras', 'tiempoPromedioHoras', 'promedio', 'horasPromedio', 'valor']);

    return this.normalizeMes(mes as string | number | undefined);
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

  private pickNumericValue(item: Record<string, unknown>, preferredKeys: string[]): number {
    for (const key of preferredKeys) {
      if (key in item) {
        const value = this.toNumber(item[key]);
        if (value !== 0 || item[key] === 0 || item[key] === '0') {
          return value;
        }
      }
    }

    for (const [key, value] of Object.entries(item)) {
      if (preferredKeys.includes(key)) {
        continue;
      }

      const parsed = this.toNumber(value);
      if (parsed !== 0 || value === 0 || value === '0') {
        return parsed;
      }
    }

    return 0;
  }

  private pickFirstTextValue(item: Record<string, unknown>, excludedKeys: string[]): string | null {
    for (const [key, value] of Object.entries(item)) {
      if (excludedKeys.includes(key)) {
        continue;
      }

      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private pickFirstValue(item: Record<string, unknown>, excludedKeys: string[]): unknown {
    for (const [key, value] of Object.entries(item)) {
      if (excludedKeys.includes(key)) {
        continue;
      }

      if (value !== null && value !== undefined && String(value).trim() !== '') {
        return value;
      }
    }

    return undefined;
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
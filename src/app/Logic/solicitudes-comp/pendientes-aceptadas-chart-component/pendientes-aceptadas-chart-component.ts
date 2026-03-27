import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SolicitudesEstadoItem, SolicitudRecoleccionService } from '../../../Services/solicitud.service';

@Component({
  selector: 'app-pendientes-aceptadas-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './pendientes-aceptadas-chart-component.html',
  styleUrls: ['./pendientes-aceptadas-chart-component.css']
})
export class PendientesAceptadasChartComponent implements OnInit {
  public chartOptions: any = {};
  public errorMessage: string | null = null;

  constructor(private solicitudService: SolicitudRecoleccionService) {}

  ngOnInit(): void {
    this.initializeEmptyChart();

    this.solicitudService.getAdminSolicitudesEstadoDetalle().subscribe({
      next: (items: SolicitudesEstadoItem[]) => {
        const data = (items || [])
          .map(i => ({ estado: String(i?.estado ?? ''), cantidad: Number(i?.cantidad ?? 0) }))
          .filter(i => i.estado.trim().length > 0);

        const total = data.reduce((sum, d) => sum + d.cantidad, 0);
        console.log('[EstadoSolicitudesChart][admin] items:', data.length, 'total:', total, 'data:', data);

        if (!data.length || total <= 0) {
          this.errorMessage = 'Sin datos para mostrar.';
          this.chartOptions.labels = ['Sin datos'];
          this.chartOptions.series = [0];
          return;
        }

        this.errorMessage = null;

        const labels = data.map(d => this.formatEstado(d.estado));
        const series = data.map(d => d.cantidad);

        this.chartOptions.labels = labels;
        this.chartOptions.series = series;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el estado de solicitudes.';
      }
    });
  }

  private initializeEmptyChart(): void {
    this.chartOptions = {
      series: [0],
      labels: ['Sin datos'],
      chart: {
        type: 'donut',
        height: '100%',
        toolbar: { show: false },
        animations: { enabled: false }
      },
      colors: ['#A5D6A7', '#90CAF9', '#FFE082', '#EF9A9A', '#B39DDB', '#80CBC4', '#FFCCBC'],
      dataLabels: {
        enabled: true,
        dropShadow: { enabled: false }
      },
      legend: {
        show: true,
        position: 'bottom',
        fontSize: '12px',
        markers: { width: 10, height: 10 }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: { show: true, fontSize: '12px' },
              value: { show: true, fontSize: '18px', fontWeight: 700 },
              total: {
                show: true,
                label: 'Total',
                fontSize: '12px',
                formatter: (w: any) => {
                  const totals = w?.globals?.seriesTotals || [];
                  return totals.reduce((a: number, b: number) => a + b, 0).toString();
                }
              }
            }
          }
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: { fontSize: '11px' }
          }
        }
      ],
      tooltip: {
        y: {
          formatter: (val: number) => `${val}`
        }
      }
    };
  }

  private formatEstado(estado: string): string {
    const clean = String(estado || '').trim();
    if (!clean) return 'Sin estado';

    const upper = clean.toUpperCase();
    const mapping: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      ACEPTADA: 'Aceptada',
      RECHAZADA: 'Rechazada',
      CANCELADA: 'Cancelada'
    };
    return mapping[upper] ?? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }
}

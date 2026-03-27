import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Service, PendientesAceptadas } from '../../../Services/solicitud.service';

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

  constructor(private service: Service) {}

  ngOnInit(): void {
    this.initializeEmptyChart();

    this.service.getPendientesYAceptadas().subscribe({
      next: (data: PendientesAceptadas) => {
        this.errorMessage = null;
        this.updateChart(data);
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el estado de solicitudes.';
      }
    });
  }

  private initializeEmptyChart(): void {
    this.chartOptions = {
      series: [0, 0],
      labels: ['Pendientes', 'Aceptadas'],
      chart: {
        type: 'donut',
        height: '100%',
        toolbar: { show: false },
        animations: { enabled: false }
      },
      colors: ['#1e88e5', '#2e7d32'],
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

  private updateChart(data: PendientesAceptadas): void {
    this.chartOptions.series = [data.pendientes, data.aceptadas];
  }
}

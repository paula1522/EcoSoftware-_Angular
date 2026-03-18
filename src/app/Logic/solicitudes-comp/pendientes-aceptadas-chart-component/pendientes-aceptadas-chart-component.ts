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

  constructor(private service: Service) {}

  ngOnInit() {
    // Inicializar con opciones básicas
    this.initializeEmptyChart();
    
    // Obtener TODAS las solicitudes y contar por estado
    this.service.listar().subscribe({
      next: (todasLasSolicitudes: any[]) => {
        console.log('[PendientesAceptadas] Todas las solicitudes:', todasLasSolicitudes);
        
        // Mostrar estados únicos para debugging (usar la propiedad real `estadoPeticion`)
        const estadosUnicos = new Set(todasLasSolicitudes.map(sol => sol.estadoPeticion));
        console.log('[PendientesAceptadas] Estados únicos en BD (estadoPeticion):', Array.from(estadosUnicos));
        
        // Contar por estado - permitir variaciones
        let pendientes = 0;
        let aceptadas = 0;

        todasLasSolicitudes.forEach((sol: any) => {
          const estadoRaw = sol.estadoPeticion ?? sol.estado ?? '';
          const estado = (String(estadoRaw) || '').toLowerCase().trim();
          console.log('[PendientesAceptadas] Procesando solicitud ID:', sol.idSolicitud ?? sol.id, 'Estado raw:', estadoRaw, 'Estado procesado:', estado);
          
          if (estado === 'pendiente' || estado === 'pendient') {
            pendientes++;
          } else if (estado === 'aceptada' || estado === 'aceptado') {
            aceptadas++;
          }
        });

        console.log('[PendientesAceptadas] Resultado final - Pendientes:', pendientes, 'Aceptadas:', aceptadas);
        
        this.errorMessage = null;
        const data = { pendientes, aceptadas };
        this.updateChart(data);
      },
      error: (err) => {
        console.error('Error cargando solicitudes:', err);
        // Usar datos de prueba si el endpoint falla
        console.warn('[PendientesAceptadas] API no disponible, usando datos de prueba');
        const mockData = {
          pendientes: 15,
          aceptadas: 28
        };
        this.errorMessage = '⚠️ Usando datos de prueba (API no disponible)';
        this.updateChart(mockData);
      }
    });
  }

  public errorMessage: string | null = null;

  private initializeEmptyChart(): void {
    this.chartOptions = {
      series: [{
        name: 'Solicitudes',
        data: [0, 0]
      }],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          columnWidth: '70%',
          distributed: true
        }
      },
      dataLabels: {
        enabled: true
      },
      xaxis: {
        categories: ['Pendientes', 'Aceptadas']
      },
      yaxis: {
        title: {
          text: 'Cantidad'
        }
      },
      title: {
        text: '',
        align: 'center'
      },
      // Usar solo tonos de verde y azul
      colors: ['#1e88e5', '#2e7d32'],
      fill: {
        opacity: 1
      }
    };
  }

  private updateChart(data: PendientesAceptadas): void {
    this.chartOptions.series = [{
      name: 'Solicitudes',
      data: [data.pendientes, data.aceptadas]
    }];
  }
}

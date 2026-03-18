import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Service, RechazadasPorMotivo } from '../../../Services/solicitud.service';

@Component({
  selector: 'app-rechazadas-motivo-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './rechazadas-motivo-chart-component.html',
  styleUrls: ['./rechazadas-motivo-chart-component.css']
})
export class RechazadasMotivoChartComponent implements OnInit {
  public chartOptions: any = {};

  constructor(private service: Service) {}

  ngOnInit() {
    this.initializeEmptyChart();
    
    // Obtener TODAS las solicitudes y filtrar rechazadas
    this.service.listar().subscribe({
      next: (todasLasSolicitudes: any[]) => {
        console.log('[RechazadasMotivo] Todas las solicitudes:', todasLasSolicitudes);
        
        // Filtrar solo rechazadas y contar por motivo (normalizando a etiquetas definidas)
        const porMotivo: { [key: string]: number } = {};
        let totalRechazadas = 0;
        const rechazadas: any[] = [];

        todasLasSolicitudes.forEach((sol: any) => {
          const estadoRaw = sol.estadoPeticion ?? sol.estado ?? '';
          const estado = String(estadoRaw).toLowerCase().trim();

          if (estado === 'rechazada') {
            totalRechazadas++;
            rechazadas.push(sol);
            // Log de TODOS los campos de la solicitud rechazada
            if (totalRechazadas === 1) {
              console.log('[RechazadasMotivo] PRIMERA solicitud rechazada - TODOS los campos:');
              console.log(sol);
              console.log('[RechazadasMotivo] Claves disponibles:', Object.keys(sol));
            }
            const rawMotivo = String(sol.motivoRechazo || sol.motivo || sol.descripcion || 'Sin motivo especificado');
            console.log(`[RechazadasMotivo] Sol #${sol.idSolicitud} - motivoRechazo: "${sol.motivoRechazo}", motivo: "${sol.motivo}", descripcion: "${sol.descripcion}" => Normalizado a: "${this.normalizeMotivo(rawMotivo)}"`);
            const motivo = this.normalizeMotivo(rawMotivo);
            porMotivo[motivo] = (porMotivo[motivo] || 0) + 1;
          }
        });

        // Convertir a array
        const data: RechazadasPorMotivo[] = Object.keys(porMotivo).map(motivo => ({
          motivo,
          cantidad: porMotivo[motivo]
        }));

        console.log('[RechazadasMotivo] Rechazadas encontradas:', rechazadas.length);
        console.log('[RechazadasMotivo] Rechazadas por motivo:', data);
        console.log('[RechazadasMotivo] Total rechazadas:', totalRechazadas);
        
        this.errorMessage = null;
        
        if (data && data.length > 0) {
          this.updateChart(data);
        } else {
          this.errorMessage = 'No hay solicitudes rechazadas para mostrar.';
        }
      },
      error: (err) => {
        console.error('Error cargando solicitudes:', err);
        // Usar datos de prueba si el endpoint falla
        console.warn('[RechazadasMotivo] API no disponible, usando datos de prueba');
        const mockData: RechazadasPorMotivo[] = [
          { motivo: 'Datos incorrectos', cantidad: 12 },
          { motivo: 'Información incompleta', cantidad: 8 },
          { motivo: 'Solicitud duplicada', cantidad: 5 },
          { motivo: 'Revisión administrativa', cantidad: 6 }
        ];
        this.errorMessage = ' Usando datos de prueba (API no disponible)';
        this.updateChart(mockData);
      }
    });
  }

  public errorMessage: string | null = null;

  private initializeEmptyChart(): void {
    this.chartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 300
      },
      labels: [],
      // Placeholder inmediato: muestra un donut vacío hasta que lleguen datos
      colors: this.generateColors(1),
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }],
      title: {
        text: '',
        align: 'center'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '45%'
          }
        }
      },
      dataLabels: {
        enabled: true
      },
      legend: {
        position: 'bottom'
      }
    };

    // set placeholder series/labels so the chart renders immediately
    this.chartOptions.series = [0];
    this.chartOptions.labels = ['Sin datos para mostrar'];
  }

  private updateChart(data: RechazadasPorMotivo[]): void {
    const colors = this.generateColors(data.length);

    this.chartOptions.series = data.map(item => item.cantidad);
    this.chartOptions.labels = data.map(item => item.motivo || 'Sin motivo');
    this.chartOptions.colors = colors;
  }

  private generateColors(count: number): string[] {
    // Paleta restringida a tonos de verdes y azules
    const baseColors = [
      '#0b6623', // verde oscuro
      '#1e8449', // verde medio
      '#27ae60', // verde claro
      '#2e86c1', // azul medio
      '#1f618d', // azul oscuro
      '#5dade2', // azul claro
      '#16a085', // verde azulado
      '#48c9b0', // turquesa claro
      '#117a65', // verde profundo
      '#2b788b'  // azul grisáceo
    ];

    return count <= baseColors.length
      ? baseColors.slice(0, count)
      : [...baseColors, ...this.generateAdditionalColors(count - baseColors.length)];
  }

  private generateAdditionalColors(count: number): string[] {
    const colors: string[] = [];
    // Generar variaciones entre azules y verdes
    for (let i = 0; i < count; i++) {
      const hue = 150 + Math.floor(Math.random() * 100); // 150-249 (verde-azul range)
      const saturation = 55 + Math.floor(Math.random() * 25); // 55-80
      const lightness = 40 + Math.floor(Math.random() * 20); // 40-60
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
  }

  // Normalizar motivos variados a las cinco etiquetas cortas esperadas
  private normalizeMotivo(raw: string): string {
    const s = String(raw || '').toLowerCase();
    if (!s) return 'Revisión administrativa';

    if (s.includes('duplic')) return 'Solicitud duplicada';
    if (s.includes('incomplet') || s.includes('falt')) return 'Información incompleta';
    if (s.includes('no cumple')) return 'No cumple requisitos';
    if (s.includes('revisión') || s.includes('administr') || s.includes('polít') || s.includes('decisiones')) return 'Revisión administrativa';
    if (s.includes('document') || s.includes('incorrect') || s.includes('inválid') || s.includes('invalid') || s.includes('información') || s.includes('informacion')) return 'Datos incorrectos';

    // fallback: agrupar en 'Revisión administrativa'
    return 'Revisión administrativa';
  }
}

import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { UsuarioService } from '../../../Services/usuario.service';

Chart.register(...registerables);

@Component({
  selector: 'app-grafica-usuarios-barrios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grafica-usuarios-barrio.html',
  styleUrls: ['./grafica-usuarios-barrio.css']
})
export class GraficoUsuariosBarrios implements OnInit, AfterViewInit {

  labels: string[] = [];
  cantidades: number[] = [];
  localidades: string[] = [];
  isViewReady = false;
  chart: any;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    this.isViewReady = true;
    this.intentarGenerarGrafica();
  }

  cargarDatos() {
    this.usuarioService.obtenerBarriosPorLocalidades().subscribe({
      next: (data) => {
        
        // Estructura para evitar duplicados
        const barriosMap: Record<string, { localidad: string; cantidad: number }> = {};

        data.forEach((arr: any[]) => {
          const localidad = arr[0];
          const barrio = arr[1] ?? "Barrio no identificado";
          const cantidad = arr[2];

          if (!barriosMap[barrio]) {
            barriosMap[barrio] = { localidad, cantidad };
          } else {
            barriosMap[barrio].cantidad += cantidad;
          }
        });

        this.labels = Object.keys(barriosMap);
        this.cantidades = this.labels.map(key => barriosMap[key].cantidad);
        this.localidades = this.labels.map(key => barriosMap[key].localidad);

        // Usar setTimeout para asegurar que el DOM está listo
        setTimeout(() => this.intentarGenerarGrafica(), 100);
      },
      error: (err) => {
        console.error('❌ Error cargando gráfica', err);
      }
    });
  }

  intentarGenerarGrafica() {
    if (!this.isViewReady || this.labels.length === 0) return;

    const ctx = document.getElementById('pieBarrios') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.labels,
        datasets: [
          {
            data: this.cantidades,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;

                const localidad = this.localidades[index];
                const barrio = this.labels[index];
                const cantidad = this.cantidades[index];

                return [
                  `${localidad}`,
                  
                  `${cantidad} usuarios`
                ];
              }
            }
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}

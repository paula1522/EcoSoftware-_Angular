import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../Services/usuario.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-grafico-usuarios-localidad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grafica-usuarios-localidad.html',
  styleUrls: ['./grafica-usuarios-localidad.css']
})
export class GraficoUsuariosLocalidad implements OnInit, AfterViewInit {

  localidades: string[] = [];
  ciudadanos: number[] = [];
  empresas: number[] = [];
  recicladores: number[] = [];
  private chartReady: boolean = false;
  private chart: any;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    // Obtener todos los usuarios y agrupar por localidad y rol en frontend
    console.log('[GraficoUsuariosLocalidad] ngOnInit: solicitando usuarios');
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        console.log('[GraficoUsuariosLocalidad] usuarios recibidos:', usuarios ? usuarios.length : usuarios);
        const porLocalidad: { [loc: string]: { Ciudadano: number; Empresa: number; Reciclador: number } } = {};

        usuarios.forEach(u => {
          const loc = (u.localidad && String(u.localidad)) || 'Sin localidad';
          if (!porLocalidad[loc]) porLocalidad[loc] = { Ciudadano: 0, Empresa: 0, Reciclador: 0 };

          // Mapear rolId a etiquetas
          switch (Number(u.rolId)) {
            case 2: porLocalidad[loc].Ciudadano++; break;
            case 3: porLocalidad[loc].Empresa++; break;
            case 4: porLocalidad[loc].Reciclador++; break;
            default: break; // Ignorar administradores u otros
          }
        });

        this.localidades = Object.keys(porLocalidad);
        this.ciudadanos = this.localidades.map(l => porLocalidad[l].Ciudadano || 0);
        this.empresas = this.localidades.map(l => porLocalidad[l].Empresa || 0);
        this.recicladores = this.localidades.map(l => porLocalidad[l].Reciclador || 0);
        console.log('[GraficoUsuariosLocalidad] localidades computadas:', this.localidades, 'ciudadanos:', this.ciudadanos);
        if (this.chartReady) {
          console.log('[GraficoUsuariosLocalidad] chartReady=true -> crearGrafica()');
          this.crearGrafica();
        }
      },
      error: (err) => console.error('Error cargando usuarios para gráfica:', err)
    });
  }

  ngAfterViewInit(): void {
    this.chartReady = true;
    console.log('[GraficoUsuariosLocalidad] ngAfterViewInit: chartReady=true, localidades=', this.localidades);
    // Crear la gráfica inmediatamente con datos placeholder; se actualizará cuando lleguen usuarios
    setTimeout(() => this.crearGrafica(), 50);
  }

  private crearGrafica() {
    console.log('[GraficoUsuariosLocalidad] crearGrafica invoked. localidades:', this.localidades);
    // Permitir crear una gráfica placeholder si no hay localidades aún
    const labels = (this.localidades && this.localidades.length > 0) ? this.localidades : ['Sin datos para mostrar'];
    const ciudadanosData = (this.localidades && this.localidades.length > 0) ? this.ciudadanos : [0];
    const empresasData = (this.localidades && this.localidades.length > 0) ? this.empresas : [0];
    const recicladoresData = (this.localidades && this.localidades.length > 0) ? this.recicladores : [0];

    const canvas = document.getElementById('usuariosLocalidadChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('[GraficoUsuariosLocalidad] canvas no encontrado');
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    // paleta en 3 tonos verdes bien diferenciados
    const palette = [
      'rgba(27,94,32,0.95)',   // oscuro - Ciudadanos
      'rgba(67,160,71,0.9)',   // medio  - Empresas
      'rgba(156,204,101,0.85)' // claro   - Recicladores
    ];

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Ciudadanos', data: ciudadanosData, backgroundColor: palette[0], borderColor: '#0f3f1a', borderWidth: 1, stack: 'usuarios' },
          { label: 'Empresas', data: empresasData, backgroundColor: palette[1], borderColor: '#2f6f32', borderWidth: 1, stack: 'usuarios' },
          { label: 'Recicladores', data: recicladoresData, backgroundColor: palette[2], borderColor: '#789f45', borderWidth: 1, stack: 'usuarios' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        animation: {
          duration: 600
        }
      }
    });
  }
}

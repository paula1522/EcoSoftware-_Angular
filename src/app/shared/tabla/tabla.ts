import { Header } from './../../core/header/header';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { COMPARTIR_IMPORTS } from '../imports';
import { Boton } from '../botones/boton/boton';


export interface ColumnaTabla {
  campo: string;
  titulo: string;
}

@Component({
  selector: 'app-tabla',
  imports: [COMPARTIR_IMPORTS, Boton],
  templateUrl: './tabla.html',
  styleUrls: ['./tabla.css']
})
export class Tabla implements OnChanges {

  @Input() columnas: ColumnaTabla[] = [];
  @Input() data: any[] = [];
  @Input() titulo: string = 'Listado';
  @Input() cellTemplates: { [campo: string]: (item: any) => string } = {};
  @Input() mostrarAcciones: boolean = true;
  @Input() accionesVisibles: string[] = ['ver', 'editar', 'eliminar'];
  @Input() accionVisiblePorFila?: (accion: string, item: any) => boolean;
  @Output() ver = new EventEmitter<any>();
  @Output() editar = new EventEmitter<any>();
  @Output() eliminar = new EventEmitter<any>();
  @Output() descargar = new EventEmitter<void>();
  @Output() rechazar = new EventEmitter<any>();
  @Output() accion = new EventEmitter<{ accion: string; item: any }>();

  @Input() iconosAcciones: any = {};   // ← ya existía

  pagina: number = 1;
  porPagina: number = 10;

  orden: string = '';
  ascendente: boolean = true;

  // 🔥 AHORA acciones es dinámico y seguro
  acciones: any[] = [];
  Header: any[] = [];



  // 🔥 ESTE ES EL CAMBIO MÁS IMPORTANTE (para que iconosAcciones sí funcione)
  ngOnChanges(changes: SimpleChanges) {
    this.acciones = [];

    const accionesBase = new Set(['editar', 'eliminar', 'ver', 'rechazar']);

    if (this.accionesVisibles.includes('editar')) {
      this.acciones.push({
        nombre: 'editar',
        icon: this.iconosAcciones.editar || 'bi-pencil',
        color: 'pastel-success',
        hover: 'btn-pastel-success',
        evento: (item: any) => this.editar.emit(item)
      });
    }

    if (this.accionesVisibles.includes('eliminar')) {
      this.acciones.push({
        nombre: 'eliminar',
        icon: this.iconosAcciones.eliminar || 'bi-trash',
        color: 'pastel-danger',
        hover: 'btn-pastel-danger',
        evento: (item: any) => this.eliminar.emit(item)
      });
    }

    if (this.accionesVisibles.includes('ver')) {
      this.acciones.push({
        nombre: 'ver',
        icon: this.iconosAcciones.ver || 'bi-eye',
        color: 'pastel-info',
        hover: 'btn-pastel-info',
        evento: (item: any) => this.ver.emit(item)
      });
    }

    if (this.accionesVisibles.includes('rechazar')) {
      this.acciones.push({
        nombre: 'rechazar',
        icon: this.iconosAcciones.rechazar || 'bi-x-circle',
        color: 'pastel-danger',
        hover: 'btn-pastel-danger',
        evento: (item: any) => this.rechazar.emit(item)
      });
    };

    this.accionesVisibles
      .filter((accion) => !accionesBase.has(accion))
      .forEach((accion) => {
        const config = this.iconosAcciones?.[accion] || {};
        this.acciones.push({
          nombre: accion,
          icon: config.icon || 'bi-three-dots',
          texto: config.texto || '',
          color: config.color || 'outline-custom-success',
          hover: config.hover || 'custom-success-filled',
          evento: (item: any) => this.accion.emit({ accion, item })
        });
      });

    this.Header = [
      {
        icon: this.iconosAcciones.descargar || 'bi-download',
        texto: '',
        color: 'outline-custom-success',
        hover: 'custom-success-filled',
        evento: () => this.descargar.emit()
      }
    ];
  }

  cambiarPagina(p: number) {
    this.pagina = p;
  }

  ordenar(campo: string) {
    if (this.orden === campo) this.ascendente = !this.ascendente;
    else {
      this.orden = campo;
      this.ascendente = true;
    }

    this.data.sort((a, b) => {
      if (a[campo] < b[campo]) return this.ascendente ? -1 : 1;
      if (a[campo] > b[campo]) return this.ascendente ? 1 : -1;
      return 0;
    });
  }

  get datosPaginados() {
    const inicio = (this.pagina - 1) * this.porPagina;
    return this.data.slice(inicio, inicio + this.porPagina);
  }

  get totalPaginas() {
    return Math.ceil(this.data.length / this.porPagina);
  }

  get showingFrom() {
    return this.data.length === 0 ? 0 : (this.pagina - 1) * this.porPagina + 1;
  }

  get showingTo() {
    const calc = this.pagina * this.porPagina;
    return calc > this.data.length ? this.data.length : calc;
  }

  get paginasAMostrar() {
    const total = this.totalPaginas;
    const arr: number[] = [];
    const max = 5;
    let start = Math.max(this.pagina - 2, 1);
    let end = Math.min(start + max - 1, total);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  esAccionVisible(nombreAccion: string, item: any): boolean {
    return this.accionVisiblePorFila ? this.accionVisiblePorFila(nombreAccion, item) : true;
  }
}

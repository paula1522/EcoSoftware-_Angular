import { RutaParadaService } from './../../Services/ruta-parada';
import { RutaParada } from './../../Models/ruta-parada';
import { Component, OnInit, ViewChild } from '@angular/core';
import { RutaRecoleccionService } from '../../Services/ruta-recoleccion';
import { RutaRecoleccion } from '../../Models/ruta-recoleccion';
import { Modal } from '../../shared/modal/modal';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rutas',
  templateUrl: './rutas.html',
    imports: [Modal,FormsModule,CommonModule],
  styleUrls: ['./rutas.css']

})
export class Rutas implements OnInit {

  rutas: any[] = [];
  paradasDisponibles: any[] = [];
  
  rutaForm = {
    nombre: '',
    descripcion: '',
    zonasCubiertas: '',
    paradasIds: [] as number[]
  };

  @ViewChild('modalCrearRuta') modalCrearRuta!: Modal;

abrirCrearRuta() {
  this.modalCrearRuta.isOpen = true;
}

cerrarCrearRuta() {
  this.modalCrearRuta.isOpen = false;
}


  constructor(
    private rutaService: RutaRecoleccionService,
    private RutaParadaService: RutaParadaService
  ) {}

  ngOnInit(): void {
    this.cargarRutas();
    this.cargarParadasDisponibles();
  }

  cargarRutas() {
    this.rutaService.getRutas().subscribe(res => this.rutas = res);
  }

  cargarParadasDisponibles() {
    // Supongo que tu servicio tiene algo para listar paradas activas
    this.RutaParadaService.listarParadas(0).subscribe(res => this.paradasDisponibles = res);
  }

  toggleParada(id: number, event: any) {
    if (event.target.checked) {
      this.rutaForm.paradasIds.push(id);
    } else {
      this.rutaForm.paradasIds = this.rutaForm.paradasIds.filter(x => x !== id);
    }
  }

crearRuta() {
  if (!this.rutaForm.nombre || this.rutaForm.paradasIds.length === 0) {
    alert('Debes ingresar un nombre y seleccionar al menos una parada.');
    return;
  }

  const nuevaRuta: Partial<RutaRecoleccion> = {
  nombre: this.rutaForm.nombre,
  descripcion: this.rutaForm.descripcion,
  zonasCubiertas: this.rutaForm.zonasCubiertas,
  paradas: this.rutaForm.paradasIds.map(id => ({ idParada: id } as RutaParada))
};


  this.rutaService.crearRuta(nuevaRuta).subscribe({
    next: (res) => {
      alert('Ruta creada correctamente');
      this.modalCrearRuta.close();
      this.cargarRutas();
      this.rutaForm = { nombre: '', descripcion: '', zonasCubiertas: '', paradasIds: [] };
    },
    error: () => alert('Error creando la ruta')
  });
}

  operarRuta(ruta: any) {
    // Aquí puedes abrir un modal de mapa o componente de operación
    alert('Operar ruta ' + ruta.nombre);
  }

  asignarRuta(ruta: any) {
    // Aquí puedes abrir un modal de asignación de recolecciones
    alert('Asignar ruta ' + ruta.nombre);
  }

}
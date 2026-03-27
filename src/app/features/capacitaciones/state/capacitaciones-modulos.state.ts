import { Injectable, signal } from '@angular/core';
import { ModuloDTO } from '../models/capacitaciones-modulos.models';

@Injectable({
  providedIn: 'root',
})
export class CapacitacionesModulosState {
  readonly selectedCapacitacionId = signal<number | null>(null);
  readonly modulos = signal<ModuloDTO[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string>('');

  setSelectedCapacitacion(id: number | null): void {
    this.selectedCapacitacionId.set(id);
  }

  setModulos(modulos: ModuloDTO[]): void {
    this.modulos.set(modulos);
  }

  setLoading(value: boolean): void {
    this.loading.set(value);
  }

  setError(message: string): void {
    this.error.set(message);
  }

  clearError(): void {
    this.error.set('');
  }
}

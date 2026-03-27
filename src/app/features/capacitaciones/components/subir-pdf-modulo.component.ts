import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CapacitacionesModulosApiService } from '../api/capacitaciones-modulos-api.service';

@Component({
  selector: 'app-subir-pdf-modulo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex flex-column gap-2">
      <div class="d-flex flex-wrap align-items-center gap-2">
        <input type="file" accept="application/pdf" multiple (change)="onFileChange($event)" class="form-control form-control-sm" style="max-width: 320px;" />
        <button class="btn btn-outline-success btn-sm" (click)="subir()" [disabled]="loading || selectedFiles.length === 0 || !moduloId">
          {{ loading ? 'Subiendo...' : 'Subir PDF(s)' }}
        </button>
        <span class="badge" [class.bg-success]="currentUrl" [class.bg-warning]="!currentUrl">{{ currentUrl ? 'PDF cargado' : 'PDF pendiente' }}</span>
        <span class="small text-muted" *ngIf="selectedFiles.length > 0">{{ selectedFiles.length }} archivo(s) seleccionado(s)</span>
      </div>

      @if (currentUrl) {
        <a [href]="currentUrl" target="_blank" rel="noopener noreferrer" class="small">Ver PDF actual</a>
      }
      @if (uploadedUrl) {
        <a [href]="uploadedUrl" target="_blank" rel="noopener noreferrer" class="small text-success">Abrir URL devuelta por backend</a>
      }
      @if (uploadedUrls.length > 0) {
        <div class="small text-success">
          <div class="fw-semibold">Archivos cargados en esta operación:</div>
          <ul class="mb-0 ps-3">
            <li *ngFor="let url of uploadedUrls">{{ url }}</li>
          </ul>
        </div>
      }
      @if (error) {
        <small class="text-danger">{{ error }}</small>
      }
      @if (success) {
        <small class="text-success">{{ success }}</small>
      }
    </div>
  `,
})
export class SubirPdfModuloComponent {
  @Input() moduloId: number | null = null;
  @Input() currentUrl: string | null | undefined = null;
  @Input() maxSizeMb = 20;

  @Output() pdfSubido = new EventEmitter<string>();

  selectedFiles: File[] = [];
  uploadedUrl: string | null = null;
  uploadedUrls: string[] = [];
  loading = false;
  error = '';
  success = '';

  constructor(private readonly api: CapacitacionesModulosApiService) {}

  onFileChange(event: Event): void {
    this.error = '';
    this.success = '';
    this.uploadedUrl = null;
    this.uploadedUrls = [];

    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) {
      this.selectedFiles = [];
      return;
    }

    const invalidType = files.find((file) => file.type !== 'application/pdf');
    if (invalidType) {
      this.error = `Solo se permiten archivos PDF. Archivo inválido: ${invalidType.name}`;
      this.selectedFiles = [];
      input.value = '';
      return;
    }

    const invalidSize = files.find((file) => file.size > this.maxSizeMb * 1024 * 1024);
    if (invalidSize) {
      this.error = `El archivo ${invalidSize.name} supera ${this.maxSizeMb}MB.`;
      this.selectedFiles = [];
      input.value = '';
      return;
    }

    this.selectedFiles = files;
  }

  subir(): void {
    this.error = '';
    this.success = '';
    this.uploadedUrls = [];

    if (!this.moduloId || this.selectedFiles.length === 0) {
      this.error = 'Selecciona un archivo PDF válido.';
      return;
    }

    this.loading = true;
    const queue = [...this.selectedFiles];
    const total = queue.length;

    const uploadNext = (index: number) => {
      if (!this.moduloId) {
        this.loading = false;
        return;
      }

      if (index >= total) {
        this.loading = false;
        this.success = total > 1 ? `${total} PDFs subidos correctamente.` : 'PDF subido correctamente.';
        this.selectedFiles = [];
        return;
      }

      this.api.subirPdfModulo(this.moduloId, queue[index]).subscribe({
        next: (res) => {
          const uploadedUrl = this.extractUploadedUrl(res);

          if (!uploadedUrl) {
            this.loading = false;
            this.error = 'El backend respondió sin URL de PDF. Revisa el endpoint de subida.';
            return;
          }

          this.uploadedUrl = uploadedUrl;
          this.uploadedUrls = [...this.uploadedUrls, uploadedUrl];
          this.pdfSubido.emit(uploadedUrl);
          uploadNext(index + 1);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || err?.error?.error || 'Error al subir PDF.';
        },
      });
    };

    uploadNext(0);
  }

  private extractUploadedUrl(res: any): string {
    const candidate =
      res?.url ||
      res?.secure_url ||
      res?.secureUrl ||
      res?.archivoPdfUrl ||
      res?.pdfUrl ||
      res?.data?.url ||
      res?.data?.secure_url ||
      res?.data?.secureUrl ||
      '';

    return String(candidate || '').trim();
  }

}

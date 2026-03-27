import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CapacitacionesModulosApiService } from '../api/capacitaciones-modulos-api.service';

@Component({
  selector: 'app-subir-pdf-modulo',
  standalone: true,
  imports: [],
  template: `
    <div class="d-flex flex-column gap-2">
      <div class="d-flex flex-wrap align-items-center gap-2">
        <input type="file" accept="application/pdf" (change)="onFileChange($event)" class="form-control form-control-sm" style="max-width: 280px;" />
        <button class="btn btn-outline-success btn-sm" (click)="subir()" [disabled]="loading || !selectedFile || !moduloId">
          {{ loading ? 'Subiendo...' : 'Subir PDF' }}
        </button>
        <span class="badge" [class.bg-success]="currentUrl" [class.bg-warning]="!currentUrl">{{ currentUrl ? 'PDF cargado' : 'PDF pendiente' }}</span>
      </div>

      @if (currentUrl) {
        <a [href]="currentUrl" target="_blank" rel="noopener noreferrer" class="small">Ver PDF actual</a>
      }
      @if (uploadedUrl) {
        <a [href]="uploadedUrl" target="_blank" rel="noopener noreferrer" class="small text-success">Abrir URL devuelta por backend</a>
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

  selectedFile: File | null = null;
  uploadedUrl: string | null = null;
  loading = false;
  error = '';
  success = '';

  constructor(private readonly api: CapacitacionesModulosApiService) {}

  onFileChange(event: Event): void {
    this.error = '';
    this.success = '';
    this.uploadedUrl = null;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (file.type !== 'application/pdf') {
      this.error = 'Solo se permiten archivos PDF.';
      this.selectedFile = null;
      input.value = '';
      return;
    }

    if (file.size > this.maxSizeMb * 1024 * 1024) {
      this.error = `El archivo supera ${this.maxSizeMb}MB.`;
      this.selectedFile = null;
      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  subir(): void {
    this.error = '';
    this.success = '';

    if (!this.moduloId || !this.selectedFile) {
      this.error = 'Selecciona un archivo PDF válido.';
      return;
    }

    this.loading = true;
    this.api.subirPdfModulo(this.moduloId, this.selectedFile).subscribe({
      next: (res) => {
        const uploadedUrl = this.extractUploadedUrl(res);

        this.loading = false;
        if (!uploadedUrl) {
          this.error = 'El backend respondió sin URL de PDF. Revisa el endpoint de subida.';
          return;
        }

        this.uploadedUrl = uploadedUrl;
        this.success = 'PDF subido correctamente.';
        this.pdfSubido.emit(uploadedUrl);
        this.selectedFile = null;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.error?.error || 'Error al subir PDF.';
      },
    });
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

    return this.normalizePdfUrl(candidate);
  }

  private normalizePdfUrl(url: unknown): string {
    const raw = String(url || '').trim();
    if (!raw) {
      return '';
    }

    if (!raw.includes('res.cloudinary.com')) {
      return raw;
    }

    // Para PDFs en Cloudinary usamos raw/upload; no alteramos la carpeta (modulos/modulo).
    if (raw.includes('/image/upload/')) {
      return raw.replace('/image/upload/', '/raw/upload/');
    }

    return raw;
  }

}

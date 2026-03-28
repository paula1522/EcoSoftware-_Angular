import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CapacitacionesModulosApiService } from '../api/capacitaciones-modulos-api.service';

@Component({
  selector: 'app-subir-pdf-modulo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="pdf-manager">
      <div class="pdf-manager__header">
        <div>
          <p class="pdf-manager__eyebrow">Material del módulo</p>
          <h6>PDF único con previsualización</h6>
          <p class="pdf-manager__copy">Sube un solo archivo PDF para este módulo. Antes de guardar puedes revisar el documento dentro de la misma tarjeta.</p>
        </div>

        <span class="pdf-manager__badge" [class.pdf-manager__badge--ready]="currentUrl">
          {{ currentUrl ? 'PDF publicado' : 'Sin PDF publicado' }}
        </span>
      </div>

      <div class="pdf-manager__controls">
        <label class="pdf-manager__picker" [attr.for]="fileInputId">
          <span>Seleccionar PDF</span>
          <input
            [id]="fileInputId"
            type="file"
            accept="application/pdf"
            (change)="onFileChange($event)"
          />
        </label>

        <button class="btn btn-success" type="button" (click)="subir()" [disabled]="loading || !selectedFile || !moduloId">
          {{ loading ? 'Subiendo...' : 'Guardar PDF' }}
        </button>

        <a
          *ngIf="currentUrl"
          class="btn btn-outline-secondary"
          [href]="currentUrl"
          target="_blank"
          rel="noopener noreferrer">
          Abrir PDF actual
        </a>
      </div>

      <div class="pdf-manager__meta">
        <div>
          <strong>{{ selectedFile ? selectedFile.name : 'Ningún archivo nuevo seleccionado' }}</strong>
          <span>{{ selectedFile ? formatFileSize(selectedFile.size) : 'Acepta solo 1 PDF de hasta ' + maxSizeMb + ' MB.' }}</span>
        </div>

        <div *ngIf="uploadedUrl" class="pdf-manager__success-link">
          Última URL guardada:
          <a [href]="uploadedUrl" target="_blank" rel="noopener noreferrer">ver documento</a>
        </div>
      </div>

      <div class="pdf-manager__messages">
        <small class="text-danger" *ngIf="error">{{ error }}</small>
        <small class="text-success" *ngIf="success">{{ success }}</small>
      </div>

      <div class="pdf-manager__preview" *ngIf="previewUrl as safePreviewUrl">
        <div class="pdf-manager__preview-header">
          <div>
            <strong>{{ previewLabel }}</strong>
            <span>Vista embebida del PDF</span>
          </div>
          <button class="btn btn-outline-dark btn-sm" type="button" (click)="clearSelection()" *ngIf="selectedFile">Descartar selección</button>
        </div>

        <iframe [src]="safePreviewUrl" title="Previsualización del PDF del módulo"></iframe>
      </div>
    </section>
  `,
  styles: [
    `
      .pdf-manager {
        display: grid;
        gap: 1rem;
        padding: 1.2rem;
        border: 1px solid #d8e5dd;
        border-radius: 24px;
        background:
          radial-gradient(circle at top right, rgba(198, 230, 208, 0.35), transparent 28%),
          linear-gradient(180deg, #ffffff 0%, #f8fbf9 100%);
        box-shadow: 0 16px 32px rgba(24, 58, 39, 0.08);
      }

      .pdf-manager__header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
      }

      .pdf-manager__eyebrow {
        margin: 0 0 0.35rem;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-weight: 800;
        color: #2b7a42;
      }

      .pdf-manager h6 {
        margin: 0;
        font-size: 1.05rem;
        color: #183a27;
      }

      .pdf-manager__copy {
        margin: 0.4rem 0 0;
        max-width: 52ch;
        color: #537061;
        line-height: 1.55;
      }

      .pdf-manager__badge {
        padding: 0.55rem 0.9rem;
        border-radius: 999px;
        background: #f6d9cb;
        color: #8c3f1d;
        font-weight: 700;
        font-size: 0.82rem;
        white-space: nowrap;
      }

      .pdf-manager__badge--ready {
        background: #d8efe0;
        color: #19603a;
      }

      .pdf-manager__controls {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }

      .pdf-manager__picker {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0.85rem 1.15rem;
        border: 1px dashed #9cc4aa;
        border-radius: 16px;
        background: rgba(234, 244, 237, 0.9);
        color: #1f5937;
        font-weight: 700;
        cursor: pointer;
      }

      .pdf-manager__picker input {
        display: none;
      }

      .pdf-manager__meta {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 0.8rem;
        padding: 0.95rem 1rem;
        border-radius: 18px;
        background: #f3f8f5;
        border: 1px solid #e0ebe4;
      }

      .pdf-manager__meta strong,
      .pdf-manager__meta span,
      .pdf-manager__success-link {
        display: block;
      }

      .pdf-manager__meta strong {
        color: #183a27;
      }

      .pdf-manager__meta span,
      .pdf-manager__success-link {
        font-size: 0.88rem;
        color: #5d7769;
      }

      .pdf-manager__success-link a {
        color: #16613d;
        font-weight: 700;
        text-decoration: none;
      }

      .pdf-manager__messages {
        min-height: 1rem;
      }

      .pdf-manager__preview {
        overflow: hidden;
        border-radius: 22px;
        border: 1px solid #d6e4db;
        background: #fff;
      }

      .pdf-manager__preview-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: center;
        padding: 0.95rem 1rem;
        background: linear-gradient(135deg, #eff7f1 0%, #f7faf8 100%);
        border-bottom: 1px solid #dfeae3;
      }

      .pdf-manager__preview-header strong,
      .pdf-manager__preview-header span {
        display: block;
      }

      .pdf-manager__preview-header span {
        color: #60786b;
        font-size: 0.85rem;
      }

      .pdf-manager iframe {
        width: 100%;
        min-height: 420px;
        border: 0;
        background: #f4f6f5;
      }

      @media (max-width: 767px) {
        .pdf-manager {
          padding: 1rem;
          border-radius: 20px;
        }

        .pdf-manager__header,
        .pdf-manager__meta,
        .pdf-manager__preview-header {
          flex-direction: column;
          align-items: stretch;
        }

        .pdf-manager iframe {
          min-height: 300px;
        }
      }
    `,
  ],
})
export class SubirPdfModuloComponent implements OnChanges, OnDestroy {
  @Input() moduloId: number | null = null;
  @Input() currentUrl: string | null | undefined = null;
  @Input() maxSizeMb = 20;

  @Output() pdfSubido = new EventEmitter<string>();

  readonly fileInputId = `pdf-modulo-${Math.random().toString(36).slice(2, 9)}`;

  selectedFile: File | null = null;
  uploadedUrl: string | null = null;
  loading = false;
  error = '';
  success = '';
  previewUrl: SafeResourceUrl | null = null;
  previewLabel = 'PDF actual del módulo';

  private currentObjectUrl: string | null = null;
  private fileInputElement: HTMLInputElement | null = null;

  constructor(
    private readonly api: CapacitacionesModulosApiService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentUrl'] && !this.selectedFile) {
      this.setPreviewFromRemoteUrl(this.currentUrl);
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  onFileChange(event: Event): void {
    this.error = '';
    this.success = '';
    this.uploadedUrl = null;

    const input = event.target as HTMLInputElement;
    this.fileInputElement = input;

    const files = Array.from(input.files || []);
    if (!files.length) {
      this.selectedFile = null;
      this.setPreviewFromRemoteUrl(this.currentUrl);
      return;
    }

    if (files.length > 1) {
      this.error = 'Solo puedes seleccionar un único archivo PDF por módulo.';
      this.selectedFile = null;
      input.value = '';
      this.setPreviewFromRemoteUrl(this.currentUrl);
      return;
    }

    const [file] = files;

    if (file.type !== 'application/pdf') {
      this.error = `Solo se permiten archivos PDF. Archivo inválido: ${file.name}`;
      this.selectedFile = null;
      input.value = '';
      this.setPreviewFromRemoteUrl(this.currentUrl);
      return;
    }

    if (file.size > this.maxSizeMb * 1024 * 1024) {
      this.error = `El archivo ${file.name} supera ${this.maxSizeMb}MB.`;
      this.selectedFile = null;
      input.value = '';
      this.setPreviewFromRemoteUrl(this.currentUrl);
      return;
    }

    this.selectedFile = file;
    this.setPreviewFromLocalFile(file);
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

        if (!uploadedUrl) {
          this.loading = false;
          this.error = 'El backend respondió sin URL de PDF. Revisa el endpoint de subida.';
          return;
        }

        this.uploadedUrl = uploadedUrl;
        this.currentUrl = uploadedUrl;
        this.loading = false;
        this.success = 'PDF subido correctamente.';
        this.selectedFile = null;
        if (this.fileInputElement) {
          this.fileInputElement.value = '';
        }
        this.setPreviewFromRemoteUrl(uploadedUrl);
        this.pdfSubido.emit(uploadedUrl);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.error?.error || 'Error al subir PDF.';
      },
    });
  }

  clearSelection(): void {
    this.selectedFile = null;
    this.error = '';
    this.success = '';
    if (this.fileInputElement) {
      this.fileInputElement.value = '';
    }
    this.setPreviewFromRemoteUrl(this.currentUrl);
  }

  formatFileSize(size: number): string {
    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  private setPreviewFromLocalFile(file: File): void {
    this.revokeObjectUrl();
    this.currentObjectUrl = URL.createObjectURL(file);
    this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentObjectUrl);
    this.previewLabel = 'Previsualización del PDF seleccionado';
  }

  private setPreviewFromRemoteUrl(url: string | null | undefined): void {
    this.revokeObjectUrl();
    const exactUrl = String(url || '').trim();

    if (!exactUrl) {
      this.previewUrl = null;
      this.previewLabel = 'PDF actual del módulo';
      return;
    }

    const viewerUrl = this.buildEmbeddedPdfUrl(exactUrl);
    this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
    this.previewLabel = 'PDF actual del módulo';
  }

  private buildEmbeddedPdfUrl(url: string): string {
    const hasFragment = url.includes('#');
    const viewerParams = 'toolbar=0&navpanes=0&scrollbar=1';
    return `${url}${hasFragment ? '&' : '#'}${viewerParams}`;
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

  private revokeObjectUrl(): void {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
  }
}

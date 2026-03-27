import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EvaluacionDTO,
  IntentoEvaluacionDTO,
  ModuloEvaluacionDTO,
  ModuloPreguntaDTO,
  ProgresoUsuarioEvaluacionDTO,
  ModuloDTO,
  ProgresoDTO,
  UploadPdfResponseDTO,
} from '../models/capacitaciones-modulos.models';
import { hydrateEvaluacionFromDescription, prepareEvaluacionForApi } from '../utils/evaluacion-quiz.util';

@Injectable({
  providedIn: 'root',
})
export class CapacitacionesModulosApiService {
  private readonly apiBase = (environment.apiBaseUrl || environment.apiUrl || '').replace(/\/$/, '');
  private readonly prefix = `${this.apiBase}/api/capacitaciones`;

  constructor(private readonly http: HttpClient) {}

  crearModuloPorCapacitacion(capacitacionId: number, dto: ModuloDTO): Observable<ModuloDTO> {
    return this.http.post<ModuloDTO>(`${this.prefix}/${capacitacionId}/modulos`, this.mapModuloForApi(dto));
  }

  crearModulo(dto: ModuloDTO): Observable<ModuloDTO> {
    return this.http.post<ModuloDTO>(`${this.prefix}/modulos`, this.mapModuloForApi(dto));
  }

  listarModulosPorCapacitacion(capacitacionId: number): Observable<ModuloDTO[]> {
    return new Observable<ModuloDTO[]>((subscriber) => {
      this.http.get<any[]>(`${this.prefix}/${capacitacionId}/modulos`).subscribe({
        next: (rows) => subscriber.next((rows || []).map((row) => this.mapModulo(row))),
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
    });
  }

  actualizarModulo(id: number, dto: ModuloDTO): Observable<ModuloDTO> {
    return this.http.put<ModuloDTO>(`${this.prefix}/modulos/${id}`, this.mapModuloForApi(dto));
  }

  eliminarModulo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.prefix}/modulos/${id}`);
  }

  subirPdfModulo(moduloId: number, file: File): Observable<UploadPdfResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadPdfResponseDTO>(`${this.prefix}/modulos/${moduloId}/pdf`, formData);
  }

  listarEvaluacionesPorModulo(moduloId: number): Observable<EvaluacionDTO[]> {
    return new Observable<EvaluacionDTO[]>((subscriber) => {
      this.http.get<EvaluacionDTO[]>(`${this.prefix}/modulos/${moduloId}/evaluaciones`).subscribe({
        next: (rows) => subscriber.next((rows || []).map((ev) => hydrateEvaluacionFromDescription(ev))),
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
    });
  }

  crearEvaluacion(moduloId: number, dto: EvaluacionDTO): Observable<EvaluacionDTO> {
    const payload = prepareEvaluacionForApi(dto);
    return new Observable<EvaluacionDTO>((subscriber) => {
      this.http.post<EvaluacionDTO>(`${this.prefix}/modulos/${moduloId}/evaluaciones`, payload).subscribe({
        next: (ev) => subscriber.next(hydrateEvaluacionFromDescription(ev)),
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
    });
  }

  actualizarEvaluacion(evaluacionId: number, dto: EvaluacionDTO): Observable<EvaluacionDTO> {
    const payload = prepareEvaluacionForApi(dto);
    return new Observable<EvaluacionDTO>((subscriber) => {
      this.http.put<EvaluacionDTO>(`${this.prefix}/evaluaciones/${evaluacionId}`, payload).subscribe({
        next: (ev) => subscriber.next(hydrateEvaluacionFromDescription(ev)),
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
    });
  }

  eliminarEvaluacion(evaluacionId: number): Observable<void> {
    return this.http.delete<void>(`${this.prefix}/evaluaciones/${evaluacionId}`);
  }

  registrarIntentoEvaluacion(evaluacionId: number, dto: IntentoEvaluacionDTO): Observable<IntentoEvaluacionDTO> {
    return this.http.post<IntentoEvaluacionDTO>(`${this.prefix}/evaluaciones/${evaluacionId}/intentos`, dto);
  }

  listarIntentosPorEvaluacionYUsuario(evaluacionId: number, usuarioId: number): Observable<IntentoEvaluacionDTO[]> {
    return this.http.get<IntentoEvaluacionDTO[]>(`${this.prefix}/evaluaciones/${evaluacionId}/intentos/usuario/${usuarioId}`);
  }

  obtenerProgresoUsuarioPorCurso(usuarioId: number, cursoId: number): Observable<ProgresoDTO> {
    return this.http.get<ProgresoDTO>(`${this.prefix}/progreso/usuario/${usuarioId}/curso/${cursoId}`);
  }

  private mapModulo(raw: any): ModuloDTO {
    const url = this.extractPdfUrl(raw);

    return {
      id: raw?.id,
      duracion: String(raw?.duracion ?? ''),
      descripcion: String(raw?.descripcion ?? ''),
      capacitacionId: raw?.capacitacionId ?? raw?.capacitacion_id,
      archivoPdfUrl: url,
      evaluacion: this.extractEvaluacion(raw?.evaluacion),
    };
  }

  private mapModuloForApi(dto: ModuloDTO): ModuloDTO {
    return {
      ...dto,
      evaluacion: this.normalizeEvaluacion(dto.evaluacion),
    };
  }

  private extractPdfUrl(raw: any): string | null {
    const candidate =
      raw?.archivoPdfUrl ??
      raw?.archivo_pdf_url ??
      raw?.pdfUrl ??
      raw?.pdf_url ??
      raw?.url ??
      null;

    const normalized = String(candidate ?? '').trim();
    return normalized || null;
  }

  private extractEvaluacion(rawEvaluacion: unknown): ModuloEvaluacionDTO | null {
    if (!rawEvaluacion) {
      return null;
    }

    const parsed = typeof rawEvaluacion === 'string' ? this.safeParse(rawEvaluacion) : rawEvaluacion;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const titulo = String((parsed as any).titulo ?? '').trim();
    const preguntasRaw = Array.isArray((parsed as any).preguntas) ? (parsed as any).preguntas : [];

    const preguntas = preguntasRaw
      .map((p: any) => this.normalizePregunta(p))
      .filter((p: ModuloPreguntaDTO | null): p is ModuloPreguntaDTO => !!p);

    const progresoUsuarios = this.normalizeProgresoUsuarios((parsed as any).progresoUsuarios);

    if (!titulo || preguntas.length === 0) {
      return null;
    }

    return {
      titulo,
      preguntas,
      progresoUsuarios,
    };
  }

  private normalizeEvaluacion(raw: ModuloEvaluacionDTO | null | undefined): ModuloEvaluacionDTO | null {
    if (!raw) {
      return null;
    }

    const titulo = String(raw.titulo || '').trim();
    const preguntas = (Array.isArray(raw.preguntas) ? raw.preguntas : [])
      .map((p) => this.normalizePregunta(p))
      .filter((p: ModuloPreguntaDTO | null): p is ModuloPreguntaDTO => !!p);

    if (!titulo || preguntas.length === 0) {
      return null;
    }

    return {
      titulo,
      preguntas,
      progresoUsuarios: this.normalizeProgresoUsuarios(raw.progresoUsuarios),
    };
  }

  private normalizePregunta(raw: any): ModuloPreguntaDTO | null {
    const texto = String(raw?.texto ?? '').trim();
    const opciones = (Array.isArray(raw?.opciones) ? raw.opciones : [])
      .map((o: unknown) => String(o ?? '').trim())
      .filter((o: string) => !!o);
    const respuestaCorrecta = String(raw?.respuestaCorrecta ?? '').trim();

    if (!texto || opciones.length < 2 || !respuestaCorrecta || !opciones.includes(respuestaCorrecta)) {
      return null;
    }

    return {
      texto,
      tipo: 'opcion_multiple',
      opciones,
      respuestaCorrecta,
    };
  }

  private safeParse(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private normalizeProgresoUsuarios(raw: unknown): Record<string, ProgresoUsuarioEvaluacionDTO> {
    if (!raw || typeof raw !== 'object') {
      return {};
    }

    const result: Record<string, ProgresoUsuarioEvaluacionDTO> = {};

    Object.entries(raw as Record<string, any>).forEach(([userId, value]) => {
      const puntaje = Number(value?.puntaje ?? 0);
      const completado100 = !!value?.completado100;
      const ultimaActualizacion = String(value?.ultimaActualizacion ?? '').trim();

      if (!Number.isNaN(puntaje)) {
        result[userId] = {
          puntaje,
          completado100,
          ultimaActualizacion: ultimaActualizacion || new Date().toISOString(),
        };
      }
    });

    return result;
  }
}

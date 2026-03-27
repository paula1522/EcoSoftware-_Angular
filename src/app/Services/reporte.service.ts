import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { UsuarioModel } from '../Models/usuario';
import { SolicitudRecoleccion } from '../Models/solicitudes.model';
import { PuntoReciclaje } from '../Models/puntos-reciclaje.model';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private pdfDoc: jsPDF | null = null;
  private yPosition: number = 20;
  private pageHeight: number = 297; // A4 height in mm
  private margin: number = 15;
  private pageWidth: number = 210; // A4 width in mm
  private readonly logoPath = 'assets/Logo - copia.png';

  // Estilo tipo "Modern Report" (basado en tu imagen)
  private readonly accentBlue: [number, number, number] = [25, 135, 84];
  private readonly accentNavy: [number, number, number] = [19, 78, 52];
  private readonly lineColor: [number, number, number] = [19, 78, 52];
  private readonly textGray: [number, number, number] = [79, 96, 90];
  private readonly lightBg: [number, number, number] = [244, 249, 246];

  constructor() {}

  /**
   * Genera un reporte PDF de usuarios
   */
  async generarReporteUsuarios(
    usuarios: UsuarioModel[],
    graficoElement: HTMLElement | null
  ): Promise<void> {
    try {
      this.pdfDoc = new jsPDF('p', 'mm', 'a4');
      this.yPosition = this.margin;

      this.agregarPortadaModern('Modern Report', `Usuarios • ${new Date().toLocaleDateString('es-ES')}`);

      // Bloque superior: gráfico (izq) + resumen (der)
      if (graficoElement) {
        await this.agregarGraficoEnCaja(
          graficoElement,
          this.margin,
          this.yPosition,
          110,
          78
        );
      } else {
        this.dibujarCajaVacia(this.margin, this.yPosition, 110, 78, 'Gráfico no disponible');
      }

      this.agregarResumenModernUsuarios(usuarios, this.margin + 118, this.yPosition + 6, 77);

      this.yPosition += 86;

      // Línea divisoria horizontal (como la imagen)
      this.dibujarLinea(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
      this.yPosition += 6;

      // Bloque inferior: tabla (izq) + texto resumen (der)
      this.agregarTablaMiniUsuarios(usuarios, this.margin, this.yPosition, 110);
      this.agregarBloqueTextoModern(
        'Usuarios por Localidad',
        'Resumen de distribución por localidad según el gráfico. Útil para identificar concentración de usuarios por zona.',
        this.margin + 118,
        this.yPosition,
        77
      );

      // Guardar PDF
      this.pdfDoc.save('Reporte_Usuarios.pdf');
      return;

    } catch (error) {
      console.error('Error al generar reporte de usuarios:', error);
      throw error;
    }
  }

  /**
   * Genera un reporte PDF de solicitudes
   */
  async generarReporteSolicitudes(
    solicitudes: SolicitudRecoleccion[],
    graficoElements: { [key: string]: HTMLElement | null }
  ): Promise<void> {
    try {
      this.pdfDoc = new jsPDF('p', 'mm', 'a4');
      this.yPosition = this.margin;

      this.agregarPortadaModern('Modern Report', `Solicitudes • ${new Date().toLocaleDateString('es-ES')}`);

      const chartEl = graficoElements['localidad'] || graficoElements['estado'] || null;
      if (chartEl) {
        await this.agregarGraficoEnCaja(chartEl, this.margin, this.yPosition, 110, 78);
      } else {
        this.dibujarCajaVacia(this.margin, this.yPosition, 110, 78, 'Gráfico no disponible');
      }

      this.agregarResumenModernSolicitudes(solicitudes, this.margin + 118, this.yPosition + 6, 77);

      this.yPosition += 86;
      this.dibujarLinea(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
      this.yPosition += 6;

      this.agregarTablaMiniSolicitudes(solicitudes, this.margin, this.yPosition, 110);
      this.agregarBloqueTextoModern(
        'Solicitudes',
        'Este reporte resume el estado y la distribución de solicitudes. Recomendación: revisar pendientes para priorizar atención.',
        this.margin + 118,
        this.yPosition,
        77
      );

      this.pdfDoc.save('Reporte_Solicitudes.pdf');
      return;

    } catch (error) {
      console.error('Error al generar reporte de solicitudes:', error);
      throw error;
    }
  }

  /**
   * Genera un reporte PDF de puntos de reciclaje
   */
  async generarReportePuntos(
    puntos: PuntoReciclaje[],
    graficoElement: HTMLElement | null
  ): Promise<void> {
    try {
      this.pdfDoc = new jsPDF('p', 'mm', 'a4');
      this.yPosition = this.margin;

      this.agregarPortadaModern('Modern Report', `Puntos de Reciclaje • ${new Date().toLocaleDateString('es-ES')}`);

      if (graficoElement) {
        await this.agregarGraficoEnCaja(
          graficoElement,
          this.margin,
          this.yPosition,
          110,
          78
        );
      } else {
        this.dibujarCajaVacia(this.margin, this.yPosition, 110, 78, 'Vista de mapa no disponible');
      }

      this.agregarResumenModernPuntos(puntos, this.margin + 118, this.yPosition + 6, 77);

      this.yPosition += 86;

      this.dibujarLinea(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
      this.yPosition += 6;

      this.agregarTablaMiniPuntos(puntos, this.margin, this.yPosition, 110);
      this.agregarBloqueTextoModern(
        'Puntos de reciclaje',
        'Este reporte resume cobertura y tipologia de puntos. Recomendacion: priorizar zonas sin cobertura y ampliar puntos con mayor demanda de residuos.',
        this.margin + 118,
        this.yPosition,
        77
      );

      this.pdfDoc.save('Reporte_Puntos_Reciclaje.pdf');
      return;
    } catch (error) {
      console.error('Error al generar reporte de puntos:', error);
      throw error;
    }
  }

  /**
   * Genera un reporte general en un único PDF (usuarios + solicitudes)
   */
  async generarReporteGeneral(
    usuarios: UsuarioModel[],
    solicitudes: SolicitudRecoleccion[],
    graficoUsuarios: HTMLElement | null,
    graficoSolicitudes: HTMLElement | null,
    graficoPendientes: HTMLElement | null,
    kpis: {
      totalUsuarios: number;
      totalSolicitudes: number;
      totalPendientes: number;
      totalPuntos: number;
    }
  ): Promise<void> {
    try {
      this.pdfDoc = new jsPDF('p', 'mm', 'a4');
      this.yPosition = 0;
      const logoDataUrl = await this.cargarLogoComoDataUrl();
      const pendientesSolicitudes = solicitudes.filter(
        (s) => String(s.estadoPeticion || '').toLowerCase() === 'pendiente'
      ).length;

      this.dibujarFondoPaginaReporte();
      this.dibujarCabeceraGeneral('REPORTE GENERAL', 'Resumen integral del panel de administrador', logoDataUrl);

      const fecha = new Date().toLocaleDateString('es-ES');
      this.pdfDoc.setFont('Helvetica', 'normal');
      this.pdfDoc.setFontSize(8);
      this.pdfDoc.setTextColor(this.textGray[0], this.textGray[1], this.textGray[2]);
      this.pdfDoc.text(`Corte de datos: ${fecha}`, this.pageWidth - this.margin - 2, 46, { align: 'right' });

      this.dibujarTarjetasKpi(kpis, 50);

      this.pdfDoc.setDrawColor(200, 220, 210);
      this.pdfDoc.setLineDashPattern([1.5, 1.5], 0);
      this.pdfDoc.line(this.margin, 105, this.pageWidth - this.margin, 105);
      this.pdfDoc.setLineDashPattern([], 0);

      const topChartsY = 112;
      const chartGap = 4;
      const availableWidth = this.pageWidth - this.margin * 2;
      const topChartWidth = (availableWidth - chartGap) / 2;

      await this.dibujarBloqueGrafico(
        'Usuarios pendientes',
        graficoPendientes,
        this.margin,
        topChartsY,
        topChartWidth,
        80,
        `Total pendiente: ${kpis.totalPendientes}. Esto sugiere priorizar validación para reducir tiempos de activación.`
      );
      await this.dibujarBloqueGrafico(
        'Usuarios por localidad',
        graficoUsuarios,
        this.margin + topChartWidth + chartGap,
        topChartsY,
        topChartWidth,
        80,
        `Base analizada: ${kpis.totalUsuarios} usuarios. Un aspecto relevante es la concentración por territorio para enfocar cobertura.`
      );

      const lowerChartY = 196;
      await this.dibujarBloqueGrafico(
        'Solicitudes por localidad',
        graficoSolicitudes,
        this.margin,
        lowerChartY,
        availableWidth,
        82,
        `Solicitudes totales: ${kpis.totalSolicitudes} (pendientes: ${pendientesSolicitudes}). Se puede inferir que la carga operativa debe priorizar localidades de mayor volumen.`
      );

      // Segunda página: tablas de detalle
      this.pdfDoc.addPage();
      this.yPosition = 0;
      this.dibujarFondoPaginaReporte();
      this.dibujarCabeceraGeneral('DETALLE OPERATIVO', 'Muestras de registros para auditoría rápida', logoDataUrl);

      this.agregarTablaMiniUsuarios(usuarios, this.margin, 56, this.pageWidth - this.margin * 2);
      this.agregarTablaMiniSolicitudes(solicitudes, this.margin, 150, this.pageWidth - this.margin * 2);

      this.agregarPiePaginadoYFirma('Firma: Coordinación Administrativa EcoSoftware');

      this.pdfDoc.save('Reporte_General.pdf');
    } catch (error) {
      console.error('Error al generar reporte general:', error);
      throw error;
    }
  }

  private dibujarCabeceraGeneral(titulo: string, subtitulo: string, logoDataUrl: string | null): void {
    if (!this.pdfDoc) return;
    const pdf = this.pdfDoc;

    pdf.setFillColor(20, 110, 71);
    pdf.rect(0, 0, this.pageWidth, 38, 'F');

    if (logoDataUrl) {
      try {
        pdf.addImage(logoDataUrl, 'PNG', this.margin, 7, 35, 20);
      } catch {
        // Si falla el logo, continuar con el resto del diseño.
      }
    }

    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    pdf.text(titulo, this.margin + 38, 19);

    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(subtitulo, this.margin + 38, 28);

    pdf.setFillColor(198, 224, 210);
    pdf.rect(0, 38, this.pageWidth, 4, 'F');
  }

  private dibujarTarjetasKpi(
    kpis: { totalUsuarios: number; totalSolicitudes: number; totalPendientes: number; totalPuntos: number },
    startY: number
  ): void {
    if (!this.pdfDoc) return;
    const pdf = this.pdfDoc;

    const cards = [
      {
        label: 'Usuarios registrados',
        value: kpis.totalUsuarios,
        note: 'Base total de usuarios presentes en la plataforma',
        bg: [255, 255, 255] as [number, number, number],
        bgBottom: [238, 248, 241] as [number, number, number],
        iconBg: [229, 241, 232] as [number, number, number],
        icon: 'people'
      },
      {
        label: 'Solicitudes registradas',
        value: kpis.totalSolicitudes,
        note: 'Volumen consolidado de solicitudes de recolección',
        bg: [255, 255, 255] as [number, number, number],
        bgBottom: [238, 245, 251] as [number, number, number],
        iconBg: [231, 239, 248] as [number, number, number],
        icon: 'clipboard'
      },
      {
        label: 'Usuarios pendientes',
        value: kpis.totalPendientes,
        note: 'Registros que requieren validación administrativa',
        bg: [255, 255, 255] as [number, number, number],
        bgBottom: [241, 248, 239] as [number, number, number],
        iconBg: [232, 242, 229] as [number, number, number],
        icon: 'hourglass'
      },
      {
        label: 'Puntos registrados',
        value: kpis.totalPuntos,
        note: 'Cobertura actual de puntos de reciclaje en el sistema',
        bg: [255, 255, 255] as [number, number, number],
        bgBottom: [238, 249, 248] as [number, number, number],
        iconBg: [228, 244, 242] as [number, number, number],
        icon: 'geo'
      }
    ];

    const gap = 5;
    const cardW = (this.pageWidth - this.margin * 2 - gap * 3) / 4;
    const cardH = 48;

    cards.forEach((card, index) => {
      const x = this.margin + index * (cardW + gap);

      // Sombra sutil para emular la tarjeta del panel.
      pdf.setFillColor(219, 229, 223);
      pdf.roundedRect(x + 1, startY + 1.2, cardW, cardH, 2, 2, 'F');

      // Tarjeta tipo panel: base blanca + degradado inferior suave por categoría.
      pdf.setFillColor(card.bg[0], card.bg[1], card.bg[2]);
      pdf.setDrawColor(220, 232, 222);
      pdf.roundedRect(x, startY, cardW, cardH, 2, 2, 'FD');
      pdf.setFillColor(card.bgBottom[0], card.bgBottom[1], card.bgBottom[2]);
      pdf.rect(x + 0.6, startY + cardH * 0.45, cardW - 1.2, cardH * 0.52, 'F');

      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(7.2);
      pdf.setTextColor(40, 50, 45);
      pdf.text(card.label, x + 3, startY + 8);

      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(17);
      pdf.setTextColor(18, 59, 29);
      pdf.text(String(card.value), x + 3, startY + 22);

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(5.6);
      pdf.setTextColor(50, 65, 58);
      const noteLines = pdf.splitTextToSize(card.note, cardW - 6);
      pdf.text(noteLines, x + 3, startY + 31);
    });
  }

  private async dibujarBloqueGrafico(
    titulo: string,
    chartElement: HTMLElement | null,
    x: number,
    y: number,
    w: number,
    h: number,
    resumen: string
  ): Promise<void> {
    if (!this.pdfDoc) return;
    const pdf = this.pdfDoc;

    // Sombra y tarjeta blanca para que la gráfica sobresalga del fondo gris.
    pdf.setFillColor(221, 229, 225);
    pdf.roundedRect(x + 1, y + 1.2, w, h, 2, 2, 'F');

    pdf.setDrawColor(198, 218, 206);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, w, h, 2, 2, 'FD');

    pdf.setFillColor(248, 250, 249);
    pdf.rect(x, y, w, 11, 'F');

    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(20, 60, 40);
    pdf.text(titulo, x + 4, y + 7.5);

    const resumenH = 14;
    const chartY = y + 10;
    const chartH = h - 12 - resumenH;

    if (chartElement) {
      await this.agregarGraficoEnCaja(chartElement, x + 3, chartY, w - 6, chartH);
    } else {
      this.dibujarCajaVacia(x + 3, chartY, w - 6, chartH, 'Gráfico no disponible');
    }

    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(45, 60, 54);
    const resumenLineas = pdf.splitTextToSize(resumen, w - 6);
    pdf.text(resumenLineas, x + 3, y + h - 9);
  }

  private async cargarLogoComoDataUrl(): Promise<string | null> {
    try {
      const response = await fetch(this.logoPath);
      if (!response.ok) return null;

      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('No fue posible leer el logo.'));
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  private dibujarFondoPaginaReporte(): void {
    if (!this.pdfDoc) return;
    this.pdfDoc.setFillColor(240, 244, 242);
    this.pdfDoc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
  }

  private agregarPiePaginadoYFirma(firma: string): void {
    if (!this.pdfDoc) return;

    const pdf = this.pdfDoc;
    const totalPages = pdf.getNumberOfPages();

    // Pie de página en todas las páginas
    for (let page = 1; page <= totalPages; page++) {
      pdf.setPage(page);

      pdf.setDrawColor(198, 218, 206);
      pdf.setLineWidth(0.4);
      pdf.line(this.margin, this.pageHeight - 18, this.pageWidth - this.margin, this.pageHeight - 18);

      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(95, 108, 102);
      pdf.text(`Página ${page} de ${totalPages}`, this.pageWidth - this.margin, this.pageHeight - 12, { align: 'right' });
      pdf.text(`EcoSoftware • ${new Date().toLocaleDateString('es-ES')}`, this.margin, this.pageHeight - 12);
    }

    // Firma solo en última página
    pdf.setPage(totalPages);
    
    // Texto de firma simplificado
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(20, 60, 40);
    pdf.text('Coordinación Administrativa - EcoSoftware', this.margin, this.pageHeight - 28);
  }

  private agregarPortadaModern(titulo: string, subtitulo: string): void {
    if (!this.pdfDoc) return;

    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setFontSize(36);
    this.pdfDoc.setTextColor(this.accentBlue[0], this.accentBlue[1], this.accentBlue[2]);
    this.pdfDoc.text(titulo, this.margin, this.yPosition + 10);

    this.pdfDoc.setDrawColor(this.lineColor[0], this.lineColor[1], this.lineColor[2]);
    this.pdfDoc.setLineWidth(1);
    this.pdfDoc.line(this.margin, this.yPosition + 16, this.pageWidth - this.margin, this.yPosition + 16);

    this.pdfDoc.setFontSize(10);
    this.pdfDoc.setTextColor(this.textGray[0], this.textGray[1], this.textGray[2]);
    this.pdfDoc.text(subtitulo, this.pageWidth - this.margin, this.yPosition + 22, { align: 'right' });

    this.yPosition += 30;
  }

  private dibujarLinea(x1: number, y1: number, x2: number, y2: number): void {
    if (!this.pdfDoc) return;
    this.pdfDoc.setDrawColor(this.lineColor[0], this.lineColor[1], this.lineColor[2]);
    this.pdfDoc.setLineWidth(0.6);
    this.pdfDoc.line(x1, y1, x2, y2);
  }

  private dibujarCajaVacia(x: number, y: number, w: number, h: number, texto: string): void {
    if (!this.pdfDoc) return;
    this.pdfDoc.setFillColor(this.lightBg[0], this.lightBg[1], this.lightBg[2]);
    this.pdfDoc.setDrawColor(220, 220, 220);
    this.pdfDoc.rect(x, y, w, h, 'FD');
    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setFontSize(10);
    this.pdfDoc.setTextColor(this.textGray[0], this.textGray[1], this.textGray[2]);
    this.pdfDoc.text(texto, x + w / 2, y + h / 2, { align: 'center' });
  }

  private async agregarGraficoEnCaja(elemento: HTMLElement, x: number, y: number, w: number, h: number): Promise<void> {
    if (!this.pdfDoc) return;
    try {
      const canvas = await html2canvas(elemento, {
        scale: 0.8,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.65);
      this.pdfDoc.setFillColor(255, 255, 255);
      this.pdfDoc.setDrawColor(220, 220, 220);
      this.pdfDoc.rect(x, y, w, h, 'FD');

      // Ajustar imagen dentro del contenedor preservando ratio
      const padding = 4;
      const maxW = w - padding * 2;
      const maxH = h - padding * 2;
      const imgW = maxW;
      const imgH = (canvas.height * imgW) / canvas.width;
      const finalH = Math.min(imgH, maxH);
      const finalW = (canvas.width * finalH) / canvas.height;

      const imgX = x + (w - finalW) / 2;
      const imgY = y + (h - finalH) / 2;

      this.pdfDoc.addImage(imgData, 'JPEG', imgX, imgY, finalW, finalH);
    } catch {
      this.dibujarCajaVacia(x, y, w, h, 'No se pudo capturar el gráfico');
    }
  }

  private agregarEncabezadoSeccionModern(titulo: string, x: number, y: number): number {
    if (!this.pdfDoc) return y;
    this.pdfDoc.setFont('Helvetica', 'bold');
    this.pdfDoc.setFontSize(13);
    this.pdfDoc.setTextColor(this.accentNavy[0], this.accentNavy[1], this.accentNavy[2]);
    this.pdfDoc.text(titulo, x, y);
    return y + 6;
  }

  private agregarBloqueTextoModern(titulo: string, texto: string, x: number, y: number, w: number): void {
    if (!this.pdfDoc) return;
    let yy = this.agregarEncabezadoSeccionModern(titulo, x, y + 6);
    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setFontSize(9.5);
    this.pdfDoc.setTextColor(this.textGray[0], this.textGray[1], this.textGray[2]);
    const lines = this.pdfDoc.splitTextToSize(texto, w);
    this.pdfDoc.text(lines, x, yy);
  }

  private agregarResumenModernUsuarios(usuarios: UsuarioModel[], x: number, y: number, w: number): void {
    if (!this.pdfDoc) return;

    const total = usuarios.length;
    const admins = usuarios.filter(u => u.rol === 'administrador' || u.rol === 'Administrador' || u.rolId === 1).length;
    const ciudadanos = usuarios.filter(u => u.rol === 'ciudadano' || u.rol === 'Ciudadano' || u.rolId === 2).length;

    let yy = this.agregarEncabezadoSeccionModern('Usuarios', x, y);

    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setFontSize(10);
    this.pdfDoc.setTextColor(this.textGray[0], this.textGray[1], this.textGray[2]);
    const lines = [
      `Total: ${total}`,
      `Administradores: ${admins}`,
      `Ciudadanos: ${ciudadanos}`
    ];
    this.pdfDoc.text(lines, x, yy);
  }

  private agregarResumenModernSolicitudes(solicitudes: SolicitudRecoleccion[], x: number, y: number, w: number): void {
    if (!this.pdfDoc) return;

    const total = solicitudes.length;
    const pendientes = solicitudes.filter(s => String(s.estadoPeticion || '').toLowerCase() === 'pendiente').length;
    const aceptadas = solicitudes.filter(s => String(s.estadoPeticion || '').toLowerCase() === 'aceptada' || String(s.estadoPeticion || '').toLowerCase() === 'aceptado').length;

    let yy = this.agregarEncabezadoSeccionModern('Solicitudes', x, y);
    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setFontSize(10);
    this.pdfDoc.setTextColor(this.textGray[0], this.textGray[1], this.textGray[2]);
    const lines = [
      `Total: ${total}`,
      `Pendientes: ${pendientes}`,
      `Aceptadas: ${aceptadas}`
    ];
    this.pdfDoc.text(lines, x, yy);
  }

  private agregarResumenModernPuntos(puntos: PuntoReciclaje[], x: number, y: number, w: number): void {
    if (!this.pdfDoc) return;

    const total = puntos.length;
    const conHorario = puntos.filter((p) => String(p.horario || '').trim().length > 0).length;
    const tipos = new Set(
      puntos
        .map((p) => String(p.tipoResiduo || p.tipo_residuo || '').trim().toLowerCase())
        .filter((t) => t.length > 0)
    ).size;

    const yy = this.agregarEncabezadoSeccionModern('Puntos', x, y);

    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setFontSize(10);
    this.pdfDoc.setTextColor(this.textGray[0], this.textGray[1], this.textGray[2]);
    const lines = [
      `Total: ${total}`,
      `Con horario: ${conHorario}`,
      `Tipos de residuo: ${tipos}`
    ];
    this.pdfDoc.text(lines, x, yy);
  }

  private agregarTablaMiniPuntos(puntos: PuntoReciclaje[], x: number, y: number, w: number): void {
    if (!this.pdfDoc) return;
    const rows = puntos.slice(0, 7);
    let yy = this.agregarEncabezadoSeccionModern('Listado (muestra)', x, y + 6);

    const colW = [34, 48, 28];
    const headers = ['Nombre', 'Direccion', 'Tipo'];
    const rowH = 6;

    this.pdfDoc.setFillColor(this.accentBlue[0], this.accentBlue[1], this.accentBlue[2]);
    this.pdfDoc.setTextColor(255, 255, 255);
    this.pdfDoc.setFont('Helvetica', 'bold');
    this.pdfDoc.setFontSize(9);
    this.pdfDoc.rect(x, yy, w, rowH, 'F');
    let xx = x;
    for (let i = 0; i < headers.length; i++) {
      this.pdfDoc.text(headers[i], xx + 2, yy + 4);
      xx += colW[i];
    }
    yy += rowH;

    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setTextColor(this.textGray[0], this.textGray[1], this.textGray[2]);
    for (let r = 0; r < rows.length; r++) {
      if (r % 2 === 1) {
        this.pdfDoc.setFillColor(this.lightBg[0], this.lightBg[1], this.lightBg[2]);
        this.pdfDoc.rect(x, yy, w, rowH, 'F');
      }
      const row = rows[r];
      const c1 = String(row.nombre || '-').slice(0, 16);
      const c2 = String(row.direccion || '-').slice(0, 22);
      const c3 = String(row.tipoResiduo || row.tipo_residuo || 'General').slice(0, 14);
      this.pdfDoc.text(c1, x + 2, yy + 4);
      this.pdfDoc.text(c2, x + 2 + colW[0], yy + 4);
      this.pdfDoc.text(c3, x + 2 + colW[0] + colW[1], yy + 4);
      yy += rowH;
    }
  }

  private agregarTablaMiniUsuarios(usuarios: UsuarioModel[], x: number, y: number, w: number): void {
    if (!this.pdfDoc) return;
    const rows = usuarios.slice(0, 7);
    let yy = this.agregarEncabezadoSeccionModern('Listado (muestra)', x, y + 6);

    const colW = [38, 52, 20];
    const headers = ['Nombre', 'Correo', 'Rol'];
    const rowH = 6;

    this.pdfDoc.setFillColor(this.accentBlue[0], this.accentBlue[1], this.accentBlue[2]);
    this.pdfDoc.setTextColor(255, 255, 255);
    this.pdfDoc.setFont('Helvetica', 'bold');
    this.pdfDoc.setFontSize(9);
    this.pdfDoc.rect(x, yy, w, rowH, 'F');
    let xx = x;
    for (let i = 0; i < headers.length; i++) {
      this.pdfDoc.text(headers[i], xx + 2, yy + 4);
      xx += colW[i];
    }
    yy += rowH;

    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setTextColor(this.textGray[0], this.textGray[1], this.textGray[2]);
    for (let r = 0; r < rows.length; r++) {
      if (r % 2 === 1) {
        this.pdfDoc.setFillColor(this.lightBg[0], this.lightBg[1], this.lightBg[2]);
        this.pdfDoc.rect(x, yy, w, rowH, 'F');
      }
      const row = rows[r];
      const c1 = (row.nombre || '-').toString().slice(0, 18);
      const c2 = (row.correo || '-').toString().slice(0, 26);
      const c3 = (row.rol || row.rolId || '-').toString().slice(0, 10);
      this.pdfDoc.text(c1, x + 2, yy + 4);
      this.pdfDoc.text(c2, x + 2 + colW[0], yy + 4);
      this.pdfDoc.text(c3, x + 2 + colW[0] + colW[1], yy + 4);
      yy += rowH;
    }
  }

  private agregarTablaMiniSolicitudes(solicitudes: SolicitudRecoleccion[], x: number, y: number, w: number): void {
    if (!this.pdfDoc) return;
    const rows = solicitudes.slice(0, 7);
    let yy = this.agregarEncabezadoSeccionModern('Listado (muestra)', x, y + 6);

    const colW = [18, 40, 30, 22];
    const headers = ['ID', 'Residuo', 'Estado', 'Fecha'];
    const rowH = 6;

    this.pdfDoc.setFillColor(this.accentBlue[0], this.accentBlue[1], this.accentBlue[2]);
    this.pdfDoc.setTextColor(255, 255, 255);
    this.pdfDoc.setFont('Helvetica', 'bold');
    this.pdfDoc.setFontSize(9);
    this.pdfDoc.rect(x, yy, w, rowH, 'F');
    let xx = x;
    for (let i = 0; i < headers.length; i++) {
      this.pdfDoc.text(headers[i], xx + 2, yy + 4);
      xx += colW[i];
    }
    yy += rowH;

    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setTextColor(this.textGray[0], this.textGray[1], this.textGray[2]);
    for (let r = 0; r < rows.length; r++) {
      if (r % 2 === 1) {
        this.pdfDoc.setFillColor(this.lightBg[0], this.lightBg[1], this.lightBg[2]);
        this.pdfDoc.rect(x, yy, w, rowH, 'F');
      }
      const row = rows[r];
      const id = (row.idSolicitud || '-').toString().slice(0, 6);
      const residuo = (row.tipoResiduo || '-').toString().slice(0, 16);
      const estado = (row.estadoPeticion || '-').toString().slice(0, 12);
      const fecha = String(row.fechaCreacionSolicitud || row.fechaProgramada || '-').slice(0, 10);
      this.pdfDoc.text(id, x + 2, yy + 4);
      this.pdfDoc.text(residuo, x + 2 + colW[0], yy + 4);
      this.pdfDoc.text(estado, x + 2 + colW[0] + colW[1], yy + 4);
      this.pdfDoc.text(fecha, x + 2 + colW[0] + colW[1] + colW[2], yy + 4);
      yy += rowH;
    }
  }

  /**
   * Agrega un título al PDF
   */
  private agregarTitulo(texto: string): void {
    if (!this.pdfDoc) return;
    this.pdfDoc.setFontSize(20);
    this.pdfDoc.setFont('Helvetica', 'bold');
    this.pdfDoc.setTextColor(25, 135, 84); // Verde principal
    this.pdfDoc.text(texto, this.pageWidth / 2, this.yPosition, { align: 'center' });
    this.yPosition += 15;
  }

  /**
   * Agrega un texto al PDF
   */
  private agregarTexto(texto: string, fontSize: number = 11, gris: boolean = false): void {
    if (!this.pdfDoc) return;
    this.pdfDoc.setFontSize(fontSize);
    this.pdfDoc.setFont('Helvetica', gris ? 'normal' : 'bold');
    this.pdfDoc.setTextColor(gris ? 100 : 0, gris ? 100 : 0, gris ? 100 : 0);
    this.pdfDoc.text(texto, this.margin, this.yPosition);
    this.yPosition += 7;
  }

  /**
   * Agrega un gráfico al PDF capturando el elemento HTML
   */
  private async agregarGrafico(elemento: HTMLElement, titulo: string): Promise<void> {
    if (!this.pdfDoc) return;

    try {
      // Capturar el gráfico como canvas primero (para calcular altura)
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = this.pageWidth - 2 * this.margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Altura estimada del título (en mm)
      const titleFontSize = 12;
      const titleLineHeight = 6; // mm
      const neededHeight = titleLineHeight + imgHeight + 5;

      // Si no hay espacio suficiente para título+imagen, agregar página antes
      if (this.yPosition + neededHeight > this.pageHeight - this.margin) {
        this.pdfDoc.addPage();
        this.yPosition = this.margin;
      }

      // Agregar título del gráfico
      this.pdfDoc.setFontSize(titleFontSize);
      this.pdfDoc.setFont('Helvetica', 'bold');
      this.pdfDoc.setTextColor(25, 135, 84);
      this.pdfDoc.text(titulo, this.margin, this.yPosition);
      this.yPosition += titleLineHeight;

      // Agregar la imagen del gráfico
      this.pdfDoc.addImage(imgData, 'PNG', this.margin, this.yPosition, imgWidth, imgHeight);
      this.yPosition += imgHeight + 5;
    } catch (error) {
      console.error('Error al capturar gráfico:', error);
      // Continuar sin el gráfico
    }
  }

  /**
   * Agrega estadísticas de usuarios
   */
  private agregarSeccionEstadisticas(usuarios: UsuarioModel[]): void {
    if (!this.pdfDoc) return;

    // Verificar espacio
    if (this.yPosition + 50 > this.pageHeight - this.margin) {
      this.pdfDoc.addPage();
      this.yPosition = this.margin;
    }

    // Título de sección
    this.pdfDoc.setFontSize(14);
    this.pdfDoc.setFont('Helvetica', 'bold');
    this.pdfDoc.setTextColor(25, 135, 84);
    this.pdfDoc.text('ESTADÍSTICAS GENERALES', this.margin, this.yPosition);
    this.yPosition += 12;

    // Calcular estadísticas
    const totalUsuarios = usuarios.length;
    const administradores = usuarios.filter(u => u.rol === 'administrador' || u.rol === 'Administrador' || u.rolId === 1).length;
    const ciudadanos = usuarios.filter(u => u.rol === 'ciudadano' || u.rol === 'Ciudadano' || u.rolId === 2).length;
    const recicladores = usuarios.filter(u => u.rol === 'reciclador' || u.rol === 'Reciclador' || u.rolId === 3).length;
    const empresas = usuarios.filter(u => u.rol === 'empresa' || u.rol === 'Empresa' || u.rolId === 4).length;

    // Mostrar estadísticas en cajas mejoradas
    this.pdfDoc.setFontSize(11);
    this.pdfDoc.setFont('Helvetica', 'normal');

    const stats = [
      { label: 'Total de Usuarios', valor: totalUsuarios, color: [25, 135, 84] },
      { label: 'Administradores', valor: administradores, color: [52, 73, 94] },
      { label: 'Ciudadanos', valor: ciudadanos, color: [41, 128, 185] },
      { label: 'Recicladores', valor: recicladores, color: [39, 174, 96] },
      { label: 'Empresas', valor: empresas, color: [230, 126, 34] }
    ];

    const itemsPerRow = 2;
    const boxGap = 4;
    const boxWidth = (this.pageWidth - 2 * this.margin - (itemsPerRow - 1) * boxGap) / itemsPerRow;
    let xPos = this.margin;
    let col = 0;
    const boxHeight = 18;

    for (let i = 0; i < stats.length; i++) {
      // Si no cabe la caja actual en la página, agregar nueva página
      if (this.yPosition + boxHeight > this.pageHeight - this.margin) {
        this.pdfDoc.addPage();
        this.yPosition = this.margin;

        // Re-dibujar título de sección en nueva página
        this.pdfDoc.setFontSize(14);
        this.pdfDoc.setFont('Helvetica', 'bold');
        this.pdfDoc.setTextColor(25, 135, 84);
        this.pdfDoc.text('ESTADÍSTICAS GENERALES', this.margin, this.yPosition);
        this.yPosition += 12;
      }

      // Dibujar caja con color
      this.pdfDoc.setDrawColor(stats[i].color[0], stats[i].color[1], stats[i].color[2]);
      this.pdfDoc.setFillColor(stats[i].color[0], stats[i].color[1], stats[i].color[2]);
      this.pdfDoc.rect(xPos, this.yPosition - 10, boxWidth, boxHeight, 'F');

      // Borde de la caja
      this.pdfDoc.setDrawColor(stats[i].color[0], stats[i].color[1], stats[i].color[2]);
      this.pdfDoc.rect(xPos, this.yPosition - 10, boxWidth, boxHeight);

      // Texto blanco en la caja
      this.pdfDoc.setFontSize(9);
      this.pdfDoc.setFont('Helvetica', 'normal');
      this.pdfDoc.setTextColor(255, 255, 255);
      const labelLines = this.pdfDoc.splitTextToSize(stats[i].label, boxWidth - 6);
      for (let li = 0; li < labelLines.length; li++) {
        this.pdfDoc.text(labelLines[li], xPos + 3, this.yPosition - 6 + li * 4);
      }

      this.pdfDoc.setFontSize(16);
      this.pdfDoc.setFont('Helvetica', 'bold');
      this.pdfDoc.text(stats[i].valor.toString(), xPos + boxWidth - 4, this.yPosition + 4, { align: 'right' });

      xPos += boxWidth + boxGap;
      col++;

      if (col >= itemsPerRow) {
        col = 0;
        xPos = this.margin;
        this.yPosition += boxHeight + 6;
      }
    }

    // Si la última fila quedó incompleta, ajustar Y
    if (col !== 0) this.yPosition += boxHeight + 6;
  }

  /**
   * Agrega estadísticas de solicitudes
   */
  private agregarSeccionEstadisticasSolicitudes(solicitudes: SolicitudRecoleccion[]): void {
    if (!this.pdfDoc) return;

    // Verificar espacio
    if (this.yPosition + 50 > this.pageHeight - this.margin) {
      this.pdfDoc.addPage();
      this.yPosition = this.margin;
    }

    // Título de sección
    this.pdfDoc.setFontSize(14);
    this.pdfDoc.setFont('Helvetica', 'bold');
    this.pdfDoc.setTextColor(25, 135, 84);
    this.pdfDoc.text('ESTADÍSTICAS GENERALES', this.margin, this.yPosition);
    this.yPosition += 12;

    // Calcular estadísticas
    const totalSolicitudes = solicitudes.length;
    const pendientes = solicitudes.filter(s => 
      s.estadoPeticion === 'Pendiente' || 
      String(s.estadoPeticion).toLowerCase() === 'pendiente'
    ).length;
    const aceptadas = solicitudes.filter(s => 
      s.estadoPeticion === 'Aceptada' || 
      String(s.estadoPeticion).toLowerCase() === 'aceptada'
    ).length;
    const rechazadas = solicitudes.filter(s => 
      s.estadoPeticion === 'Rechazada' || 
      String(s.estadoPeticion).toLowerCase() === 'rechazada'
    ).length;

    // Mostrar estadísticas en cajas mejoradas
    this.pdfDoc.setFontSize(11);
    this.pdfDoc.setFont('Helvetica', 'normal');

    const stats = [
      { label: 'Total de Solicitudes', valor: totalSolicitudes, color: [25, 135, 84] },
      { label: 'Pendientes', valor: pendientes, color: [241, 196, 15] },
      { label: 'Aceptadas', valor: aceptadas, color: [39, 174, 96] },
      { label: 'Rechazadas', valor: rechazadas, color: [231, 76, 60] }
    ];

    const itemsPerRow = 2;
    const boxGap = 4;
    const boxWidth = (this.pageWidth - 2 * this.margin - (itemsPerRow - 1) * boxGap) / itemsPerRow;
    let xPos = this.margin;
    let col = 0;
    const boxHeight = 18;

    for (let i = 0; i < stats.length; i++) {
      // Si no cabe la caja actual en la página, agregar nueva página
      if (this.yPosition + boxHeight > this.pageHeight - this.margin) {
        this.pdfDoc.addPage();
        this.yPosition = this.margin;

        // Re-dibujar título de sección en nueva página
        this.pdfDoc.setFontSize(14);
        this.pdfDoc.setFont('Helvetica', 'bold');
        this.pdfDoc.setTextColor(25, 135, 84);
        this.pdfDoc.text('ESTADÍSTICAS GENERALES', this.margin, this.yPosition);
        this.yPosition += 12;
      }

      // Dibujar caja con color
      this.pdfDoc.setDrawColor(stats[i].color[0], stats[i].color[1], stats[i].color[2]);
      this.pdfDoc.setFillColor(stats[i].color[0], stats[i].color[1], stats[i].color[2]);
      this.pdfDoc.rect(xPos, this.yPosition - 10, boxWidth, boxHeight, 'F');

      // Borde de la caja
      this.pdfDoc.setDrawColor(stats[i].color[0], stats[i].color[1], stats[i].color[2]);
      this.pdfDoc.rect(xPos, this.yPosition - 10, boxWidth, boxHeight);

      // Texto blanco en la caja
      this.pdfDoc.setFontSize(9);
      this.pdfDoc.setFont('Helvetica', 'normal');
      this.pdfDoc.setTextColor(255, 255, 255);
      const labelLines = this.pdfDoc.splitTextToSize(stats[i].label, boxWidth - 6);
      for (let li = 0; li < labelLines.length; li++) {
        this.pdfDoc.text(labelLines[li], xPos + 3, this.yPosition - 6 + li * 4);
      }

      this.pdfDoc.setFontSize(16);
      this.pdfDoc.setFont('Helvetica', 'bold');
      this.pdfDoc.text(stats[i].valor.toString(), xPos + boxWidth - 4, this.yPosition + 4, { align: 'right' });

      xPos += boxWidth + boxGap;
      col++;

      if (col >= itemsPerRow) {
        col = 0;
        xPos = this.margin;
        this.yPosition += boxHeight + 6;
      }
    }

    if (col !== 0) this.yPosition += boxHeight + 6;
  }

  /**
   * Agrega tabla de usuarios - TODOS LOS REGISTROS
   */
  private agregarSeccionTablaUsuarios(usuarios: UsuarioModel[]): void {
    if (!this.pdfDoc) return;

    // Nueva página para la tabla
    this.pdfDoc.addPage();
    this.yPosition = this.margin;

    // Título de sección
    this.pdfDoc.setFontSize(14);
    this.pdfDoc.setFont('Helvetica', 'bold');
    this.pdfDoc.setTextColor(25, 135, 84);
    this.pdfDoc.text('LISTADO DE USUARIOS', this.margin, this.yPosition);
    this.yPosition += 8;

    // Resumen de registros
    this.pdfDoc.setFontSize(10);
    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setTextColor(100, 100, 100);
    this.pdfDoc.text(`Total de registros: ${usuarios.length}`, this.margin, this.yPosition);
    this.yPosition += 8;

    // Preparar datos para tabla - SIN LÍMITE
    const tableData: (string | number)[][] = usuarios.map(usuario => [
      usuario.nombre || '-',
      usuario.correo || '-',
      usuario.cedula || '-',
      usuario.telefono || '-',
      usuario.rol || usuario.rolId || '-'
    ]);

    // Configurar tabla
    this.pdfDoc.setFontSize(9);
    const columns = ['Nombre', 'Correo', 'Cédula', 'Teléfono', 'Rol'];
    const columnWidths = [32, 38, 28, 32, 20];

    // Encabezados - Mejorados con wrapping si el texto es largo
    this.pdfDoc.setFont('Helvetica', 'bold');
    this.pdfDoc.setTextColor(255, 255, 255);
    this.pdfDoc.setFillColor(25, 135, 84);

    const headerLineHeight = 4; // mm por línea
    const headerLinesArr = columns.map((c, i) => (this.pdfDoc!).splitTextToSize(c, columnWidths[i] - 4));
    const maxHeaderLines = Math.max(...headerLinesArr.map(a => a.length));
    const headerHeight = maxHeaderLines * headerLineHeight + 4;

    // Dibujar fondo del encabezado con altura dinámica
    const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
    this.pdfDoc.rect(this.margin, this.yPosition, totalWidth, headerHeight, 'F');

    let xPos = this.margin;
    for (let i = 0; i < columns.length; i++) {
      const lines = headerLinesArr[i];
      for (let li = 0; li < lines.length; li++) {
        this.pdfDoc.text(lines[li], xPos + 2, this.yPosition + 3 + li * headerLineHeight);
      }
      xPos += columnWidths[i];
    }
    this.yPosition += headerHeight + 3;

    // Filas con alternancia de colores
    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setTextColor(0, 0, 0);
    let rowNumber = 0;

    for (const row of tableData) {
      if (this.yPosition + 7 > this.pageHeight - this.margin) {
        this.pdfDoc.addPage();
        this.yPosition = this.margin;

        // Repetir encabezados en nueva página usando la misma lógica de wrapping
        this.pdfDoc.setFont('Helvetica', 'bold');
        this.pdfDoc.setTextColor(255, 255, 255);
        this.pdfDoc.setFillColor(25, 135, 84);

        const headerLineHeightRpt = 4;
        const headerLinesArrRpt = columns.map((c, i) => (this.pdfDoc!).splitTextToSize(c, columnWidths[i] - 4));
        const maxHeaderLinesRpt = Math.max(...headerLinesArrRpt.map(a => a.length));
        const headerHeightRpt = maxHeaderLinesRpt * headerLineHeightRpt + 4;

        const totalWidthRepeat = columnWidths.reduce((a, b) => a + b, 0);
        this.pdfDoc.rect(this.margin, this.yPosition, totalWidthRepeat, headerHeightRpt, 'F');

        let xPos = this.margin;
        for (let i = 0; i < columns.length; i++) {
          const lines = headerLinesArrRpt[i];
          for (let li = 0; li < lines.length; li++) {
            this.pdfDoc.text(lines[li], xPos + 2, this.yPosition + 3 + li * headerLineHeightRpt);
          }
          xPos += columnWidths[i];
        }
        this.yPosition += headerHeightRpt + 3;
        this.pdfDoc.setFont('Helvetica', 'normal');
        this.pdfDoc.setTextColor(0, 0, 0);
      }

      // Fondo alterno para mejor legibilidad (usar ancho total de la tabla)
      if (rowNumber % 2 === 1) {
        this.pdfDoc.setFillColor(240, 245, 242);
        const totalRowWidth = columnWidths.reduce((a, b) => a + b, 0);
        this.pdfDoc.rect(this.margin, this.yPosition - 6, totalRowWidth, 7, 'F');
      }

      xPos = this.margin;
      this.pdfDoc.setTextColor(0, 0, 0);
      for (let i = 0; i < row.length; i++) {
        const text = String(row[i]).substring(0, 22);
        this.pdfDoc.text(text, xPos + 2, this.yPosition - 1);
        xPos += columnWidths[i];
      }
      this.yPosition += 7;
      rowNumber++;
    }
  }

  /**
   * Agrega tabla de solicitudes
   */
  private agregarSeccionTablaSolicitudes(solicitudes: SolicitudRecoleccion[]): void {
    if (!this.pdfDoc) return;

    // Nueva página para la tabla
    this.pdfDoc.addPage();
    this.yPosition = this.margin;

    // Título de sección
    this.pdfDoc.setFontSize(14);
    this.pdfDoc.setFont('Helvetica', 'bold');
    this.pdfDoc.setTextColor(25, 135, 84);
    this.pdfDoc.text('LISTADO DE SOLICITUDES', this.margin, this.yPosition);
    this.yPosition += 8;

    // Resumen de registros
    this.pdfDoc.setFontSize(10);
    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setTextColor(100, 100, 100);
    this.pdfDoc.text(`Total de registros: ${solicitudes.length}`, this.margin, this.yPosition);
    this.yPosition += 8;

    // Preparar datos para tabla - SIN LÍMITE
    const tableData: (string | number)[][] = solicitudes.map(solicitud => [
      solicitud.idSolicitud || '-',
      solicitud.usuarioId || '-',
      solicitud.tipoResiduo || '-',
      solicitud.estadoPeticion || '-',
      solicitud.fechaCreacionSolicitud || solicitud.fechaProgramada || '-'
    ]);

    // Configurar tabla con encabezados descriptivos
    this.pdfDoc.setFontSize(9);
    const columns = ['ID', 'Usuario ID', 'Tipo Residuo', 'Estado', 'Fecha'];
    const columnWidths = [18, 24, 32, 30, 36];

    // Encabezados - Mejorados con wrapping si el texto es largo
    this.pdfDoc.setFont('Helvetica', 'bold');
    this.pdfDoc.setTextColor(255, 255, 255);
    this.pdfDoc.setFillColor(25, 135, 84);

    const headerLineHeight = 4; // mm por línea
    const headerLinesArr = columns.map((c, i) => (this.pdfDoc!).splitTextToSize(c, columnWidths[i] - 4));
    const maxHeaderLines = Math.max(...headerLinesArr.map(a => a.length));
    const headerHeight = maxHeaderLines * headerLineHeight + 4;

    // Dibujar fondo del encabezado con altura dinámica
    const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
    this.pdfDoc.rect(this.margin, this.yPosition, totalWidth, headerHeight, 'F');

    let xPos = this.margin;
    for (let i = 0; i < columns.length; i++) {
      const lines = headerLinesArr[i];
      for (let li = 0; li < lines.length; li++) {
        this.pdfDoc.text(lines[li], xPos + 2, this.yPosition + 3 + li * headerLineHeight);
      }
      xPos += columnWidths[i];
    }
    this.yPosition += headerHeight + 3;

    // Filas con alternancia de colores
    this.pdfDoc.setFont('Helvetica', 'normal');
    this.pdfDoc.setTextColor(0, 0, 0);
    let rowNumber = 0;

    for (const row of tableData) {
      if (this.yPosition + 7 > this.pageHeight - this.margin) {
        this.pdfDoc.addPage();
        this.yPosition = this.margin;

        // Repetir encabezados en nueva página usando la misma lógica de wrapping
        this.pdfDoc.setFont('Helvetica', 'bold');
        this.pdfDoc.setTextColor(255, 255, 255);
        this.pdfDoc.setFillColor(25, 135, 84);

        const headerLineHeightRpt = 4;
        const headerLinesArrRpt = columns.map((c, i) => (this.pdfDoc!).splitTextToSize(c, columnWidths[i] - 4));
        const maxHeaderLinesRpt = Math.max(...headerLinesArrRpt.map(a => a.length));
        const headerHeightRpt = maxHeaderLinesRpt * headerLineHeightRpt + 4;

        const totalWidthRepeat = columnWidths.reduce((a, b) => a + b, 0);
        this.pdfDoc.rect(this.margin, this.yPosition, totalWidthRepeat, headerHeightRpt, 'F');

        let xPos = this.margin;
        for (let i = 0; i < columns.length; i++) {
          const lines = headerLinesArrRpt[i];
          for (let li = 0; li < lines.length; li++) {
            this.pdfDoc.text(lines[li], xPos + 2, this.yPosition + 3 + li * headerLineHeightRpt);
          }
          xPos += columnWidths[i];
        }
        this.yPosition += headerHeightRpt + 3;
        this.pdfDoc.setFont('Helvetica', 'normal');
        this.pdfDoc.setTextColor(0, 0, 0);
      }

      // Fondo alterno para mejor legibilidad (usar ancho total de la tabla)
      if (rowNumber % 2 === 1) {
        this.pdfDoc.setFillColor(240, 245, 242);
        const totalRowWidth = columnWidths.reduce((a, b) => a + b, 0);
        this.pdfDoc.rect(this.margin, this.yPosition - 6, totalRowWidth, 7, 'F');
      }

      xPos = this.margin;
      this.pdfDoc.setTextColor(0, 0, 0);
      for (let i = 0; i < row.length; i++) {
        const text = String(row[i]).substring(0, 18);
        this.pdfDoc.text(text, xPos + 2, this.yPosition - 1);
        xPos += columnWidths[i];
      }
      this.yPosition += 7;
      rowNumber++;
    }
  }

  /**
   * Dibuja iconos para las tarjetas KPI
   */
  private dibujarIconoKpi(pdf: jsPDF, iconType: string, x: number, y: number, size: number): void {
    const color = [31, 122, 80]; // color verde
    
    switch (iconType) {
      case 'people':
        // Icono de dos personas
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(size);
        pdf.text('👥', x, y, { align: 'center' });
        break;
        
      case 'clipboard':
        // Icono de clipboard/documento
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(size);
        pdf.text('📋', x, y, { align: 'center' });
        break;
        
      case 'hourglass':
        // Icono de reloj de arena
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(size);
        pdf.text('⏳', x, y, { align: 'center' });
        break;
        
      case 'geo':
        // Icono de ubicación
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(size);
        pdf.text('📍', x, y, { align: 'center' });
        break;
    }
  }
}

import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { UsuarioModel } from '../Models/usuario';
import { ServiceModel } from '../Models/solicitudes.model';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private pdfDoc: jsPDF | null = null;
  private yPosition: number = 20;
  private pageHeight: number = 297; // A4 height in mm
  private margin: number = 15;
  private pageWidth: number = 210; // A4 width in mm

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
      this.yPosition = 20;

      // Título
      this.agregarTitulo('REPORTE DE USUARIOS');
      this.yPosition += 10;

      // Fecha de generación
      this.agregarTexto(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 10, true);
      this.yPosition += 5;

      // Capturar gráfico si existe
      if (graficoElement) {
        await this.agregarGrafico(graficoElement, 'Usuarios por Localidad');
        this.yPosition += 5;
      }

      // Estadísticas generales
      this.agregarSeccionEstadisticas(usuarios);
      this.yPosition += 10;

      // Tabla de usuarios
      this.agregarSeccionTablaUsuarios(usuarios);

      // Guardar PDF
      this.pdfDoc.save('Reporte_Usuarios.pdf');
    } catch (error) {
      console.error('Error al generar reporte de usuarios:', error);
      throw error;
    }
  }

  /**
   * Genera un reporte PDF de solicitudes
   */
  async generarReporteSolicitudes(
    solicitudes: ServiceModel[],
    graficoElements: { [key: string]: HTMLElement | null }
  ): Promise<void> {
    try {
      this.pdfDoc = new jsPDF('p', 'mm', 'a4');
      this.yPosition = 20;

      // Título
      this.agregarTitulo('REPORTE DE SOLICITUDES DE RECOLECCIÓN');
      this.yPosition += 10;

      // Fecha de generación
      this.agregarTexto(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 10, true);
      this.yPosition += 5;

      // Capturar gráficos
      const graficos = [
        { elemento: graficoElements['localidad'], titulo: 'Solicitudes por Localidad' },
        { elemento: graficoElements['rechazadas'], titulo: 'Solicitudes Rechazadas' },
        { elemento: graficoElements['estado'], titulo: 'Estado de Solicitudes' }
      ];

      for (const grafico of graficos) {
        if (grafico.elemento) {
          await this.agregarGrafico(grafico.elemento, grafico.titulo);
          this.yPosition += 5;
        }
      }

      // Estadísticas generales
      this.agregarSeccionEstadisticasSolicitudes(solicitudes);
      this.yPosition += 10;

      // Tabla de solicitudes
      this.agregarSeccionTablaSolicitudes(solicitudes);

      // Guardar PDF
      this.pdfDoc.save('Reporte_Solicitudes.pdf');
    } catch (error) {
      console.error('Error al generar reporte de solicitudes:', error);
      throw error;
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
  private agregarSeccionEstadisticasSolicitudes(solicitudes: ServiceModel[]): void {
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
  private agregarSeccionTablaSolicitudes(solicitudes: ServiceModel[]): void {
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
}

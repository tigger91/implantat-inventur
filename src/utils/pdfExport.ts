import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Article, Statistics } from '../types';

/**
 * Export inventory report as PDF
 */
export const exportPDF = (
  articles: Article[],
  stats: Statistics,
  inventoryName?: string
): void => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Inventurbericht', pageWidth / 2, 20, { align: 'center' });
    
    // Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const reportDateStr = new Date().toLocaleDateString('de-DE');
    doc.text(`Erstellt am: ${reportDateStr}`, pageWidth / 2, 28, { align: 'center' });
    
    if (inventoryName) {
      doc.text(`Inventur: ${inventoryName}`, pageWidth / 2, 35, { align: 'center' });
    }

    // Summary section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Zusammenfassung', 14, 45);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let yPos = 52;
    doc.text(`Gesamtanzahl Artikel: ${stats.total}`, 14, yPos);
    yPos += 6;
    doc.text(`Vollständig gezählt: ${stats.complete}`, 14, yPos);
    yPos += 6;
    doc.text(`Teilweise gezählt: ${stats.partial}`, 14, yPos);
    yPos += 6;
    doc.text(`Fehlbestand: ${stats.missing}`, 14, yPos);
    yPos += 6;
    doc.text(`Nicht gezählt: ${stats.open}`, 14, yPos);
    
    // Articles with deviations
    yPos += 12;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Artikel mit Abweichungen', 14, yPos);
    
    const articlesWithDeviations = articles.filter(a => a.abweichung !== 0);
    
    if (articlesWithDeviations.length === 0) {
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Keine Abweichungen gefunden ✓', 14, yPos);
    } else {
      // Table with deviations
      const tableData = articlesWithDeviations.map(article => [
        article.materialnummer,
        article.materialbezeichnung,
        article.charge,
        article.soll.toString(),
        article.gueltigeZaehlung.toString(),
        article.abweichung.toString(),
        article.autoKommentar
      ]);

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Material-Nr', 'Bezeichnung', 'Charge', 'SOLL', 'IST', 'Abweichung', 'Kommentar']],
        body: tableData,
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [0, 102, 204],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 50 },
          2: { cellWidth: 25 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 20 },
          6: { cellWidth: 'auto' }
        },
        didParseCell: (data) => {
          // Color code deviations
          if (data.section === 'body' && data.column.index === 5) {
            const deviation = parseInt(data.cell.raw as string);
            if (deviation > 0) {
              data.cell.styles.textColor = [239, 68, 68]; // Red
            } else if (deviation < 0) {
              data.cell.styles.textColor = [245, 158, 11]; // Orange
            }
          }
        }
      });
    }

    // Footer with signature field
    const finalY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY) || yPos + 20;
    const footerY = doc.internal.pageSize.getHeight() - 40;
    
    if (finalY < footerY - 30) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Unterschrift:', 14, footerY);
      doc.line(50, footerY, 120, footerY);
      
      doc.text('Datum:', 14, footerY + 10);
      doc.line(50, footerY + 10, 120, footerY + 10);
    }

    // Generate filename
    const now = new Date();
    const filenameDateStr = now.toISOString().split('T')[0];
    const fileName = `Inventurbericht_${filenameDateStr}.pdf`;

    // Save PDF
    doc.save(fileName);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error('Fehler beim Exportieren der PDF-Datei');
  }
};

/**
 * Export detailed article list as PDF
 */
export const exportDetailedPDF = (articles: Article[]): void => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Vollständige Artikelliste', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const detailDateStr = new Date().toLocaleDateString('de-DE');
    doc.text(`Erstellt am: ${detailDateStr}`, pageWidth / 2, 28, { align: 'center' });

    // Table with all articles
    const tableData = articles.map(article => [
      article.sparte,
      article.materialnummer,
      article.materialbezeichnung,
      article.charge,
      article.soll.toString(),
      article.istScan.toString(),
      article.manuelleZaehlung.toString(),
      article.gueltigeZaehlung.toString(),
      article.abweichung.toString()
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Sparte', 'Mat-Nr', 'Bezeichnung', 'Charge', 'SOLL', 'Scan', 'Man.', 'Gültig', 'Abw.']],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 1.5
      },
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 20 },
        2: { cellWidth: 60 },
        3: { cellWidth: 20 },
        4: { cellWidth: 12 },
        5: { cellWidth: 12 },
        6: { cellWidth: 12 },
        7: { cellWidth: 15 },
        8: { cellWidth: 12 }
      },
      didParseCell: (data) => {
        // Color code based on status
        if (data.section === 'body' && data.column.index === 8) {
          const deviation = parseInt(data.cell.raw as string);
          if (deviation === 0) {
            data.cell.styles.textColor = [16, 185, 129]; // Green
          } else if (deviation > 0) {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          } else {
            data.cell.styles.textColor = [245, 158, 11]; // Orange
          }
        }
      }
    });

    // Generate filename
    const now = new Date();
    const listDateStr = now.toISOString().split('T')[0];
    const fileName = `Artikelliste_${listDateStr}.pdf`;

    // Save PDF
    doc.save(fileName);
  } catch (error) {
    console.error('Error exporting detailed PDF:', error);
    throw new Error('Fehler beim Exportieren der PDF-Datei');
  }
};

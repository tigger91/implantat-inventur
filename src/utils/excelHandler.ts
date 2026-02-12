import ExcelJS from 'exceljs';
import { Article } from '../types';

/**
 * Import Excel file and parse articles using ExcelJS (secure alternative to xlsx)
 */
export const importExcel = async (file: File): Promise<Article[]> => {
  return new Promise((resolve, reject) => {
    // Security: Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('Datei zu groß. Maximum: 10MB'));
      return;
    }

    // Security: Validate file extension
    const validExtensions = ['.xlsx', '.xls'];
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExt)) {
      reject(new Error('Ungültiges Dateiformat. Nur .xlsx und .xls erlaubt.'));
      return;
    }

    const reader = new FileReader();

    // Security: Implement timeout for parsing (30 seconds)
    let timeoutId: NodeJS.Timeout;
    const PARSE_TIMEOUT = 30000; // 30 seconds

    reader.onload = async (e) => {
      try {
        timeoutId = setTimeout(() => {
          reject(new Error('Import-Timeout: Datei zu komplex oder beschädigt'));
        }, PARSE_TIMEOUT);

        const data = e.target?.result;
        if (!data) {
          throw new Error('Keine Daten gefunden');
        }

        // Parse Excel file with ExcelJS
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data as ArrayBuffer);
        
        // Get first worksheet
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          throw new Error('Keine Tabelle gefunden');
        }

        const articles: Article[] = [];

        // Skip header row (row 1), start from row 2
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          
          // Get cell values
          const values = row.values as (string | number | Date | null)[];
          
          // Skip empty rows or rows without Materialnummer
          if (!values || values.length < 2 || !values[2]) return;

          const article: Article = {
            sparte: String(values[1] || ''),
            materialnummer: String(values[2] || ''),
            materialbezeichnung: String(values[3] || ''),
            soll: parseFloat(String(values[4] || '0')) || 0,
            charge: String(values[5] || ''),
            istScan: 0, // Always reset to 0 on import
            manuelleZaehlung: parseFloat(String(values[7] || '0')) || 0,
            gueltigeZaehlung: 0, // Will be calculated
            abweichung: 0, // Will be calculated
            spalte1: String(values[10] || ''),
            autoKommentar: '',
            serialnummer: String(values[12] || ''),
            kommentarSales: String(values[13] || ''),
            kommentarSCM: String(values[14] || '')
          };

          // Calculate computed fields
          article.gueltigeZaehlung = article.istScan + article.manuelleZaehlung;
          article.abweichung = article.soll - article.gueltigeZaehlung;
          article.autoKommentar = generateAutoComment(article);

          articles.push(article);
        });

        // Validate required data
        if (articles.length === 0) {
          reject(new Error('Keine gültigen Artikel gefunden. Bitte prüfen Sie die Excel-Struktur.'));
          clearTimeout(timeoutId);
          return;
        }

        // Check for required columns
        const hasRequiredColumns = articles.every(a => 
          a.materialnummer && 
          typeof a.soll === 'number'
        );

        if (!hasRequiredColumns) {
          reject(new Error('Fehlende Pflichtfelder (Materialnummer, SOLL). Bitte prüfen Sie die Excel-Datei.'));
          clearTimeout(timeoutId);
          return;
        }

        resolve(articles);
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(new Error(`Fehler beim Importieren: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Export articles to Excel file using ExcelJS
 */
export const exportExcel = async (articles: Article[], filename?: string): Promise<void> => {
  try {
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventur');

    // Set column widths and headers
    worksheet.columns = [
      { header: 'Sparte', key: 'sparte', width: 10 },
      { header: 'Materialnummer', key: 'materialnummer', width: 15 },
      { header: 'Materialbezeichnung', key: 'materialbezeichnung', width: 40 },
      { header: 'SOLL', key: 'soll', width: 8 },
      { header: 'Charge', key: 'charge', width: 12 },
      { header: 'IST Scan', key: 'istScan', width: 10 },
      { header: 'Manuelle Zählung', key: 'manuelleZaehlung', width: 15 },
      { header: 'Gültige Zählung', key: 'gueltigeZaehlung', width: 15 },
      { header: 'Abweichung', key: 'abweichung', width: 12 },
      { header: 'Spalte1', key: 'spalte1', width: 10 },
      { header: 'Auto. Kommentar', key: 'autoKommentar', width: 25 },
      { header: 'Serialnummer(n)', key: 'serialnummer', width: 20 },
      { header: 'Kommentar Sales', key: 'kommentarSales', width: 20 },
      { header: 'Kommentar SCM', key: 'kommentarSCM', width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E9F7' }
    };

    // Add data rows
    articles.forEach(article => {
      worksheet.addRow({
        sparte: article.sparte,
        materialnummer: article.materialnummer,
        materialbezeichnung: article.materialbezeichnung,
        soll: article.soll,
        charge: article.charge,
        istScan: article.istScan,
        manuelleZaehlung: article.manuelleZaehlung,
        gueltigeZaehlung: article.gueltigeZaehlung,
        abweichung: article.abweichung,
        spalte1: article.spalte1,
        autoKommentar: article.autoKommentar,
        serialnummer: article.serialnummer,
        kommentarSales: article.kommentarSales,
        kommentarSCM: article.kommentarSCM
      });
    });

    // Generate filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(':').slice(0, 2).join('-');
    const fileName = filename || `Inventur_${dateStr}_${timeStr}.xlsx`;

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting Excel:', error);
    throw new Error('Fehler beim Exportieren der Excel-Datei');
  }
};

/**
 * Generate automatic comment based on article status
 */
export const generateAutoComment = (article: Article): string => {
  const comments: string[] = [];

  if (article.abweichung > 0) {
    comments.push(`FEHLBESTAND: ${article.abweichung} Stück fehlen`);
  } else if (article.abweichung < 0) {
    comments.push(`ÜBERBESTAND: ${Math.abs(article.abweichung)} Stück zu viel`);
  } else if (article.gueltigeZaehlung === article.soll && article.soll > 0) {
    comments.push('✓ Vollständig');
  }

  return comments.join('; ');
};

/**
 * Update article calculations
 */
export const updateArticleCalculations = (article: Article): Article => {
  const updated = { ...article };
  updated.gueltigeZaehlung = updated.istScan + updated.manuelleZaehlung;
  updated.abweichung = updated.soll - updated.gueltigeZaehlung;
  updated.autoKommentar = generateAutoComment(updated);
  return updated;
};

/**
 * Export to JSON for backup
 */
export const exportJSON = (articles: Article[]): string => {
  return JSON.stringify(articles, null, 2);
};

/**
 * Import from JSON backup
 */
export const importJSON = (jsonString: string): Article[] => {
  try {
    const articles = JSON.parse(jsonString);
    if (!Array.isArray(articles)) {
      throw new Error('Invalid JSON format');
    }
    return articles;
  } catch (error) {
    throw new Error('Fehler beim Importieren der JSON-Datei');
  }
};

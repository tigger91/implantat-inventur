import * as XLSX from 'xlsx';
import { Article } from '../types';

/**
 * Import Excel file and parse articles
 */
export const importExcel = async (file: File): Promise<Article[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false,
          defval: ''
        }) as (string | number)[][];

        // Skip header row
        const dataRows = jsonData.slice(1);
        
        const articles: Article[] = dataRows
          .filter(row => row.length > 0 && row[1]) // Filter empty rows and rows without Materialnummer
          .map((row) => {
            const article: Article = {
              sparte: String(row[0] || ''),
              materialnummer: String(row[1] || ''),
              materialbezeichnung: String(row[2] || ''),
              soll: parseFloat(String(row[3])) || 0,
              charge: String(row[4] || ''),
              istScan: 0, // Always reset to 0 on import
              manuelleZaehlung: parseFloat(String(row[6])) || 0,
              gueltigeZaehlung: 0, // Will be calculated
              abweichung: 0, // Will be calculated
              spalte1: String(row[9] || ''),
              autoKommentar: '',
              serialnummer: String(row[11] || ''),
              kommentarSales: String(row[12] || ''),
              kommentarSCM: String(row[13] || '')
            };

            // Calculate computed fields
            article.gueltigeZaehlung = article.istScan + article.manuelleZaehlung;
            article.abweichung = article.soll - article.gueltigeZaehlung;
            article.autoKommentar = generateAutoComment(article);

            return article;
          });

        // Validate required columns
        if (articles.length === 0) {
          reject(new Error('Keine gültigen Artikel gefunden. Bitte prüfen Sie die Excel-Struktur.'));
          return;
        }

        // Check for required columns
        const hasRequiredColumns = articles.every(a => 
          a.materialnummer && 
          typeof a.soll === 'number'
        );

        if (!hasRequiredColumns) {
          reject(new Error('Fehlende Pflichtfelder (Materialnummer, SOLL). Bitte prüfen Sie die Excel-Datei.'));
          return;
        }

        resolve(articles);
      } catch (error) {
        reject(new Error(`Fehler beim Importieren: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei'));
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * Export articles to Excel file
 */
export const exportExcel = (articles: Article[], filename?: string): void => {
  try {
    // Prepare data with headers
    const headers = [
      'Sparte',
      'Materialnummer',
      'Materialbezeichnung',
      'SOLL',
      'Charge',
      'IST Scan',
      'Manuelle Zählung',
      'Gültige Zählung',
      'Abweichung',
      'Spalte1',
      'Auto. Kommentar',
      'Serialnummer(n)',
      'Kommentar Sales',
      'Kommentar SCM'
    ];

    const data = articles.map(article => [
      article.sparte,
      article.materialnummer,
      article.materialbezeichnung,
      article.soll,
      article.charge,
      article.istScan,
      article.manuelleZaehlung,
      article.gueltigeZaehlung,
      article.abweichung,
      article.spalte1,
      article.autoKommentar,
      article.serialnummer,
      article.kommentarSales,
      article.kommentarSCM
    ]);

    const wsData = [headers, ...data];
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 10 },  // Sparte
      { wch: 15 },  // Materialnummer
      { wch: 40 },  // Materialbezeichnung
      { wch: 8 },   // SOLL
      { wch: 12 },  // Charge
      { wch: 10 },  // IST Scan
      { wch: 15 },  // Manuelle Zählung
      { wch: 15 },  // Gültige Zählung
      { wch: 12 },  // Abweichung
      { wch: 10 },  // Spalte1
      { wch: 25 },  // Auto. Kommentar
      { wch: 20 },  // Serialnummer
      { wch: 20 },  // Kommentar Sales
      { wch: 20 }   // Kommentar SCM
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventur');

    // Generate filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(':').slice(0, 2).join('-');
    const fileName = filename || `Inventur_${dateStr}_${timeStr}.xlsx`;

    // Export file
    XLSX.writeFile(wb, fileName);
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

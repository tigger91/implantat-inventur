export interface Article {
  id?: number;
  sparte: string;                    // Spalte A
  materialnummer: string;            // Spalte B (REF)
  materialbezeichnung: string;       // Spalte C
  soll: number;                      // Spalte D
  charge: string;                    // Spalte E (LOT)
  istScan: number;                   // Spalte F
  manuelleZaehlung: number;          // Spalte G
  gueltigeZaehlung: number;          // Spalte H (berechnet)
  abweichung: number;                // Spalte I (berechnet)
  spalte1: string;                   // Spalte J
  autoKommentar: string;             // Spalte K
  serialnummer: string;              // Spalte L
  kommentarSales: string;            // Spalte M
  kommentarSCM: string;              // Spalte N
}

export interface ScanResult {
  ref: string;
  lot: string;
  gtin: string;
  expiryDate?: Date;
  serialNumber?: string;
  rawData: string;
}

export interface Inventory {
  id?: number;
  name: string;
  date: Date;
  articles: Article[];
  lastModified: Date;
}

export interface ScanHistory {
  id?: number;
  inventoryId: number;
  articleId: number;
  timestamp: Date;
  scanData: ScanResult;
}

export type ArticleStatus = 'complete' | 'partial' | 'missing' | 'open';

export interface Statistics {
  total: number;
  complete: number;
  partial: number;
  missing: number;
  open: number;
  averageScanTime?: number;
  totalDuration?: number;
}

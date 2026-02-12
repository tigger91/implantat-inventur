import { ScanResult } from '../types';

/**
 * GS1 Application Identifier Parser
 * Parses DataMatrix codes with GS1 Application Identifiers (AI)
 * 
 * Common AIs:
 * - (01) GTIN - Global Trade Item Number (14 digits)
 * - (10) LOT/Batch number (alphanumeric, variable length)
 * - (17) Expiry Date (YYMMDD format)
 * - (21) Serial Number (alphanumeric, variable length)
 */

const GS1_AIs: Record<string, { name: string; length?: number }> = {
  '01': { name: 'GTIN', length: 14 },
  '10': { name: 'LOT' },
  '17': { name: 'EXPIRY', length: 6 },
  '21': { name: 'SERIAL' },
  '240': { name: 'PRODUCT_VARIANT' },
  '241': { name: 'CUSTOMER_PART_NUMBER' },
};

const GROUP_SEPARATOR = String.fromCharCode(29); // ASCII GS character

export const parseGS1DataMatrix = (data: string): ScanResult | null => {
  try {
    const result: Partial<ScanResult> = {
      ref: '',
      lot: '',
      gtin: '',
      rawData: data
    };

    // Remove FNC1 character if present at the start
    const cleanData = data.startsWith(']d2') ? data.substring(3) : data;
    
    // Parse each AI
    let position = 0;
    while (position < cleanData.length) {
      // Find AI (2-4 digits in parentheses or just 2-3 digits)
      let ai = '';
      
      // Check for parentheses format: (01)
      if (cleanData[position] === '(') {
        const closeParenPos = cleanData.indexOf(')', position);
        if (closeParenPos > position) {
          ai = cleanData.substring(position + 1, closeParenPos);
          position = closeParenPos + 1;
        }
      } else {
        // Try 2-digit AI
        ai = cleanData.substring(position, position + 2);
        if (GS1_AIs[ai]) {
          position += 2;
        } else {
          // Try 3-digit AI
          ai = cleanData.substring(position, position + 3);
          if (GS1_AIs[ai]) {
            position += 3;
          } else {
            // Unknown AI, try to skip
            position++;
            continue;
          }
        }
      }

      if (!GS1_AIs[ai]) {
        // Unknown AI, skip to next separator or end
        const nextSep = cleanData.indexOf(GROUP_SEPARATOR, position);
        position = nextSep > 0 ? nextSep + 1 : cleanData.length;
        continue;
      }

      // Extract value
      const aiConfig = GS1_AIs[ai];
      let value = '';
      
      if (aiConfig.length) {
        // Fixed length AI
        value = cleanData.substring(position, position + aiConfig.length);
        position += aiConfig.length;
      } else {
        // Variable length AI - read until separator or end
        const nextSep = cleanData.indexOf(GROUP_SEPARATOR, position);
        if (nextSep > position) {
          value = cleanData.substring(position, nextSep);
          position = nextSep + 1;
        } else {
          value = cleanData.substring(position);
          position = cleanData.length;
        }
      }

      // Store parsed value
      switch (ai) {
        case '01':
          result.gtin = value;
          break;
        case '10':
          result.lot = value;
          break;
        case '17':
          result.expiryDate = parseGS1Date(value);
          break;
        case '21':
          result.serialNumber = value;
          break;
        case '240':
        case '241':
          // Could be REF/Article number
          if (!result.ref) {
            result.ref = value;
          }
          break;
      }
    }

    // If no REF found but we have other data, try to extract from description
    // B. BRAUN implants often have REF in a separate field
    if (!result.ref && result.lot) {
      // Try to find REF pattern in raw data
      const refMatch = data.match(/REF[:\s]*([A-Z0-9]+)/i);
      if (refMatch) {
        result.ref = refMatch[1];
      }
    }

    // Validate required fields
    if (!result.lot && !result.ref && !result.gtin) {
      console.error('No valid GS1 data found');
      return null;
    }

    return result as ScanResult;
  } catch (error) {
    console.error('Error parsing GS1 DataMatrix:', error);
    return null;
  }
};

/**
 * Parse GS1 date format (YYMMDD)
 * Uses a sliding window: years 00-49 map to 2000-2049, years 50-99 map to 1950-1999
 */
const parseGS1Date = (dateStr: string): Date | undefined => {
  if (!dateStr || dateStr.length !== 6) {
    return undefined;
  }

  try {
    const year = parseInt(dateStr.substring(0, 2), 10);
    const month = parseInt(dateStr.substring(2, 4), 10);
    const day = parseInt(dateStr.substring(4, 6), 10);

    // Sliding window: 00-49 = 2000-2049, 50-99 = 1950-1999
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const fullYear = year < 50 ? currentCentury + year : currentCentury - 100 + year;

    const date = new Date(fullYear, month - 1, day);
    
    // Validate date
    if (isNaN(date.getTime())) {
      return undefined;
    }

    return date;
  } catch (error) {
    console.error('Error parsing GS1 date:', error);
    return undefined;
  }
};

/**
 * Check if a product is expired
 */
export const isExpired = (expiryDate?: Date): boolean => {
  if (!expiryDate) return false;
  return expiryDate < new Date();
};

/**
 * Check if a product expires within the next 6 months
 */
export const expiresSoon = (expiryDate?: Date): boolean => {
  if (!expiryDate) return false;
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  return expiryDate < sixMonthsFromNow && !isExpired(expiryDate);
};

/**
 * Format expiry date for display
 */
export const formatExpiryDate = (expiryDate?: Date): string => {
  if (!expiryDate) return '';
  return expiryDate.toLocaleDateString('de-DE');
};

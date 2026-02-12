# Implantat-Inventur PWA

Progressive Web App für die Inventur von medizinischen Implantaten mit DataMatrix-Scanner, optimiert für iPhone 13 mit iOS.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![PWA](https://img.shields.io/badge/PWA-enabled-brightgreen.svg)
![iOS](https://img.shields.io/badge/iOS-optimized-000000.svg)

## 🎯 Übersicht

Diese PWA ermöglicht Außendienstmitarbeitern die effiziente Inventur von medizinischen Implantaten (B. BRAUN) mittels GS1 DataMatrix-Codes. Die App funktioniert vollständig offline, unterstützt Excel-Import/-Export und ist speziell für die iPhone 13 Kamera optimiert.

## ✨ Hauptfunktionen

### 📷 DataMatrix-Scanner
- Nutzung der iPhone-Rückkamera
- GS1-Standard-Parsing (AI 01, 10, 17, 21)
- Automatisches Matching via LOT oder REF
- Echtzeit-Feedback mit Vibration und Audio
- Taschenlampen-Funktion
- Verfallsdatum-Warnung

### 📊 Excel-Integration
- Import von bestehenden Inventurlisten (.xlsx, .xls)
- Export mit vollständiger Formatierung
- Automatische Berechnungen (Gültige Zählung, Abweichung)
- Erhaltung der Original-Spaltenstruktur

### 📄 PDF-Berichte
- Zusammenfassung mit Statistiken
- Tabelle mit Abweichungen
- Vollständige Artikelliste
- Unterschriftenfeld

### 💾 Offline-Funktionalität
- Vollständig offline nutzbar
- IndexedDB für Datenspeicherung
- Service Worker mit Cache-First-Strategie
- Automatisches Speichern nach jedem Scan

### 📱 iOS-Optimierungen
- Safe Area Insets für iPhone-Notch
- Touch-optimierte Bedienung (44x44px Targets)
- Portrait-Modus
- PWA-Installation auf Home-Screen
- Haptic Feedback

## 🚀 Installation & Setup

### Voraussetzungen
- Node.js 18+ und npm
- Moderner Browser mit ES2020-Support
- Für Kamera-Zugriff: HTTPS-Verbindung

### Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/tigger91/implantat-inventur.git
cd implantat-inventur

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Auf iPhone testen (mit HTTPS):
# Option 1: ngrok verwenden
npx ngrok http 3000

# Option 2: localhost über HTTPS (selbstsigniertes Zertifikat)
# iOS erfordert HTTPS für Kamera-Zugriff
```

### Production Build

```bash
# Build erstellen
npm run build

# Build lokal testen
npm run preview
```

## 📦 Deployment

### GitHub Pages

```bash
# Automatisches Deployment
npm run deploy

# Manuell:
npm run build
npx gh-pages -d dist
```

Die App ist dann verfügbar unter: `https://tigger91.github.io/implantat-inventur/`

### Netlify

1. Repository mit Netlify verbinden
2. Build-Kommando: `npm run build`
3. Publish-Verzeichnis: `dist`
4. Deployment starten

### Andere Hosting-Anbieter

Die `dist`-Verzeichnis nach dem Build kann auf jeden statischen Hosting-Service deployed werden. Wichtig: HTTPS ist für Kamera-Zugriff erforderlich!

## 📱 Installation auf iPhone

1. Safari auf iPhone öffnen
2. URL der App aufrufen (z.B. `https://tigger91.github.io/implantat-inventur/`)
3. Teilen-Button antippen (unten in der Mitte)
4. "Zum Home-Bildschirm" wählen
5. Name bestätigen und "Hinzufügen" antippen
6. App-Icon erscheint auf dem Home-Screen

## 📖 Benutzerhandbuch

### 1. Excel-Datei importieren

Die Excel-Datei muss folgende Struktur haben:

| Spalte | Bezeichnung | Beispiel |
|--------|-------------|----------|
| A | Sparte | A22 |
| B | Materialnummer | NK020S |
| C | Materialbezeichnung | BIPOLAR CUP ID22.2MM... |
| D | SOLL | 2 |
| E | Charge | 52979037 |
| F | IST Scan | 0 (wird automatisch gefüllt) |
| G | Manuelle Zählung | 0 |
| H | Gültige Zählung | 0 (automatisch berechnet) |
| I | Abweichung | 0 (automatisch berechnet) |
| J | Spalte1 | - |
| K | Auto. Kommentar | (automatisch generiert) |
| L | Serialnummer(n) | - |
| M | Kommentar Sales | - |
| N | Kommentar SCM | - |

Eine Beispiel-Datei befindet sich in `beispiel_inventur.csv` (als CSV für GitHub, kann in Excel geöffnet werden).

### 2. Artikel scannen

1. "SCANNEN STARTEN" auf Dashboard antippen
2. DataMatrix-Code vor die Kamera halten
3. Bei Dunkelheit: Taschenlampen-Button 🔦 nutzen
4. Nach erfolgreichem Scan:
   - ✅ Grünes Overlay bei Erfolg
   - ⚠️ Gelbes Overlay bei Überbestand
   - ❌ Rotes Overlay bei Fehler
5. Overlay verschwindet automatisch nach 3 Sekunden

### 3. Artikelliste verwalten

- **Suche**: Nach Materialnummer, Bezeichnung, Charge suchen
- **Filter**: Nach Sparte oder Status filtern
- **Details**: Artikel antippen für Detailansicht
- **Manuelle Korrektur**: +/- Buttons in Detailansicht

### 4. Export

**Excel exportieren:**
- Dashboard → "Exportieren"
- Datei wird mit aktuellem Datum/Uhrzeit gespeichert
- Format: `Inventur_YYYY-MM-DD_HH-MM.xlsx`

**PDF-Bericht:**
- Dashboard → "PDF-Bericht erstellen"
- Enthält nur Artikel mit Abweichungen
- Format: `Inventurbericht_YYYY-MM-DD.pdf`

## 🛠️ Technischer Stack

### Frontend
- **React 18** mit TypeScript
- **Vite** als Build-Tool
- **React Router** für Navigation
- **Tailwind CSS** für Styling

### Scanner & Parsing
- **@zxing/browser** für DataMatrix-Scanning
- Eigener GS1-Parser für Application Identifiers

### Daten & Storage
- **Dexie.js** für IndexedDB
- **Zustand** für State Management
- **SheetJS (xlsx)** für Excel-Import/-Export
- **jsPDF** + **jsPDF-AutoTable** für PDF-Export

### PWA
- **Vite PWA Plugin** für Service Worker
- **Workbox** für Caching-Strategien
- Vollständige Offline-Funktionalität

## 📂 Projektstruktur

```
implantat-inventur/
├── public/               # Statische Assets
│   ├── icon-192.png     # PWA Icon (192x192)
│   ├── icon-512.png     # PWA Icon (512x512)
│   └── apple-touch-icon.png  # iOS Icon (180x180)
├── src/
│   ├── components/      # React-Komponenten
│   │   ├── StartScreen.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Scanner.tsx
│   │   ├── ArticleList.tsx
│   │   └── ArticleDetail.tsx
│   ├── db/              # Datenbank
│   │   └── database.ts
│   ├── stores/          # Zustand Store
│   │   └── inventoryStore.ts
│   ├── types/           # TypeScript-Typen
│   │   └── index.ts
│   ├── utils/           # Utility-Funktionen
│   │   ├── gs1Parser.ts
│   │   ├── excelHandler.ts
│   │   └── pdfExport.ts
│   ├── App.tsx          # Haupt-App-Komponente
│   ├── main.tsx         # Entry Point
│   └── index.css        # Globale Styles
├── index.html           # HTML Entry Point
├── vite.config.ts       # Vite-Konfiguration
├── tailwind.config.js   # Tailwind-Konfiguration
├── tsconfig.json        # TypeScript-Konfiguration
└── package.json         # Dependencies
```

## 🐛 Troubleshooting

### Kamera funktioniert nicht

**Problem:** "Kamerazugriff verweigert"

**Lösung:**
1. iOS-Einstellungen öffnen
2. Safari → Kamera
3. "Fragen" oder "Erlauben" wählen
4. App neu laden

**Wichtig:** Kamera funktioniert nur über HTTPS! Localhost ist eine Ausnahme.

### Service Worker wird nicht registriert

**Problem:** Offline-Funktionalität fehlt

**Lösung:**
- Service Worker funktioniert nur über HTTPS
- In Chrome DevTools → Application → Service Worker prüfen
- Ggf. "Update on reload" aktivieren während Entwicklung

### Excel-Import schlägt fehl

**Problem:** "Fehlende Pflichtfelder"

**Lösung:**
- Prüfen, ob Spalten A-E vorhanden sind
- Mindestens Spalte B (Materialnummer) und D (SOLL) müssen Werte enthalten
- Erste Zeile muss Header sein

### DataMatrix wird nicht erkannt

**Problem:** Scan funktioniert nicht

**Lösung:**
- Gute Beleuchtung sicherstellen (Taschenlampe nutzen)
- Code vollständig im Scan-Rahmen platzieren
- Code nicht verdeckt oder beschädigt
- Kamera-Fokus abwarten (1-2 Sekunden)

## 📊 GS1 DataMatrix-Format

Die App unterstützt folgende GS1 Application Identifiers:

| AI | Bezeichnung | Länge | Beispiel |
|----|-------------|-------|----------|
| (01) | GTIN | 14 | 04046964680328 |
| (10) | LOT/Batch | variabel | 52981832 |
| (17) | Ablaufdatum | 6 (YYMMDD) | 350226 |
| (21) | Seriennummer | variabel | ABC123 |

Beispiel DataMatrix-String:
```
(01)04046964680328(17)350226(10)52981832(21)SN123456
```

## 🔒 Sicherheit & Datenschutz

- ✅ Alle Daten bleiben lokal auf dem iPhone
- ✅ Keine Übertragung an externe Server
- ✅ Keine Analytics oder Tracking
- ✅ DSGVO-konform (keine personenbezogenen Daten)
- ✅ Optional: PIN-Code-Schutz (in Einstellungen, zukünftige Version)

## 🤝 Contributing

Contributions sind willkommen! Bitte beachten:

1. Fork das Repository
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

## 📝 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 👤 Autor

**tigger91**

## 🙏 Danksagungen

- B. BRAUN für die medizinischen Implantate
- ZXing-Team für die hervorragende Barcode-Bibliothek
- SheetJS für Excel-Handling

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues öffnen
- Dokumentation durchlesen
- Troubleshooting-Sektion prüfen

---

**Hinweis:** Diese App ist für den internen Gebrauch entwickelt und optimiert für iPhone 13 mit iOS. Andere Geräte können abweichende Erfahrungen haben.

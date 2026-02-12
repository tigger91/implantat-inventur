# Changelog

All notable changes to the Implantat-Inventur PWA project.

## [1.0.0] - 2026-02-12

### Added - Initial Release

#### Core Features
- **DataMatrix Scanner**
  - iPhone camera integration using @zxing/browser
  - GS1 DataMatrix parsing with Application Identifiers (AI 01, 10, 17, 21)
  - Automatic matching via LOT or REF
  - Visual feedback with success/error/warning overlays
  - Haptic vibration feedback
  - Audio beep on successful scan
  - Flashlight toggle for low-light conditions
  - Expiry date warnings (expired and expiring soon)
  - Overstock warnings

- **Excel Integration**
  - Import existing inventory lists (.xlsx, .xls)
  - Export with formatting preservation
  - Automatic calculations (Gültige Zählung, Abweichung, Auto-Kommentar)
  - Support for 14-column structure (A-N)
  - Validation of required fields

- **PDF Export**
  - Inventory summary report
  - Table of articles with deviations
  - Detailed article list
  - Signature fields
  - Statistics overview

- **User Interface**
  - StartScreen for Excel upload
  - Dashboard with progress tracking
  - ArticleList with search and filters
  - ArticleDetail with manual counting
  - Responsive design optimized for iPhone 13

- **Offline Support**
  - Complete PWA implementation
  - Service Worker with cache-first strategy
  - IndexedDB storage via Dexie.js
  - Auto-save after each scan

- **iOS Optimizations**
  - Safe area insets for notch
  - Touch-optimized buttons (44x44px)
  - Portrait mode locked
  - Home screen installation support
  - Apple Touch Icon

#### Technical Stack
- React 18.2 with TypeScript 5.3
- Vite 5.0 build tool
- Tailwind CSS 3.4 for styling
- Zustand 4.4 for state management
- Dexie.js 3.2 for IndexedDB
- @zxing/library 0.21 for barcode scanning
- SheetJS (xlsx) 0.18 for Excel handling
- jsPDF 2.5 for PDF generation

#### Development Tools
- ESLint for code quality
- TypeScript strict mode
- Vite PWA plugin for Service Worker
- GitHub Actions workflow for deployment

#### Documentation
- Comprehensive README with user guide
- Deployment instructions (GitHub Pages, Netlify)
- Troubleshooting section
- Code examples and API documentation
- Example CSV file with test data

### Security
- CodeQL security scanning (0 vulnerabilities found)
- All data stored locally (no external servers)
- GDPR compliant (no personal data collection)
- HTTPS enforcement for camera access

### Fixed
- GS1 date parsing uses sliding window (2000-2049 / 1950-1999)
- Article status logic accounts for manual counting
- Proper TypeScript types throughout
- Removed unused dependencies (date-fns, framer-motion, zod)

### Known Limitations
- Large bundle size (1.5MB main chunk) - consider code splitting for production
- Camera requires HTTPS (limitation of Web APIs)
- Service Worker updates require page reload
- DataMatrix recognition can take 1-2 seconds

## Future Enhancements (Planned)

### Version 1.1.0
- [ ] Manual entry dialog for DataMatrix codes
- [ ] Undo last scan functionality
- [ ] Bulk operations (mark multiple as counted)
- [ ] Dark mode toggle
- [ ] Enhanced statistics (scan rate, duration)

### Version 1.2.0
- [ ] Photo attachment to articles
- [ ] Multi-inventory management
- [ ] Export/import JSON backups
- [ ] PIN code protection
- [ ] Auto-lock after inactivity

### Version 2.0.0
- [ ] Backend sync (optional)
- [ ] User authentication
- [ ] Team collaboration features
- [ ] Cloud backup
- [ ] Advanced reporting

## Links
- Repository: https://github.com/tigger91/implantat-inventur
- Issues: https://github.com/tigger91/implantat-inventur/issues
- Discussions: https://github.com/tigger91/implantat-inventur/discussions

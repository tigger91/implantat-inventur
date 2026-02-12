# Deployment Guide

## Quick Start - GitHub Pages

1. **Enable GitHub Pages:**
   - Go to your repository Settings
   - Navigate to "Pages" section
   - Source: GitHub Actions
   - Save

2. **Push to main/master:**
   ```bash
   git push origin main
   ```

3. **Wait for deployment:**
   - GitHub Actions will automatically build and deploy
   - Check the Actions tab for progress
   - App will be available at: `https://tigger91.github.io/implantat-inventur/`

## Alternative - Manual Deployment

```bash
# Build the app
npm run build

# Deploy manually
npm run deploy
```

## Netlify Deployment

1. **Connect Repository:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Deploy site"

3. **Custom Domain (Optional):**
   - Go to Site settings > Domain management
   - Add custom domain

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Important Notes

### HTTPS Required
- Camera access requires HTTPS
- All major hosting providers (GitHub Pages, Netlify, Vercel) provide HTTPS automatically
- For local testing: use `ngrok` or `localhost`

### Base URL Configuration
If deploying to a subdirectory (e.g., `username.github.io/repo-name`), update `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/repo-name/', // Add this line
  plugins: [
    // ...
  ]
});
```

### iOS Testing
1. Open Safari on iPhone
2. Navigate to deployed URL
3. Tap Share button
4. Select "Add to Home Screen"
5. App icon will appear on Home Screen

### Troubleshooting

**Service Worker not updating:**
- Clear browser cache
- Use "Update on reload" in DevTools

**Camera not working:**
- Ensure HTTPS is enabled
- Check iOS Safari permissions

**App not installing on iOS:**
- Verify manifest.json is served correctly
- Check that all icons are accessible

## Build Optimization

The current build produces large chunks. For production, consider:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'scanner': ['@zxing/browser', '@zxing/library'],
          'excel': ['xlsx'],
          'pdf': ['jspdf', 'jspdf-autotable']
        }
      }
    }
  }
});
```

## Post-Deployment Checklist

- [ ] Test on iPhone 13 Safari
- [ ] Verify camera access works
- [ ] Test Excel import/export
- [ ] Verify offline functionality
- [ ] Test PWA installation
- [ ] Check DataMatrix scanning
- [ ] Verify PDF export

## Support

For issues during deployment, check:
- GitHub Actions logs
- Browser console errors
- Network tab for failed requests

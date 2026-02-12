import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventoryStore } from '../stores/inventoryStore';
import { importExcel } from '../utils/excelHandler';

export default function StartScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { importArticles } = useInventoryStore();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const articles = await importExcel(file);
      await importArticles(articles);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Importieren');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Implantat-Inventur
          </h1>
          <p className="text-gray-600">
            Progressive Web App für medizinische Implantate
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleUploadClick}
            disabled={isLoading}
            className="w-full bg-primary text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-3 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <span className="text-2xl">📂</span>
            <span>{isLoading ? 'Importiere...' : 'Excel-Datei hochladen'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-200 text-gray-700 py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-3 hover:bg-gray-300 transition-colors"
          >
            <span className="text-2xl">▶️</span>
            <span>Letzte Inventur fortsetzen</span>
          </button>

          <button
            className="w-full bg-white text-gray-700 py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors border border-gray-300"
          >
            <span className="text-2xl">ℹ️</span>
            <span>Anleitung</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-semibold">Fehler:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Erste Schritte:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Excel-Datei mit Inventurliste hochladen</li>
            <li>Artikel mit DataMatrix-Scanner erfassen</li>
            <li>Inventur exportieren und abschließen</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Version 1.0.0</p>
          <p className="mt-1">Optimiert für iPhone 13 mit iOS</p>
        </div>
      </div>
    </div>
  );
}

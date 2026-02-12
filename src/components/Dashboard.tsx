import { useNavigate } from 'react-router-dom';
import { useInventoryStore } from '../stores/inventoryStore';
import { exportExcel } from '../utils/excelHandler';
import { exportPDF } from '../utils/pdfExport';
import { useEffect } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { articles, statistics, calculateStatistics } = useInventoryStore();

  useEffect(() => {
    calculateStatistics();
  }, [calculateStatistics, articles]);

  const progress = statistics.total > 0 
    ? Math.round((statistics.complete / statistics.total) * 100) 
    : 0;

  const handleExport = async () => {
    try {
      await exportExcel(articles);
    } catch (error) {
      alert('Fehler beim Exportieren der Excel-Datei');
    }
  };

  const handleExportPDF = () => {
    try {
      exportPDF(articles, statistics);
    } catch (error) {
      alert('Fehler beim Exportieren der PDF-Datei');
    }
  };

  if (articles.length === 0) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-bottom">
      {/* Header */}
      <div className="bg-primary text-white px-6 py-4 pt-safe-top">
        <h1 className="text-2xl font-bold">Implantat-Inventur</h1>
        <p className="text-blue-100 text-sm mt-1">Dashboard</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Progress Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">📊 Inventur-Fortschritt</h2>
            <span className="text-2xl font-bold text-primary">{progress}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
            <div
              className="bg-success h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-gray-600 text-center">
            {statistics.complete} von {statistics.total} Artikeln vollständig
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-3xl mb-2">🟢</div>
            <div className="text-2xl font-bold text-success">{statistics.complete}</div>
            <div className="text-xs text-gray-600 mt-1">Vollst.</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-3xl mb-2">🟡</div>
            <div className="text-2xl font-bold text-warning">{statistics.partial}</div>
            <div className="text-xs text-gray-600 mt-1">Teil-<br/>weise</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-3xl mb-2">🔴</div>
            <div className="text-2xl font-bold text-error">{statistics.missing}</div>
            <div className="text-xs text-gray-600 mt-1">Fehl-<br/>bestand</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-3xl mb-2">⚪</div>
            <div className="text-2xl font-bold text-gray-500">{statistics.open}</div>
            <div className="text-xs text-gray-600 mt-1">Offen</div>
          </div>
        </div>

        {/* Main Scan Button */}
        <button
          onClick={() => navigate('/scanner')}
          className="w-full bg-primary text-white py-6 px-6 rounded-lg font-bold text-xl flex items-center justify-center space-x-3 hover:bg-blue-700 transition-colors shadow-lg"
        >
          <span className="text-3xl">📷</span>
          <span>SCANNEN STARTEN</span>
        </button>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/articles')}
            className="bg-white text-gray-700 py-4 px-4 rounded-lg font-semibold flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-colors border border-gray-300 shadow-sm"
          >
            <span className="text-3xl">📋</span>
            <span>Artikelliste</span>
          </button>
          
          <button
            onClick={handleExport}
            className="bg-white text-gray-700 py-4 px-4 rounded-lg font-semibold flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-colors border border-gray-300 shadow-sm"
          >
            <span className="text-3xl">💾</span>
            <span>Exportieren</span>
          </button>
        </div>

        {/* Additional Actions */}
        <div className="space-y-3">
          <button
            onClick={handleExportPDF}
            className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors border border-gray-300"
          >
            <span className="text-xl">📄</span>
            <span>PDF-Bericht erstellen</span>
          </button>
          
          <button
            className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors border border-gray-300"
          >
            <span className="text-xl">⚙️</span>
            <span>Einstellungen</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Schnellübersicht</h3>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Gesamt Artikel:</span>
              <span className="font-semibold">{statistics.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Noch zu zählen:</span>
              <span className="font-semibold">{statistics.open + statistics.partial}</span>
            </div>
            <div className="flex justify-between">
              <span>Abweichungen:</span>
              <span className="font-semibold text-error">
                {statistics.missing > 0 ? statistics.missing : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

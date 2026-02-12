import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInventoryStore } from '../stores/inventoryStore';
import { Article } from '../types';

export default function ArticleDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { articles, updateArticleField, updateArticleManual, getArticleStatus } = useInventoryStore();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [kommentarSales, setKommentarSales] = useState('');
  const [kommentarSCM, setKommentarSCM] = useState('');

  useEffect(() => {
    const found = articles.find(a => a.id === parseInt(id || '0'));
    if (found) {
      setArticle(found);
      setKommentarSales(found.kommentarSales || '');
      setKommentarSCM(found.kommentarSCM || '');
    } else {
      navigate('/articles');
    }
  }, [id, articles, navigate]);

  if (!article) {
    return null;
  }

  const status = getArticleStatus(article);
  const statusIcon = 
    status === 'complete' ? '🟢' :
    status === 'partial' ? '🟡' :
    status === 'missing' ? '🔴' : '⚪';

  const handleIncrement = (field: 'istScan' | 'manuelleZaehlung') => {
    const newValue = article[field] + 1;
    if (field === 'manuelleZaehlung') {
      updateArticleManual(article.id!, newValue);
    } else {
      updateArticleField(article.id!, field, newValue);
    }
  };

  const handleDecrement = (field: 'istScan' | 'manuelleZaehlung') => {
    if (article[field] > 0) {
      const newValue = article[field] - 1;
      if (field === 'manuelleZaehlung') {
        updateArticleManual(article.id!, newValue);
      } else {
        updateArticleField(article.id!, field, newValue);
      }
    }
  };

  const handleSave = async () => {
    try {
      await updateArticleField(article.id!, 'kommentarSales', kommentarSales);
      await updateArticleField(article.id!, 'kommentarSCM', kommentarSCM);
      alert('Änderungen gespeichert');
    } catch (error) {
      alert('Fehler beim Speichern');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-bottom">
      {/* Header */}
      <div className="bg-primary text-white px-6 py-4 pt-safe-top sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/articles')}
              className="p-1 hover:bg-blue-700 rounded"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">ARTIKEL-DETAILS</h1>
          </div>
          <span className="text-3xl">{statusIcon}</span>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
          <div>
            <label className="text-sm text-gray-600">Sparte</label>
            <p className="text-lg font-semibold">{article.sparte}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-600">Materialnummer (REF)</label>
            <p className="text-lg font-semibold">{article.materialnummer}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-600">Bezeichnung</label>
            <p className="text-base">{article.materialbezeichnung}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-600">Charge (LOT)</label>
            <p className="text-lg font-semibold">{article.charge || 'N/A'}</p>
          </div>
        </div>

        {/* Counting Section */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Zählung</h2>
          
          {/* SOLL */}
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-gray-700 font-medium">SOLL:</span>
            <span className="text-2xl font-bold text-gray-900">{article.soll}</span>
          </div>
          
          {/* IST Scan */}
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-gray-700 font-medium">IST Scan:</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleDecrement('istScan')}
                className="w-10 h-10 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                −
              </button>
              <span className="text-2xl font-bold text-gray-900 w-16 text-center">
                {article.istScan}
              </span>
              <button
                onClick={() => handleIncrement('istScan')}
                className="w-10 h-10 bg-primary text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Manuelle Zählung */}
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-gray-700 font-medium">Manuell:</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleDecrement('manuelleZaehlung')}
                className="w-10 h-10 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                −
              </button>
              <span className="text-2xl font-bold text-gray-900 w-16 text-center">
                {article.manuelleZaehlung}
              </span>
              <button
                onClick={() => handleIncrement('manuelleZaehlung')}
                className="w-10 h-10 bg-primary text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Gültige Zählung */}
          <div className="flex items-center justify-between py-3 border-b border-gray-400">
            <span className="text-gray-900 font-bold">Gültig:</span>
            <span className="text-2xl font-bold text-primary">
              {article.gueltigeZaehlung}
            </span>
          </div>
          
          {/* Abweichung */}
          <div className="flex items-center justify-between py-3">
            <span className="text-gray-900 font-bold">Abweichung:</span>
            <div className="flex items-center space-x-2">
              <span 
                className={`text-2xl font-bold ${
                  article.abweichung === 0 ? 'text-success' :
                  article.abweichung > 0 ? 'text-error' :
                  'text-warning'
                }`}
              >
                {article.abweichung}
              </span>
              {article.abweichung === 0 && (
                <span className="text-2xl">✓</span>
              )}
            </div>
          </div>
        </div>

        {/* Scan Button */}
        <button
          onClick={() => navigate('/scanner')}
          className="w-full bg-primary text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors shadow-md"
        >
          <span className="text-2xl">📷</span>
          <span>Diesen Artikel scannen</span>
        </button>

        {/* Auto Comment */}
        {article.autoKommentar && (
          <div className="bg-gray-100 rounded-lg p-4">
            <label className="text-sm text-gray-600 font-medium">Auto. Kommentar</label>
            <p className="text-sm text-gray-800 mt-1">{article.autoKommentar}</p>
          </div>
        )}

        {/* Comments */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-2">
              Kommentar Sales
            </label>
            <textarea
              value={kommentarSales}
              onChange={(e) => setKommentarSales(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              placeholder="Freitext für Sales..."
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-2">
              Kommentar SCM
            </label>
            <textarea
              value={kommentarSCM}
              onChange={(e) => setKommentarSCM(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              placeholder="Freitext für SCM..."
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-success text-white py-3 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 hover:bg-green-600 transition-colors"
        >
          <span className="text-xl">💾</span>
          <span>Speichern</span>
        </button>

        {/* Additional Info */}
        {article.serialnummer && (
          <div className="bg-gray-100 rounded-lg p-4">
            <label className="text-sm text-gray-600 font-medium">Serialnummer(n)</label>
            <p className="text-sm text-gray-800 mt-1">{article.serialnummer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

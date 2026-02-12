import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventoryStore } from '../stores/inventoryStore';
import { ArticleStatus } from '../types';

export default function ArticleList() {
  const navigate = useNavigate();
  const { articles, getArticleStatus } = useInventoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ArticleStatus | 'all'>('all');
  const [filterSparte, setFilterSparte] = useState<string>('all');

  // Get unique Sparten for filter
  const sparten = useMemo(() => {
    const uniqueSparten = Array.from(new Set(articles.map(a => a.sparte)));
    return uniqueSparten.sort();
  }, [articles]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          article.materialnummer.toLowerCase().includes(query) ||
          article.materialbezeichnung.toLowerCase().includes(query) ||
          article.charge.toLowerCase().includes(query) ||
          article.sparte.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        const status = getArticleStatus(article);
        if (status !== filterStatus) return false;
      }

      // Sparte filter
      if (filterSparte !== 'all') {
        if (article.sparte !== filterSparte) return false;
      }

      return true;
    });
  }, [articles, searchQuery, filterStatus, filterSparte, getArticleStatus]);

  const getStatusIcon = (status: ArticleStatus): string => {
    switch (status) {
      case 'complete': return '🟢';
      case 'partial': return '🟡';
      case 'missing': return '🔴';
      case 'open': return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-bottom">
      {/* Header */}
      <div className="bg-primary text-white px-6 py-4 pt-safe-top sticky top-0 z-10">
        <div className="flex items-center space-x-3 mb-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1 hover:bg-blue-700 rounded"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Artikelliste</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Artikel suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mt-3">
          <select
            value={filterSparte}
            onChange={(e) => setFilterSparte(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="all">Alle Sparten</option>
            {sparten.map(sparte => (
              <option key={sparte} value={sparte}>{sparte}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ArticleStatus | 'all')}
            className="flex-1 px-3 py-2 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="all">Alle Status</option>
            <option value="complete">Vollständig</option>
            <option value="partial">Teilweise</option>
            <option value="missing">Fehlbestand</option>
            <option value="open">Offen</option>
          </select>
        </div>
      </div>

      {/* Article List */}
      <div className="px-6 py-4">
        <div className="mb-3 text-sm text-gray-600">
          {filteredArticles.length} von {articles.length} Artikeln
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-lg font-semibold mb-2">Keine Artikel gefunden</p>
            <p className="text-sm">Passen Sie die Filter an oder suchen Sie nach anderen Begriffen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map(article => {
              const status = getArticleStatus(article);
              const statusIcon = getStatusIcon(status);
              
              return (
                <div
                  key={article.id}
                  onClick={() => navigate(`/articles/${article.id}`)}
                  className="bg-white rounded-lg shadow-sm p-4 border-l-4 cursor-pointer hover:shadow-md transition-shadow"
                  style={{
                    borderLeftColor: 
                      status === 'complete' ? '#10b981' :
                      status === 'partial' ? '#f59e0b' :
                      status === 'missing' ? '#ef4444' :
                      '#d1d5db'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xl">{statusIcon}</span>
                        <span className="font-semibold text-gray-900">
                          {article.materialnummer}
                        </span>
                        {article.charge && (
                          <span className="text-sm text-gray-500">
                            | LOT: {article.charge}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {article.materialbezeichnung}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-semibold">
                          IST: {article.gueltigeZaehlung}
                        </span>
                        <span className="text-gray-500">/</span>
                        <span>
                          SOLL: {article.soll}
                        </span>
                        {article.abweichung !== 0 && (
                          <>
                            <span className="text-gray-500">|</span>
                            <span 
                              className={
                                article.abweichung > 0 
                                  ? 'text-error font-semibold' 
                                  : 'text-warning font-semibold'
                              }
                            >
                              {article.abweichung > 0 ? 'Fehlbestand: ' : 'Überbestand: '}
                              {Math.abs(article.abweichung)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <svg 
                      className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/scanner')}
        className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-20"
        style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}

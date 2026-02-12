import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import ArticleList from './components/ArticleList';
import ArticleDetail from './components/ArticleDetail';
import StartScreen from './components/StartScreen';
import { useInventoryStore } from './stores/inventoryStore';

function App() {
  const { loadArticles, articles } = useInventoryStore();

  useEffect(() => {
    // Load articles from IndexedDB on mount
    loadArticles();
  }, [loadArticles]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/" 
            element={articles.length === 0 ? <StartScreen /> : <Navigate to="/dashboard" />} 
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/articles" element={<ArticleList />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

import { create } from 'zustand';
import { Article, Inventory, Statistics, ArticleStatus, ScanHistory } from '../types';
import { 
  db, 
  saveArticle, 
  updateArticle, 
  getAllArticles,
  addScanHistory
} from '../db/database';
import { updateArticleCalculations } from '../utils/excelHandler';

interface InventoryState {
  // Current inventory
  currentInventory: Inventory | null;
  articles: Article[];
  scanHistory: ScanHistory[];
  
  // UI state
  isScanning: boolean;
  flashlightOn: boolean;
  
  // Statistics
  statistics: Statistics;
  
  // Actions
  setCurrentInventory: (inventory: Inventory) => void;
  loadArticles: () => Promise<void>;
  importArticles: (articles: Article[]) => Promise<void>;
  findArticle: (lot: string, ref?: string) => Article | null;
  incrementArticleScan: (articleId: number) => Promise<void>;
  updateArticleManual: (articleId: number, manualCount: number) => Promise<void>;
  updateArticleField: (articleId: number, field: keyof Article, value: any) => Promise<void>;
  calculateStatistics: () => void;
  setScanning: (scanning: boolean) => void;
  toggleFlashlight: () => void;
  addToScanHistory: (history: Omit<ScanHistory, 'id'>) => Promise<void>;
  getArticleStatus: (article: Article) => ArticleStatus;
  undoLastScan: () => Promise<void>;
  resetInventory: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  currentInventory: null,
  articles: [],
  scanHistory: [],
  isScanning: false,
  flashlightOn: false,
  statistics: {
    total: 0,
    complete: 0,
    partial: 0,
    missing: 0,
    open: 0
  },

  setCurrentInventory: (inventory) => {
    set({ currentInventory: inventory });
  },

  loadArticles: async () => {
    try {
      const articles = await getAllArticles();
      set({ articles });
      get().calculateStatistics();
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  },

  importArticles: async (newArticles) => {
    try {
      // Clear existing articles
      await db.articles.clear();
      
      // Save new articles
      const savedArticles: Article[] = [];
      for (const article of newArticles) {
        const id = await saveArticle(article);
        savedArticles.push({ ...article, id });
      }
      
      set({ articles: savedArticles });
      get().calculateStatistics();
    } catch (error) {
      console.error('Error importing articles:', error);
      throw error;
    }
  },

  findArticle: (lot, ref) => {
    const { articles } = get();
    
    // First try to match by LOT
    if (lot) {
      const byLot = articles.find(a => a.charge === lot);
      if (byLot) return byLot;
    }
    
    // Fallback to REF
    if (ref) {
      const byRef = articles.find(a => a.materialnummer === ref);
      if (byRef) return byRef;
    }
    
    return null;
  },

  incrementArticleScan: async (articleId) => {
    try {
      const { articles } = get();
      const article = articles.find(a => a.id === articleId);
      
      if (!article) {
        throw new Error('Article not found');
      }
      
      const updated = updateArticleCalculations({
        ...article,
        istScan: article.istScan + 1
      });
      
      await updateArticle(articleId, updated);
      
      set({
        articles: articles.map(a => a.id === articleId ? updated : a)
      });
      
      get().calculateStatistics();
    } catch (error) {
      console.error('Error incrementing article scan:', error);
      throw error;
    }
  },

  updateArticleManual: async (articleId, manualCount) => {
    try {
      const { articles } = get();
      const article = articles.find(a => a.id === articleId);
      
      if (!article) {
        throw new Error('Article not found');
      }
      
      const updated = updateArticleCalculations({
        ...article,
        manuelleZaehlung: manualCount
      });
      
      await updateArticle(articleId, updated);
      
      set({
        articles: articles.map(a => a.id === articleId ? updated : a)
      });
      
      get().calculateStatistics();
    } catch (error) {
      console.error('Error updating manual count:', error);
      throw error;
    }
  },

  updateArticleField: async (articleId, field, value) => {
    try {
      const { articles } = get();
      const article = articles.find(a => a.id === articleId);
      
      if (!article) {
        throw new Error('Article not found');
      }
      
      const updated = {
        ...article,
        [field]: value
      };
      
      await updateArticle(articleId, updated);
      
      set({
        articles: articles.map(a => a.id === articleId ? updated : a)
      });
    } catch (error) {
      console.error('Error updating article field:', error);
      throw error;
    }
  },

  calculateStatistics: () => {
    const { articles } = get();
    
    const stats: Statistics = {
      total: articles.length,
      complete: 0,
      partial: 0,
      missing: 0,
      open: 0
    };
    
    articles.forEach(article => {
      const status = get().getArticleStatus(article);
      switch (status) {
        case 'complete':
          stats.complete++;
          break;
        case 'partial':
          stats.partial++;
          break;
        case 'missing':
          stats.missing++;
          break;
        case 'open':
          stats.open++;
          break;
      }
    });
    
    set({ statistics: stats });
  },

  setScanning: (scanning) => {
    set({ isScanning: scanning });
  },

  toggleFlashlight: () => {
    set((state) => ({ flashlightOn: !state.flashlightOn }));
  },

  addToScanHistory: async (history) => {
    try {
      const id = await addScanHistory(history as ScanHistory);
      set((state) => ({
        scanHistory: [{ ...history, id } as ScanHistory, ...state.scanHistory]
      }));
    } catch (error) {
      console.error('Error adding scan history:', error);
    }
  },

  getArticleStatus: (article): ArticleStatus => {
    if (article.abweichung === 0 && article.soll > 0) {
      return 'complete';
    } else if (article.istScan > 0 && article.abweichung !== 0) {
      return 'partial';
    } else if (article.istScan === 0 && article.abweichung > 0) {
      return 'missing';
    } else {
      return 'open';
    }
  },

  undoLastScan: async () => {
    try {
      const { scanHistory, articles } = get();
      
      if (scanHistory.length === 0) {
        throw new Error('No scans to undo');
      }
      
      const lastScan = scanHistory[0];
      const article = articles.find(a => a.id === lastScan.articleId);
      
      if (!article) {
        throw new Error('Article not found');
      }
      
      if (article.istScan > 0) {
        const updated = updateArticleCalculations({
          ...article,
          istScan: article.istScan - 1
        });
        
        await updateArticle(article.id!, updated);
        
        set({
          articles: articles.map(a => a.id === article.id ? updated : a),
          scanHistory: scanHistory.slice(1)
        });
        
        get().calculateStatistics();
      }
    } catch (error) {
      console.error('Error undoing last scan:', error);
      throw error;
    }
  },

  resetInventory: () => {
    set({
      currentInventory: null,
      articles: [],
      scanHistory: [],
      isScanning: false,
      flashlightOn: false,
      statistics: {
        total: 0,
        complete: 0,
        partial: 0,
        missing: 0,
        open: 0
      }
    });
  }
}));

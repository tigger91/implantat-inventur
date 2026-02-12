import Dexie, { Table } from 'dexie';
import { Article, Inventory, ScanHistory } from '../types';

export class InventoryDatabase extends Dexie {
  inventories!: Table<Inventory, number>;
  articles!: Table<Article, number>;
  scanHistory!: Table<ScanHistory, number>;

  constructor() {
    super('ImplantatInventurDB');
    
    this.version(1).stores({
      inventories: '++id, name, date, lastModified',
      articles: '++id, materialnummer, charge, sparte',
      scanHistory: '++id, inventoryId, articleId, timestamp'
    });
  }
}

export const db = new InventoryDatabase();

// Database helper functions
export const saveInventory = async (inventory: Inventory): Promise<number> => {
  const id = await db.inventories.add({
    ...inventory,
    lastModified: new Date()
  });
  return id;
};

export const updateInventory = async (id: number, inventory: Partial<Inventory>): Promise<void> => {
  await db.inventories.update(id, {
    ...inventory,
    lastModified: new Date()
  });
};

export const getInventory = async (id: number): Promise<Inventory | undefined> => {
  return await db.inventories.get(id);
};

export const getAllInventories = async (): Promise<Inventory[]> => {
  return await db.inventories.toArray();
};

export const deleteInventory = async (id: number): Promise<void> => {
  await db.inventories.delete(id);
  // Also delete related scan history
  await db.scanHistory.where('inventoryId').equals(id).delete();
};

export const saveArticle = async (article: Article): Promise<number> => {
  const id = await db.articles.add(article);
  return id;
};

export const updateArticle = async (id: number, article: Partial<Article>): Promise<void> => {
  await db.articles.update(id, article);
};

export const getArticle = async (id: number): Promise<Article | undefined> => {
  return await db.articles.get(id);
};

export const getAllArticles = async (): Promise<Article[]> => {
  return await db.articles.toArray();
};

export const findArticleByLot = async (lot: string): Promise<Article | undefined> => {
  return await db.articles.where('charge').equals(lot).first();
};

export const findArticleByRef = async (ref: string): Promise<Article | undefined> => {
  return await db.articles.where('materialnummer').equals(ref).first();
};

export const addScanHistory = async (history: ScanHistory): Promise<number> => {
  const id = await db.scanHistory.add(history);
  return id;
};

export const getScanHistory = async (inventoryId: number): Promise<ScanHistory[]> => {
  return await db.scanHistory
    .where('inventoryId')
    .equals(inventoryId)
    .reverse()
    .sortBy('timestamp');
};

export const clearAllData = async (): Promise<void> => {
  await db.inventories.clear();
  await db.articles.clear();
  await db.scanHistory.clear();
};

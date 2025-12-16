import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Article } from "@/types/article";


// CachedArticle type definition
export type CachedArticle = {
  slug: string;
  content: string;
  article: Article;
  updatedAt: string; // ISO date string
  cached: boolean;
};


interface CachedArticlesDB extends DBSchema {
  articles: {
    key: string;
    value: CachedArticle;
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

let dbPromise: Promise<IDBPDatabase<CachedArticlesDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CachedArticlesDB>('cached-articles-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('articles')) {
          db.createObjectStore('articles', { keyPath: 'slug' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export async function createCachedArticle(article: Omit<CachedArticle, 'updatedAt' | 'cached'>): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  await db.add('articles', { ...article, updatedAt: now, cached: true });
  await cleanupIfNeeded();
}


export async function updateOrCreateCachedArticle(article: Omit<CachedArticle, 'updatedAt' | 'cached'>): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  await db.put('articles', { ...article, updatedAt: now, cached: true });
  await cleanupIfNeeded();
}

export async function listAllCachedArticles(): Promise<CachedArticle[]> {
  const db = await getDB();
  return db.getAll('articles');
}

export async function getCachedArticleBySlug(slug: string): Promise<CachedArticle | undefined> {
  const db = await getDB();
  return db.get('articles', slug);
}

export async function cleanupIfNeeded(): Promise<number | null> {
  const db = await getDB();
  const tx = db.transaction([ 'meta', 'articles' ], 'readwrite');
  const metaStore = tx.objectStore('meta');
  const lastCleanupEntry = await metaStore.get('lastCleanup');
  const now = Date.now();
  const twelveHoursMs = 12 * 60 * 60 * 1000;
  let lastCleanup = 0;
  if (lastCleanupEntry && lastCleanupEntry.value) {
    lastCleanup = parseInt(lastCleanupEntry.value, 10);
  }
  if (now - lastCleanup > twelveHoursMs) {
    // Run cleanup
    const articlesStore = tx.objectStore('articles');
    const allArticles = await articlesStore.getAll();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    for (const article of allArticles) {
      const updatedAt = new Date(article.updatedAt).getTime();
      if (now - updatedAt > sevenDaysMs) {
        await articlesStore.delete(article.slug);
        deletedCount++;
      }
    }
    await metaStore.put({ key: 'lastCleanup', value: now.toString() });
    await tx.done;
    return deletedCount;
  } else {
    await tx.done;
    return null;
  }
}

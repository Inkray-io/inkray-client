import { defaultCache } from "@serwist/next/worker";
import { NetworkOnly, PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { updateOrCreateCachedArticle } from './lib/idb';
import { CONFIG } from "@/lib/config";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Matches the "injectionPoint" used by @serwist/next.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const precacheEntries = [
  ...(self.__SW_MANIFEST || [])
];

const urlsToCache = [];
const routesToFilter = [ '/feed/articles' ];

const serwist = new Serwist({
  skipWaiting: true,
  precacheEntries,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    ignoreURLParametersMatching: [ /.*/ ],
  },
  runtimeCaching: [
    {
      matcher({ url }) {
        const apiUrl = new URL(CONFIG.API_URL);
        return apiUrl.host === url.host && routesToFilter.includes(url.pathname);
      },
      handler: new NetworkOnly(),
    },
    ...defaultCache
  ],
});


self.addEventListener('install', (event) => {
  event.waitUntil(
      Promise.all(
          urlsToCache.map((url) => {
                return serwist.handleRequest({
                  request: new Request(url),
                  event
                })
              }
          )
      )
  );
});

self.addEventListener('message', async (event) => {
  const data = event.data;
  if (data && data.type === 'CACHE_ARTICLE') {
    // Save the article to IndexedDB
    const { slug, content, article } = data.cachedArticle ?? {};
    if (slug && content && article) {
      await updateOrCreateCachedArticle({
        slug,
        content,
        article
      }).catch((err) => {
        console.error('Failed to cache article in IDB:', err);
      });
    }
  }
});

// Finally attach all the SW event listeners.
serwist.addEventListeners();

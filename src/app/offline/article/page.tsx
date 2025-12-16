'use client';
import { AppLayout } from "@/components/layout";
import { useState, useEffect, Suspense } from "react";
import { Info } from "lucide-react";
import { CachedArticle, getCachedArticleBySlug } from "@/lib/idb";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ArticleSkeleton } from "@/components/article/ArticleSkeleton";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";


export default function OfflineArticlePage() {
  return (
      <Suspense>
        <OfflineArticleComponent/>
      </Suspense>
  );
}

function OfflineArticleComponent() {
  const searchParams = useSearchParams();
  const [ cachedArticle, setCachedArticle ] = useState<CachedArticle | null>(null);
  const [ loadingArticle, setLoadingArticle ] = useState(true);

  const loadCachedArticle = async (id: string) => {
    setLoadingArticle(true);
    try {
      const article = await getCachedArticleBySlug(id);
      setCachedArticle(article || null);
    } finally {
      setLoadingArticle(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      loadCachedArticle(id);
    } else {
      setLoadingArticle(false);
    }
  }, [ searchParams ]);


  if (loadingArticle) {
    return (
        <RequireAuth redirectTo="/">
          <AppLayout currentPage="feed">
            <div className="max-w-4xl mx-auto py-8 space-y-6">
              {/* Back Button Skeleton */}
              <div className="flex items-center gap-4">
                <div className="h-9 w-32 bg-accent animate-pulse rounded-md"/>
              </div>
              <ArticleSkeleton/>
            </div>
          </AppLayout>
        </RequireAuth>
    );
  }

  return (
      <AppLayout
          currentPage="feed"
          showRightSidebar={false}
      >
        <div className="space-y-6">
          {/* Offline Info Section */}
          <div className="bg-blue-50 rounded-2xl p-6 flex items-center justify-start gap-3">
            <Info className="w-8 h-8 text-blue-600"/>
            <div className="text-sm text-blue-700">
              You are viewing a cached version of this article. {cachedArticle?.updatedAt && (
                <span>
                  Last update was {formatDistanceToNow(new Date(cachedArticle.updatedAt), { addSuffix: true })}.
                </span>
            )}
            </div>
          </div>

          {cachedArticle && (
              <div className="space-y-6">
                {/* Unified Article Container */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8">
                  <div className="space-y-6">
                    {/* Article Metadata */}
                    <div className="space-y-4">
                      {/* Article Title */}
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-black leading-tight">
                        {cachedArticle.article.title || 'Untitled Article'}
                      </h1>

                      {/* Article Summary */}
                      {cachedArticle.article.summary && (
                          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                            {cachedArticle.article.summary}
                          </p>
                      )}

                      {/* Article Highlights */}
                      {cachedArticle.article.highlights && cachedArticle.article.highlights.length > 0 && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                              Key Highlights
                            </h3>
                            <ul className="space-y-2">
                              {cachedArticle.article.highlights.map((highlight, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className="text-primary mt-1.5 text-sm">•</span>
                                    <span
                                        className="text-gray-700 text-sm sm:text-base">{highlight}</span>
                                  </li>
                              ))}
                            </ul>
                          </div>
                      )}
                    </div>
                    <div className="border-t border-gray-100 pt-6">
                      <div className="prose prose-base sm:prose-lg max-w-none">
                        <ReactMarkdown
                            components={{
                              // Custom styling for markdown elements
                              h1: ({ children }) => <h1
                                  className="text-xl sm:text-2xl font-semibold mb-4 text-black">{children}</h1>,
                              h2: ({ children }) => <h2
                                  className="text-lg sm:text-xl font-semibold mb-3 mt-6 text-black">{children}</h2>,
                              h3: ({ children }) => <h3
                                  className="text-base sm:text-lg font-semibold mb-2 mt-4 text-black">{children}</h3>,
                              p: ({ children }) => <p
                                  className="mb-4 text-gray-700 text-base sm:text-lg leading-relaxed">{children}</p>,
                              strong: ({ children }) => <strong
                                  className="font-semibold text-black">{children}</strong>,
                              em: ({ children }) => <em
                                  className="italic text-gray-600">{children}</em>,
                              code: ({ children }) => (
                                  <code
                                      className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-800">
                                    {children}
                                  </code>
                              ),
                              pre: ({ children }) => (
                                  <pre
                                      className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-3 text-sm">
                                {children}
                              </pre>
                              ),
                            }}
                        >
                          {cachedArticle.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          )}
        </div>
      </AppLayout>
  );
};

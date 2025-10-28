import React from 'react';
import Link from 'next/link';
import { FeedArticle } from '@/types/article';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Lock } from 'lucide-react';
import { TipButton } from './TipButton';
import { TipDisplay } from '@/components/ui/TipDisplay';

interface ArticleCardProps {
  article: FeedArticle;
}

/**
 * Article card component for displaying article previews in feeds
 * 
 * Shows article title, summary, author info, and metadata in a card layout.
 * Optimized for feed display with responsive design.
 */
export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Allow normal link behavior
    e.stopPropagation();
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <Link 
          href={`/article?id=${article.slug}`}
          className="block space-y-4"
          onClick={handleCardClick}
        >
          {/* Article Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h3>
              {article.gated && (
                <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
              )}
            </div>
            
            {article.summary && (
              <p className="text-muted-foreground leading-relaxed line-clamp-3">
                {article.summary}
              </p>
            )}
          </div>

          {/* Article Metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{article.authorShortAddress}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{article.timeAgo}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {article.gated && (
                <Badge variant="outline" className="text-xs">
                  Premium
                </Badge>
              )}
              
              {article.category && (
                <Badge variant="secondary" className="text-xs">
                  {article.category.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Engagement Metrics (if available) */}
          {article.engagement && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
              {article.engagement.views > 0 && (
                <span>{article.engagement.views} views</span>
              )}
              {article.engagement.likes > 0 && (
                <span>{article.engagement.likes} likes</span>
              )}
              {article.engagement.comments > 0 && (
                <span>{article.engagement.comments} comments</span>
              )}
            </div>
          )}
        </Link>

        {/* Tip Display and Button Section */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <TipDisplay amount={article.totalTips || 0} size="sm" />
          <TipButton 
            publicationId={article.publicationId}
            articleTitle={article.title}
          />
        </div>
      </CardContent>
    </Card>
  );
};
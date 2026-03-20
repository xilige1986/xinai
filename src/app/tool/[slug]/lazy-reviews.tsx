'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';

// 动态导入 ReviewsSection
const ReviewsSection = dynamic(
  () => import('@/components/reviews-section').then((mod) => ({ default: mod.ReviewsSection })),
  {
    loading: () => (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    ),
  }
);

interface LazyReviewsSectionProps {
  toolId: number;
}

export function LazyReviewsSection({ toolId }: LazyReviewsSectionProps) {
  return <ReviewsSection toolId={toolId} />;
}

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Heart, Eye } from 'lucide-react';
import type { Tool } from '@/types';
import { pricingTypeStyles } from '@/types';

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const pricingStyle = pricingTypeStyles[tool.pricingType] || pricingTypeStyles.Free;

  return (
    <Card className="group h-full bg-white hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-border/50 hover:border-primary/30 rounded-xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/tool/${tool.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
            {tool.imageUrl ? (
              <img
                src={tool.imageUrl}
                alt={tool.name}
                className="w-12 h-12 rounded-xl object-cover border border-border/50"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-lg font-bold text-primary border border-primary/20">
                {tool.name[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                {tool.name}
              </h3>
              {tool.category && (
                <p className="text-xs text-muted-foreground truncate">
                  {tool.category.name}
                </p>
              )}
            </div>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {tool.shortDesc}
        </p>

        {/* 分类和使用场景标签 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tool.subCategory && (
            <span className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary">
              {tool.subCategory.name}
            </span>
          )}
          {tool.useCase && (
            <span className="px-2 py-0.5 text-xs rounded-md bg-muted/50 text-muted-foreground">
              {tool.useCase.name}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className={`text-xs font-medium ${pricingStyle.className} border-0 bg-opacity-10`}>
            {pricingStyle.label}
          </Badge>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {tool.views}
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              {tool.likes}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/tool/${tool.slug}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full rounded-lg border-border hover:bg-muted/50">
              查看详情
            </Button>
          </Link>
          <a
            href={tool.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button size="sm" className="w-full rounded-lg gradient-primary hover:opacity-90">
              访问
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

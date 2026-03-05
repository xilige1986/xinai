import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Video, FileText, Briefcase, Image, Settings,
  Palette, Music, Code, Sparkles, ArrowRight
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Video,
  FileText,
  Briefcase,
  Image,
  Settings,
  Palette,
  Music,
  Code,
  Sparkles,
};

interface SubCategory {
  id: number;
  name: string;
  slug: string;
}

interface CategorySectionProps {
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  toolCount: number;
  subCategories: SubCategory[];
}

export function CategorySection({
  name,
  slug,
  description,
  icon,
  toolCount,
  subCategories,
}: CategorySectionProps) {
  const IconComponent = icon && iconMap[icon] ? iconMap[icon] : Sparkles;

  return (
    <Link href={`/category/${slug}`}>
      <Card className="group h-full bg-white hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30 rounded-xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary border border-primary/10">
              <IconComponent className="h-5 w-5" />
            </div>
            <Badge variant="secondary" className="text-xs font-medium bg-muted/50 text-muted-foreground">
              {toolCount} 个工具
            </Badge>
          </div>

          <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {description}
          </p>

          {/* 子分类标签 */}
          {subCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {subCategories.slice(0, 3).map((sub) => (
                <span
                  key={sub.slug}
                  className="px-2 py-0.5 text-xs rounded-md bg-muted/50 text-muted-foreground"
                >
                  {sub.name}
                </span>
              ))}
              {subCategories.length > 3 && (
                <span className="px-2 py-0.5 text-xs rounded-md bg-muted/50 text-muted-foreground">
                  +{subCategories.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            浏览工具
            <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

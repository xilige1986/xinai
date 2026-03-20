import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import type { Sponsor } from '@/lib/sponsors';

interface SponsorsCardProps {
  sponsors: Sponsor[];
}

export function SponsorsCard({ sponsors }: SponsorsCardProps) {
  if (sponsors.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
        >
          赞助商
        </Badge>
      </div>
      <div className="space-y-3">
        {sponsors.map((sponsor) => (
          <Link key={sponsor.id} href={sponsor.link} className="block">
            <div className="bg-white dark:bg-background rounded-lg p-3 border border-amber-200/50 dark:border-amber-800/50 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${sponsor.iconBg} flex items-center justify-center text-white font-bold text-sm`}
                >
                  {sponsor.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{sponsor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {sponsor.description}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/tools">
        <Button variant="outline" size="sm" className="w-full mt-3">
          查看更多工具
          <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </Link>
    </div>
  );
}

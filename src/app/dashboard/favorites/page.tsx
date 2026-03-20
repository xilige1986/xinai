import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolCard } from '@/components/tool-card';
import { ArrowLeft, Heart } from 'lucide-react';

async function getUserFavorites(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      favorites: {
        where: { status: 1 },
        include: {
          category: true,
          subCategory: true,
          useCase: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  return user?.favorites || [];
}

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id as string);
  const favorites = await getUserFavorites(userId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">我的收藏</h1>
            <p className="text-muted-foreground">
              共收藏 {favorites.length} 个工具
            </p>
          </div>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-16">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无收藏</h3>
              <p className="text-muted-foreground mb-6">
                您还没有收藏任何AI工具，快去发现感兴趣的工具吧！
              </p>
              <Link href="/tools">
                <Button className="gradient-primary hover:opacity-90">
                  浏览AI工具
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

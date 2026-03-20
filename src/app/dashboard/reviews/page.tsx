import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  MessageSquare,
  Star,
  Newspaper,
  Wrench,
  Edit,
} from 'lucide-react';

// 获取用户工具点评
async function getUserToolReviews(userId: number) {
  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      tool: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return reviews;
}

// 获取用户资讯评论
async function getUserNewsComments(userId: number) {
  const comments = await prisma.comment.findMany({
    where: { userId },
    include: {
      news: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return comments;
}

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id as string);
  const [toolReviews, newsComments] = await Promise.all([
    getUserToolReviews(userId),
    getUserNewsComments(userId),
  ]);

  const totalCount = toolReviews.length + newsComments.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">我的评论</h1>
            <p className="text-muted-foreground mt-1">
              共 {totalCount} 条评论
            </p>
          </div>
        </div>

        {/* Reviews Tabs */}
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                工具点评
                <span className="ml-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {toolReviews.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                资讯评论
                <span className="ml-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {newsComments.length}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Tool Reviews */}
            <TabsContent value="tools">
              {toolReviews.length > 0 ? (
                <div className="space-y-4">
                  {toolReviews.map((review) => (
                    <Card key={`tool-${review.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Link href={`/tool/${review.tool.slug}`}>
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                              {review.tool.imageUrl ? (
                                <img
                                  src={review.tool.imageUrl}
                                  alt={review.tool.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-lg">
                                  {review.tool.name[0]}
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <Link href={`/tool/${review.tool.slug}`}>
                                <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                                  {review.tool.name}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium text-yellow-700">
                                  {review.rating}
                                </span>
                              </div>
                            </div>
                            <p className="text-muted-foreground mb-3">
                              {review.content}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                评论于 {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                              </p>
                              <Link href={`/tool/${review.tool.slug}`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  编辑
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Wrench className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">暂无工具点评</h3>
                    <p className="text-muted-foreground mb-6">
                      您还没有对任何工具发表过评论
                    </p>
                    <Link href="/tools">
                      <Button>去浏览工具</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* News Comments */}
            <TabsContent value="news">
              {newsComments.length > 0 ? (
                <div className="space-y-4">
                  {newsComments.map((comment) => (
                    <Card key={`news-${comment.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Link href={`/news/${comment.news.slug}`}>
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                              {comment.news.coverImage ? (
                                <img
                                  src={comment.news.coverImage}
                                  alt={comment.news.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 font-bold text-lg">
                                  <Newspaper className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <Link href={`/news/${comment.news.slug}`}>
                                <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
                                  {comment.news.title}
                                </h3>
                              </Link>
                            </div>
                            <p className="text-muted-foreground mb-3">
                              {comment.content}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                评论于 {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                              </p>
                              <Link href={`/news/${comment.news.slug}`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  编辑
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Newspaper className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">暂无资讯评论</h3>
                    <p className="text-muted-foreground mb-6">
                      您还没有对任何资讯发表过评论
                    </p>
                    <Link href="/news">
                      <Button>去浏览资讯</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}


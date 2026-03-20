import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ArrowLeft, CreditCard, Shield, Clock, CheckCircle } from 'lucide-react';
import { PurchaseForm } from './PurchaseForm';

interface PurchasePageProps {
  params: Promise<{ slug: string }>;
}

async function getCourse(slug: string) {
  const course = await prisma.course.findUnique({
    where: { slug, status: 1 },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      price: true,
      originalPrice: true,
      description: true,
      duration: true,
      lessonCount: true,
    },
  });
  return course;
}

export async function generateMetadata({ params }: PurchasePageProps) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) {
    return { title: '课程未找到' };
  }

  return {
    title: `购买课程 - ${course.title}`,
    description: `购买 ${course.title}，开启您的AI学习之旅`,
  };
}

export default async function PurchasePage({ params }: PurchasePageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);

  // 未登录，重定向到登录页
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/courses/${slug}/purchase`);
  }

  const course = await getCourse(slug);

  if (!course) {
    notFound();
  }

  // 免费课程无需购买
  if (course.price === 0) {
    redirect(`/courses/${slug}`);
  }

  const userId = parseInt(session.user.id);

  // 检查是否已购买
  const existingOrder = await prisma.order.findFirst({
    where: {
      userId,
      courseId: course.id,
      status: 1, // 已支付
    },
  });

  if (existingOrder) {
    // 已购买，重定向到课程页
    redirect(`/courses/${slug}?purchased=true`);
  }

  // 检查是否有未支付的订单
  const pendingOrder = await prisma.order.findFirst({
    where: {
      userId,
      courseId: course.id,
      status: 0, // 待支付
    },
  });

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <Link href={`/courses/${slug}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回课程详情
          </Button>
        </Link>

        {/* Course Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>确认订单信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                {course.coverImage ? (
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <span className="text-primary/50">无封面</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg">{course.title}</h2>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{course.duration} 小时</span>
                  <span>{course.lessonCount} 课时</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>订单金额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">课程价格</span>
                <span className="text-muted-foreground line-through">
                  ¥{course.originalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">优惠价格</span>
                <span className="text-primary font-semibold text-xl">
                  ¥{course.price.toFixed(2)}
                </span>
              </div>
              {course.originalPrice > course.price && (
                <div className="flex justify-between items-center text-green-600">
                  <span>节省</span>
                  <span>
                    ¥{(course.originalPrice - course.price).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">应付总额</span>
                  <span className="text-primary font-bold text-2xl">
                    ¥{course.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <PurchaseForm
          courseId={course.id}
          price={course.price}
          courseTitle={course.title}
          existingOrderNo={pendingOrder?.orderNo}
        />

        {/* Guarantees */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center">
            <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">安全支付</p>
          </div>
          <div className="text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">即时开通</p>
          </div>
          <div className="text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">永久观看</p>
          </div>
        </div>
      </div>
    </div>
  );
}

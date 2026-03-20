'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Lock,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Coins,
  Loader2,
  CheckCircle,
  PlayCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface CoursePurchaseCardProps {
  course: {
    id: number;
    slug: string;
    title: string;
    price: number;
    originalPrice: number;
    buyUrl: string;
    allowMoneyPurchase: boolean;
    allowPointsPurchase: boolean;
    pointsRequired: number;
  };
  hasAccess: boolean;
  userPoints?: number;
  isLoggedIn: boolean;
  firstLessonId?: number;
  variant?: 'default' | 'compact' | 'light';
}

export default function CoursePurchaseCard({
  course,
  hasAccess,
  userPoints = 0,
  isLoggedIn,
  firstLessonId,
  variant = 'default',
}: CoursePurchaseCardProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Compact variant for hero section
  if (variant === 'compact' || variant === 'light') {
    // 免费课程或已有权限
    if (hasAccess) {
      if (firstLessonId) {
        return (
          <Button
            size="lg"
            className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg text-base px-8"
            asChild
          >
            <Link href={`/learn/lesson/${firstLessonId}`}>
              <PlayCircle className="mr-2 h-5 w-5" />
              开始学习
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        );
      }

      return (
        <Button
          size="lg"
          className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg text-base px-8"
          asChild
        >
          <a href={course.buyUrl} target="_blank" rel="noopener noreferrer">
            <GraduationCap className="mr-2 h-5 w-5" />
            立即学习
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      );
    }

    // 未登录
    if (!isLoggedIn) {
      return (
        <Button
          size="lg"
          className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg text-base px-8"
          asChild
        >
          <Link href={`/login?callbackUrl=/courses/${course.slug}`}>
            <Lock className="mr-2 h-5 w-5" />
            登录后购买
          </Link>
        </Button>
      );
    }

    const handleUnlockWithPoints = async () => {
      if (userPoints < course.pointsRequired) {
        toast.error('积分不足', {
          description: `需要 ${course.pointsRequired} 积分，您当前有 ${userPoints} 积分`,
        });
        return;
      }

      setIsUnlocking(true);
      try {
        const response = await fetch(`/api/courses/${course.id}/unlock`, {
          method: 'POST',
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('兑换成功', {
            description: `消耗了 ${data.consumedPoints} 积分，现在可以学习课程了！`,
          });
          window.location.reload();
        } else {
          toast.error(data.error || '兑换失败');
        }
      } catch (error) {
        toast.error('网络错误，请稍后重试');
      } finally {
        setIsUnlocking(false);
      }
    };

    const hasMoneyOption = course.allowMoneyPurchase && course.price > 0;
    const hasPointsOption = course.allowPointsPurchase && course.pointsRequired > 0;
    const canAffordPoints = userPoints >= course.pointsRequired;

    return (
      <div className="flex flex-wrap items-center gap-3">
        {hasMoneyOption && (
          <Button
            size="lg"
            className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg text-base px-8"
            asChild
          >
            <Link href={`/courses/${course.slug}/purchase`}>
              <DollarSign className="mr-2 h-5 w-5" />
              立即购买
            </Link>
          </Button>
        )}

        {hasPointsOption && (
          <Button
            size="lg"
            variant="outline"
            className="border-white/50 text-white hover:bg-white/10 bg-transparent text-base px-8"
            onClick={handleUnlockWithPoints}
            disabled={isUnlocking || !canAffordPoints}
          >
            {isUnlocking ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                兑换中...
              </>
            ) : (
              <>
                <Coins className="mr-2 h-5 w-5" />
                {course.pointsRequired} 积分兑换
              </>
            )}
          </Button>
        )}

        {!hasMoneyOption && !hasPointsOption && course.price === 0 && (
          <Button
            size="lg"
            className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg text-base px-8"
            asChild
          >
            <Link href={`/courses/${course.slug}/purchase`}>
              <GraduationCap className="mr-2 h-5 w-5" />
              免费获取
            </Link>
          </Button>
        )}
      </div>
    );
  }

  // 免费课程或已有权限
  if (hasAccess) {
    if (firstLessonId) {
      return (
        <Card className="sticky top-4 border-green-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium text-lg">已解锁</span>
            </div>
            <p className="text-center text-green-100 text-sm mt-1">您已获得该课程的学习权限</p>
          </div>
          <CardContent className="p-6">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:opacity-90 shadow-md"
              asChild
            >
              <Link href={`/learn/lesson/${firstLessonId}`}>
                <PlayCircle className="mr-2 h-5 w-5" />
                开始学习
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="sticky top-4 border-green-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium text-lg">已解锁</span>
          </div>
          <p className="text-center text-green-100 text-sm mt-1">您已获得该课程的学习权限</p>
        </div>
        <CardContent className="p-6">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:opacity-90 shadow-md"
            asChild
          >
            <a href={course.buyUrl} target="_blank" rel="noopener noreferrer">
              <GraduationCap className="mr-2 h-5 w-5" />
              立即学习
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 未登录 - 显示价格但按钮提示登录
  if (!isLoggedIn) {
    const hasMoneyOption = course.allowMoneyPurchase && course.price > 0;
    const hasPointsOption = course.allowPointsPurchase && course.pointsRequired > 0;

    return (
      <Card className="sticky top-4 border-2 border-primary/20">
        <CardContent className="p-6 space-y-4">
          {/* 价格显示 */}
          {hasMoneyOption && (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                ¥{course.price.toFixed(2)}
              </span>
              {course.originalPrice > course.price && (
                <span className="text-muted-foreground line-through text-lg">
                  ¥{course.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          )}

          {/* 积分显示 */}
          {hasPointsOption && (
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-purple-600" />
              <span className="text-xl font-bold text-purple-600">
                {course.pointsRequired} 积分
              </span>
            </div>
          )}

          {/* 免费课程 */}
          {!hasMoneyOption && !hasPointsOption && course.price === 0 && (
            <span className="text-2xl font-bold text-green-600">免费</span>
          )}

          <Button
            size="lg"
            className="w-full gradient-primary hover:opacity-90"
            asChild
          >
            <Link href={`/login?callbackUrl=/courses/${course.slug}`}>
              <Lock className="mr-2 h-5 w-5" />
              登录后购买
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleUnlockWithPoints = async () => {
    if (userPoints < course.pointsRequired) {
      toast.error('积分不足', {
        description: `需要 ${course.pointsRequired} 积分，您当前有 ${userPoints} 积分`,
      });
      return;
    }

    setIsUnlocking(true);
    try {
      const response = await fetch(`/api/courses/${course.id}/unlock`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('兑换成功', {
          description: `消耗了 ${data.consumedPoints} 积分，现在可以学习课程了！`,
        });
        // 刷新页面
        window.location.reload();
      } else {
        toast.error(data.error || '兑换失败');
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试');
    } finally {
      setIsUnlocking(false);
    }
  };

  // 显示购买选项
  const hasMoneyOption = course.allowMoneyPurchase && course.price > 0;
  const hasPointsOption = course.allowPointsPurchase && course.pointsRequired > 0;
  const canAffordPoints = userPoints >= course.pointsRequired;

  return (
    <Card className="sticky top-4 border-2 border-primary/20">
      <CardContent className="p-6 space-y-4">
        {/* 资金购买选项 */}
        {hasMoneyOption && (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                ¥{course.price.toFixed(2)}
              </span>
              {course.originalPrice > course.price && (
                <span className="text-muted-foreground line-through text-lg">
                  ¥{course.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <Button
              size="lg"
              className="w-full gradient-primary hover:opacity-90 shadow-glow"
              asChild
            >
              <Link href={`/courses/${course.slug}/purchase`}>
                <DollarSign className="mr-2 h-5 w-5" />
                立即购买
              </Link>
            </Button>
          </div>
        )}

        {/* 积分兑换选项 */}
        {hasPointsOption && (
          <>
            {hasMoneyOption && (
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-muted-foreground/30" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-2 text-xs text-muted-foreground">
                    或使用积分兑换
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-purple-600" />
                  <span className="text-xl font-bold text-purple-600">
                    {course.pointsRequired} 积分
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  您有 {userPoints} 积分
                </span>
              </div>

              {!canAffordPoints && (
                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  积分不足，需要 {course.pointsRequired} 积分，您当前有 {userPoints} 积分
                </div>
              )}

              <Button
                size="lg"
                variant="outline"
                className="w-full border-purple-200 hover:bg-purple-50 text-purple-700"
                onClick={handleUnlockWithPoints}
                disabled={isUnlocking || !canAffordPoints}
              >
                {isUnlocking ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    兑换中...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-5 w-5" />
                    积分兑换
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* 如果都不支持 */}
        {!hasMoneyOption && !hasPointsOption && (
          <div className="text-center py-4">
            <Badge variant="secondary" className="text-sm">
              暂不可购买
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

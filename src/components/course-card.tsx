import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, DollarSign, Coins, Lock } from 'lucide-react';
import type { Course } from '@/types';
import { courseLevelStyles } from '@/types';

interface CourseCardProps {
  course: Course & { hasAccess?: boolean };
  showTools?: boolean;
  isLoggedIn?: boolean;
  hasAccess?: boolean;
}

export function CourseCard({ course, showTools = false, isLoggedIn = false, hasAccess = false }: CourseCardProps) {
  const levelStyle = courseLevelStyles[course.level] || courseLevelStyles.Beginner;

  // 优先使用 course.hasAccess，其次是传入的 hasAccess
  const userHasAccess = course.hasAccess ?? hasAccess;

  // 判断显示什么价格标签
  const renderPriceTag = () => {
    if (course.price === 0 && !course.allowPointsPurchase) {
      return <span className="text-lg font-bold text-green-600">免费</span>;
    }

    return (
      <div className="flex flex-col items-end">
        {course.allowMoneyPurchase && course.price > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              <DollarSign className="h-4 w-4 inline" />
              {course.price.toFixed(2)}
            </span>
            {course.originalPrice > course.price && (
              <span className="text-sm text-muted-foreground line-through">
                {course.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        )}
        {course.allowPointsPurchase && course.pointsRequired > 0 && (
          <div className="flex items-center gap-1 text-sm font-medium text-purple-600">
            <Coins className="h-3 w-3" />
            <span>{course.pointsRequired} 积分</span>
          </div>
        )}
      </div>
    );
  };

  // 渲染按钮文字
  const renderButtonText = () => {
    // 游客状态下，免费课程显示"开始学习"，付费课程显示"登录后购买"
    if (!isLoggedIn) {
      const isFree = course.price === 0 && !course.allowPointsPurchase;
      if (isFree) {
        return (
          <>
            <GraduationCap className="mr-2 h-4 w-4" />
            开始学习
          </>
        );
      }
      return (
        <>
          <Lock className="mr-2 h-4 w-4" />
          登录后购买
        </>
      );
    }
    if (userHasAccess) {
      return (
        <>
          <GraduationCap className="mr-2 h-4 w-4" />
          开始学习
        </>
      );
    }
    return (
      <>
        <GraduationCap className="mr-2 h-4 w-4" />
        立即学习
      </>
    );
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-muted overflow-hidden">
      {course.coverImage && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={course.coverImage}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2">
            <Badge className={levelStyle.className}>
              {levelStyle.label}
            </Badge>
          </div>
        </div>
      )}

      <CardHeader className={`${course.coverImage ? 'pt-4' : ''} pb-2`}>
        <div className="flex items-start justify-between gap-2">
          <Link href={`/courses/${course.slug}`}>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
              {course.title}
            </h3>
          </Link>
          {!course.coverImage && (
            <Badge className={`text-xs shrink-0 ${levelStyle.className}`}>
              {levelStyle.label}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {course.description}
        </p>

        {showTools && course.tools && course.tools.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {course.tools.slice(0, 3).map((tool) => (
              <Badge key={tool.id} variant="secondary" className="text-xs">
                {tool.name}
              </Badge>
            ))}
            {course.tools.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{course.tools.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{course.studentCount} 人学习</span>
          </div>
          {renderPriceTag()}
        </div>

        <Link href={`/courses/${course.slug}`}>
          <Button className="w-full" size="sm">
            {renderButtonText()}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

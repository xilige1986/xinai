import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, GraduationCap } from 'lucide-react';
import type { Course } from '@/types';
import { courseLevelStyles } from '@/types';

interface CourseCardProps {
  course: Course;
  showTools?: boolean;
}

export function CourseCard({ course, showTools = false }: CourseCardProps) {
  const levelStyle = courseLevelStyles[course.level] || courseLevelStyles.Beginner;

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
          <div className="text-lg font-bold text-primary">
            ¥{course.price.toFixed(2)}
          </div>
        </div>

        <a
          href={course.buyUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="w-full" size="sm">
            <GraduationCap className="mr-2 h-4 w-4" />
            立即学习
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}

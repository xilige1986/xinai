import { prisma } from '@/lib/db';
import { CourseCard } from '@/components/course-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, BookOpen } from 'lucide-react';

async function getCourses() {
  return await prisma.course.findMany({
    where: { status: 1 },
    orderBy: { createdAt: 'desc' },
    include: {
      tools: true,
    },
  });
}

const levels = [
  { value: 'all', label: '全部等级' },
  { value: 'Beginner', label: '入门' },
  { value: 'Advanced', label: '进阶' },
];

export default async function CoursesPage() {
  const courses = await getCourses().catch(() => []);

  const beginnerCourses = courses.filter((c) => c.level === 'Beginner');
  const advancedCourses = courses.filter((c) => c.level === 'Advanced');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          AI技能课程
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          系统化学习AI工具使用，从入门到精通，助力职业发展与业务提效
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索课程..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {levels.map((level) => (
            <Button
              key={level.value}
              variant={level.value === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              {level.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{courses.length}</div>
          <div className="text-sm text-muted-foreground">全部课程</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{beginnerCourses.length}</div>
          <div className="text-sm text-muted-foreground">入门课程</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{advancedCourses.length}</div>
          <div className="text-sm text-muted-foreground">进阶课程</div>
        </div>
      </div>

      {/* All Courses */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/50 rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">暂无课程数据</p>
        </div>
      )}
    </div>
  );
}

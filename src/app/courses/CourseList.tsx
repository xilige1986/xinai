'use client';

import { useState, useMemo } from 'react';
import { CourseCard } from '@/components/course-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen } from 'lucide-react';

interface CourseWithAccess {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  price: number;
  originalPrice: number;
  level: string;
  studentCount: number;
  status: number;
  tools: { id: number; name: string }[];
  hasAccess: boolean;
  allowMoneyPurchase?: boolean;
  allowPointsPurchase?: boolean;
  pointsRequired?: number;
}

const levels = [
  { value: 'all', label: '全部等级' },
  { value: 'Beginner', label: '入门' },
  { value: 'Advanced', label: '进阶' },
];

interface CourseListProps {
  courses: CourseWithAccess[];
  isLoggedIn: boolean;
}

export function CourseList({ courses, isLoggedIn }: CourseListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');

  // 过滤课程
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // 搜索过滤
      const matchesSearch = searchQuery === '' ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());

      // 等级过滤
      const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;

      return matchesSearch && matchesLevel;
    });
  }, [courses, searchQuery, selectedLevel]);

  // 统计
  const beginnerCount = courses.filter((c) => c.level === 'Beginner').length;
  const advancedCount = courses.filter((c) => c.level === 'Advanced').length;

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {levels.map((level) => (
            <Button
              key={level.value}
              variant={selectedLevel === level.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLevel(level.value)}
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
          <div className="text-2xl font-bold">{beginnerCount}</div>
          <div className="text-sm text-muted-foreground">入门课程</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{advancedCount}</div>
          <div className="text-sm text-muted-foreground">进阶课程</div>
        </div>
      </div>

      {/* Course Count */}
      {searchQuery && (
        <div className="mb-4 text-sm text-muted-foreground">
          搜索 &quot;{searchQuery}&quot; 找到 {filteredCourses.length} 个课程
        </div>
      )}

      {/* All Courses */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isLoggedIn={isLoggedIn}
              hasAccess={course.hasAccess}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/50 rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? '没有找到匹配的课程' : '暂无课程数据'}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedLevel('all');
              }}
            >
              清除筛选
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

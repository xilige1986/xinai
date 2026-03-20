'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, BookOpen, Clock, PlayCircle, CheckCircle, ChevronRight } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  slug: string;
  coverImage: string | null;
  price: number;
  isFree?: boolean;
}

interface Order {
  id: number;
  orderNo: string;
  amount: number;
  status: number;
  payTime: string;
  course: Course;
}

interface ProgressData {
  progress: number;
  isCompleted: boolean;
  completedLessons: number;
  totalLessons: number;
}

export default function MyCoursesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [freeCourses, setFreeCourses] = useState<Course[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, ProgressData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 并行获取付费订单和免费课程
      const [ordersResponse, freeCoursesResponse] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/user/free-courses'),
      ]);

      const ordersData = await ordersResponse.json();
      const freeCoursesData = await freeCoursesResponse.json();

      // 处理付费订单
      if (ordersResponse.ok) {
        const paidOrders = ordersData.orders?.filter((o: Order) => o.status === 1) || [];
        setOrders(paidOrders);

        // 获取每个付费课程的学习进度
        for (const order of paidOrders) {
          fetchProgress(order.course.id);
        }
      }

      // 处理免费课程
      if (freeCoursesResponse.ok) {
        const courses = freeCoursesData.courses?.map((c: Course) => ({ ...c, isFree: true })) || [];
        setFreeCourses(courses);

        // 获取每个免费课程的学习进度
        for (const course of courses) {
          fetchProgress(course.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProgress = async (courseId: number) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/progress`);
      const data = await response.json();

      if (response.ok) {
        setProgressMap((prev) => ({
          ...prev,
          [courseId]: data,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">我的课程</h1>
            <p className="text-muted-foreground mt-1">
              管理您学习的所有课程（免费课程 + 已购买课程）
            </p>
          </div>
          <Link href="/orders">
            <Button variant="outline">查看订单</Button>
          </Link>
        </div>

        {orders.length === 0 && freeCourses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">您还没有学习任何课程</p>
              <Link href="/courses">
                <Button className="mt-4">去浏览课程</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 付费课程 */}
            {orders.map((order) => {
              const progress = progressMap[order.course.id];
              return (
                <Card key={`order-${order.id}`} className="overflow-hidden">
                  {/* Cover Image */}
                  <div className="aspect-video relative">
                    {order.course.coverImage ? (
                      <img
                        src={order.course.coverImage}
                        alt={order.course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary/40" />
                      </div>
                    )}
                    {/* Progress Badge */}
                    {progress && (
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            progress.isCompleted
                              ? 'bg-green-100 text-green-700'
                              : 'bg-primary/90 text-white'
                          }`}
                        >
                          {progress.isCompleted ? '已完成' : `${progress.progress}%`}
                        </span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {order.course.title}
                    </h3>

                    {/* Progress Bar */}
                    {progress && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>学习进度</span>
                          <span>
                            {progress.completedLessons}/{progress.totalLessons} 课时
                          </span>
                        </div>
                        <Progress value={progress.progress} className="h-2" />
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        购买于 {new Date(order.payTime || order.id).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Button */}
                    <Link href={`/courses/${order.course.slug}`}>
                      <Button className="w-full">
                        {progress?.isCompleted ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            复习课程
                          </>
                        ) : progress && progress.progress > 0 ? (
                          <>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            继续学习
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            开始学习
                          </>
                        )}
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}

            {/* 免费课程 */}
            {freeCourses.map((course) => {
              const progress = progressMap[course.id];
              return (
                <Card key={`free-${course.id}`} className="overflow-hidden">
                  {/* Cover Image */}
                  <div className="aspect-video relative">
                    {course.coverImage ? (
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-green-600/40" />
                      </div>
                    )}
                    {/* Free Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        免费
                      </span>
                    </div>
                    {/* Progress Badge */}
                    {progress && (
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            progress.isCompleted
                              ? 'bg-green-100 text-green-700'
                              : 'bg-primary/90 text-white'
                          }`}
                        >
                          {progress.isCompleted ? '已完成' : `${progress.progress}%`}
                        </span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Progress Bar */}
                    {progress && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>学习进度</span>
                          <span>
                            {progress.completedLessons}/{progress.totalLessons} 课时
                          </span>
                        </div>
                        <Progress value={progress.progress} className="h-2" />
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        免费课程
                      </span>
                    </div>

                    {/* Action Button */}
                    <Link href={`/courses/${course.slug}`}>
                      <Button className="w-full">
                        {progress?.isCompleted ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            复习课程
                          </>
                        ) : progress && progress.progress > 0 ? (
                          <>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            继续学习
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            开始学习
                          </>
                        )}
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ToolCard } from '@/components/tool-card';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  CheckCircle,
  PlayCircle,
  FileText,
  Lock,
  Unlock,
  ChevronRight,
  Users,
  Clock,
  GraduationCap,
  BookOpen,
  Target,
  Star,
  Award,
  Play,
  ChevronDown,
} from 'lucide-react';
import { CourseLikeButton } from '@/components/course-like-button';
import { courseLevelStyles } from '@/types';
import type { Metadata } from 'next';
import CoursePurchaseCard from '@/components/course-purchase-card';
import { VideoPlayer } from '@/components/video-player';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

async function getCourse(slug: string) {
  const course = await prisma.course.findUnique({
    where: { slug, status: 1 },
    include: {
      tools: {
        where: { status: 1 },
        include: {
          category: true,
          subCategory: true,
          useCase: true,
        },
        take: 6,
      },
    },
  });

  if (!course) return null;

  // 增加学习人数统计
  await prisma.course.update({
    where: { id: course.id },
    data: { studentCount: { increment: 1 } },
  });

  return course;
}

// 获取课程的章节和课时
async function getCourseChapters(courseId: number) {
  const chapters = await prisma.chapter.findMany({
    where: {
      courseId,
      status: 1,
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      lessons: {
        where: { status: 1 },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          contentType: true,
          isFree: true,
          sortOrder: true,
        },
      },
    },
  });
  return chapters;
}

// 获取相关课程推荐
async function getRelatedCourses(currentCourseId: number, toolIds: number[]) {
  return await prisma.course.findMany({
    where: {
      status: 1,
      id: { not: currentCourseId },
      tools: {
        some: {
          id: { in: toolIds },
        },
      },
    },
    take: 3,
    orderBy: { studentCount: 'desc' },
  });
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
  });

  if (!course) {
    return { title: '课程未找到' };
  }

  const levelLabel = courseLevelStyles[course.level]?.label || course.level;

  return {
    title: `${course.title} - ${levelLabel}课程`,
    description: course.description.slice(0, 160),
    keywords: `${course.title}, AI课程, ${levelLabel}, AI学习, 人工智能教程`,
    openGraph: {
      title: course.title,
      description: course.description.slice(0, 200),
      type: 'article',
      images: course.coverImage ? [course.coverImage] : undefined,
    },
  };
}

// 生成静态参数
export async function generateStaticParams() {
  const courses = await prisma.course.findMany({
    where: { status: 1 },
    select: { slug: true },
  });

  return courses.map((course) => ({
    slug: course.slug,
  }));
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourse(slug);
  const session = await getServerSession(authOptions);

  if (!course) {
    notFound();
  }

  // 检查用户是否已购买 或是VIP/创始股东 或用积分解锁
  let hasAccess = course.price === 0 && !course.allowPointsPurchase;
  let orderInfo = null;
  let userPoints = 0;

  if (session?.user?.id) {
    const userRole = (session.user as any).role;
    const userMembership = (session.user as any).membership || 'MEMBER';
    const isAdmin = userRole === 'ADMIN';
    const isVIP = userMembership === 'VIP' || userMembership === 'FOUNDER';
    const userId = parseInt(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    userPoints = user?.points || 0;

    if (isAdmin || isVIP) {
      hasAccess = true;
    } else if (!hasAccess) {
      const order = await prisma.order.findFirst({
        where: {
          userId,
          courseId: course.id,
          status: 1,
        },
      });
      if (order) {
        hasAccess = true;
        orderInfo = order;
      }

      if (!hasAccess) {
        const pointsAccess = await prisma.coursePointsAccess.findUnique({
          where: {
            userId_courseId: { userId, courseId: course.id },
          },
        });
        if (pointsAccess) {
          hasAccess = true;
        }
      }
    }
  }

  const levelStyle = courseLevelStyles[course.level] || courseLevelStyles.Beginner;
  const toolIds = course.tools.map((t) => t.id);
  const [relatedCourses, chapters] = await Promise.all([
    toolIds.length > 0
      ? getRelatedCourses(course.id, toolIds).catch(() => [])
      : [],
    getCourseChapters(course.id),
  ]);

  // 计算课程统计
  const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const totalDuration = chapters.reduce(
    (sum, ch) => sum + ch.lessons.reduce((lSum, l) => lSum + l.duration, 0),
    0
  );
  const freeLessonCount = chapters.reduce(
    (sum, ch) => sum + ch.lessons.filter((l) => l.isFree).length,
    0
  );

  // 解析 JSON 数据
  const whatYouWillLearn = course.whatYouWillLearn ? JSON.parse(course.whatYouWillLearn) : [];
  const includes = course.includes ? JSON.parse(course.includes) : [
    '视频课程', '配套练习资料', '课程源码下载', '专属学习社群', '结业证书'
  ];
  const outline = course.outline ? JSON.parse(course.outline) : [];
  const requirements = course.requirements ? JSON.parse(course.requirements) : [];

  // 适合人群
  const targetAudienceList = course.targetAudience
    ? course.targetAudience.split('\n').filter(line => line.trim())
    : [
        course.level === 'Beginner' ? '零基础想入门AI的新手' : '有一定基础想进阶提升的学习者',
        '希望提升工作效率的职场人士',
        '对AI工具感兴趣的自学者',
      ];

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    image: course.coverImage,
    provider: {
      '@type': 'Organization',
      name: 'AI工具库',
    },
    offers: {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: 'CNY',
      availability: course.status === 1 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    educationalLevel: course.level === 'Beginner' ? 'Beginner' : 'Advanced',
    numberOfStudents: course.studentCount,
    timeRequired: `PT${Math.round(totalDuration / 60 * 10) / 10}H`,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section - Dark gradient background */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.3),transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.2),transparent_50%)]" />
        </div>

        <div className="relative container mx-auto px-4 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Course Info */}
            <div className="order-2 lg:order-1">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                <Link href="/" className="hover:text-white transition-colors">
                  首页
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/courses" className="hover:text-white transition-colors">
                  课程
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-white/80">{course.title}</span>
              </nav>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30">
                  {levelStyle.label}
                </Badge>
                {course.price === 0 && !course.allowPointsPurchase && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30">
                    免费
                  </Badge>
                )}
                {course.allowPointsPurchase && (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30">
                    积分兑换
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                {course.title}
              </h1>

              {/* Description */}
              <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-2xl">
                {course.description}
              </p>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 mb-8">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-400" />
                  <span>{course.studentCount.toLocaleString()} 人学习</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span>{Math.round(totalDuration / 60 * 10) / 10} 小时</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <span>{totalLessons} 课时</span>
                </div>
                {course.ratingCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span>{(course.ratingSum / course.ratingCount).toFixed(1)} 评分</span>
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <CoursePurchaseCard
                  course={{
                    id: course.id,
                    slug: course.slug,
                    title: course.title,
                    price: course.price,
                    originalPrice: course.originalPrice,
                    buyUrl: course.buyUrl,
                    allowMoneyPurchase: course.allowMoneyPurchase,
                    allowPointsPurchase: course.allowPointsPurchase,
                    pointsRequired: course.pointsRequired,
                  }}
                  hasAccess={hasAccess}
                  userPoints={userPoints}
                  isLoggedIn={!!session?.user?.id}
                  firstLessonId={chapters[0]?.lessons[0]?.id}
                  variant="compact"
                />
                <CourseLikeButton courseId={course.id} variant="light" />
              </div>
            </div>

            {/* Right: Video Preview */}
            <div className="order-1 lg:order-2">
              <VideoPlayer
                videoUrl={course.promoVideoUrl || ''}
                videoPlatform={course.promoVideoPlatform || undefined}
                coverImage={course.coverImage || undefined}
                title={course.title}
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 group cursor-pointer">
                  {course.coverImage ? (
                    <>
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                        <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-8 w-8 text-slate-900 ml-1" fill="currentColor" />
                        </div>
                      </div>
                      {/* Duration Badge */}
                      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white">
                        {Math.round(totalDuration / 60 * 10) / 10} 小时
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center">
                      <BookOpen className="h-24 w-24 text-white/30" />
                    </div>
                  )}
                </div>
              </VideoPlayer>

              {/* Instructor Mini Card */}
              <div className="mt-4 flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                {course.instructorAvatar ? (
                  <img
                    src={course.instructorAvatar}
                    alt={course.instructorName || '讲师'}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {(course.instructorName || 'AI').slice(0, 1)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-white">{course.instructorName || 'AI工具库专家团队'}</div>
                  <div className="text-sm text-slate-400">资深AI应用专家</div>
                </div>
                <Award className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left: Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* What You'll Learn */}
            {whatYouWillLearn.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-indigo-600" />
                  </div>
                  你将学到什么
                </h2>
                <Card className="border-border/50 bg-muted/20">
                  <CardContent className="p-6">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {whatYouWillLearn.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-foreground/80">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Course Description */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                课程详情
              </h2>
              <div className="prose prose-slate max-w-none">
                <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {course.description}
                </div>
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                适合人群
              </h2>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {targetAudienceList.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                        <span className="text-foreground/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Requirements */}
            {requirements.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-amber-600" />
                  </div>
                  课程要求
                </h2>
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <ul className="space-y-3">
                      {requirements.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                          <span className="text-foreground/80">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Course Curriculum - Accordion Style */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                课程大纲
              </h2>

              {chapters.length > 0 ? (
                <Card className="border-border/50 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-muted/50 px-6 py-4 border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{chapters.length} 个章节</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">{totalLessons} 课时</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">{Math.round(totalDuration / 60 * 10) / 10} 小时</span>
                        </div>
                        {freeLessonCount > 0 && (
                          <span className="text-sm text-green-600">
                            {freeLessonCount} 节免费试看
                          </span>
                        )}
                      </div>
                    </div>

                    <Accordion type="multiple" defaultValue={[`chapter-${chapters[0]?.id}`]} className="w-full">
                      {chapters.map((chapter, chapterIndex) => (
                        <AccordionItem
                          key={chapter.id}
                          value={`chapter-${chapter.id}`}
                          className="border-b border-border/50 last:border-0"
                        >
                          <AccordionTrigger className="px-6 py-4 hover:bg-muted/30 transition-colors hover:no-underline">
                            <div className="flex items-center gap-4 text-left">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600 shrink-0">
                                {chapterIndex + 1}
                              </div>
                              <div>
                                <div className="font-semibold">{chapter.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {chapter.lessons.length} 课时 · {Math.round(chapter.lessons.reduce((sum, l) => sum + l.duration, 0))} 分钟
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-4">
                            {chapter.description && (
                              <p className="text-sm text-muted-foreground mb-4 pl-12">
                                {chapter.description}
                              </p>
                            )}
                            <ul className="space-y-2">
                              {chapter.lessons.map((lesson, lessonIndex) => (
                                <li key={lesson.id}>
                                  <Link href={`/learn/lesson/${lesson.id}`}>
                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                          {lessonIndex + 1}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {lesson.contentType === 'video' ? (
                                            <PlayCircle className="h-4 w-4 text-indigo-500" />
                                          ) : (
                                            <FileText className="h-4 w-4 text-amber-500" />
                                          )}
                                          <span className="font-medium text-sm">{lesson.title}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">{lesson.duration} 分钟</span>
                                        {lesson.isFree ? (
                                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                                            <Unlock className="h-3 w-3 mr-1" />
                                            免费
                                          </Badge>
                                        ) : (
                                          <Lock className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ) : outline.length > 0 ? (
                <Card className="border-border/50 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {outline.map((chapter: any, index: number) => (
                        <div
                          key={index}
                          className="rounded-xl border border-border/50 overflow-hidden"
                        >
                          <div className="p-4 bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">
                                {index + 1}
                              </div>
                              <h3 className="font-semibold">{chapter.title}</h3>
                            </div>
                          </div>
                          {chapter.lessons && chapter.lessons.length > 0 && (
                            <ul className="divide-y divide-border/50">
                              {chapter.lessons.map((lesson: string, lessonIndex: number) => (
                                <li key={lessonIndex} className="p-4 flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                    {lessonIndex + 1}
                                  </div>
                                  <span className="text-sm">{lesson}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {/* Related Tools */}
            {course.tools && course.tools.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                    <Star className="h-5 w-5 text-rose-600" />
                  </div>
                  相关工具
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Course Includes Card */}
              <Card className="border-border/50 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">课程包含</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <PlayCircle className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="text-sm">
                        {chapters.reduce((sum, ch) => sum + ch.lessons.filter(l => l.contentType === 'video').length, 0)} 个视频课时
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="text-sm">
                        {chapters.reduce((sum, ch) => sum + ch.lessons.filter(l => l.contentType === 'text').length, 0)} 个文字课件
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm">{Math.round(totalDuration / 60 * 10) / 10} 小时学习内容</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Award className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm">结业证书</span>
                    </li>
                    {includes.slice(0, 2).map((item: string, index: number) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-6 border-t border-border/50">
                    <CoursePurchaseCard
                      course={{
                        id: course.id,
                        slug: course.slug,
                        title: course.title,
                        price: course.price,
                        originalPrice: course.originalPrice,
                        buyUrl: course.buyUrl,
                        allowMoneyPurchase: course.allowMoneyPurchase,
                        allowPointsPurchase: course.allowPointsPurchase,
                        pointsRequired: course.pointsRequired,
                      }}
                      hasAccess={hasAccess}
                      userPoints={userPoints}
                      isLoggedIn={!!session?.user?.id}
                      firstLessonId={chapters[0]?.lessons[0]?.id}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Related Courses */}
              {relatedCourses.length > 0 && (
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4">相关推荐</h3>
                    <div className="space-y-4">
                      {relatedCourses.map((relatedCourse) => (
                        <Link
                          key={relatedCourse.id}
                          href={`/courses/${relatedCourse.slug}`}
                          className="flex gap-3 group"
                        >
                          <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                            {relatedCourse.coverImage ? (
                              <img
                                src={relatedCourse.coverImage}
                                alt={relatedCourse.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
                              {relatedCourse.title}
                            </h4>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">
                                {relatedCourse.studentCount} 人学习
                              </span>
                              <span className="text-sm font-semibold text-indigo-600">
                                {relatedCourse.price === 0 ? '免费' : `¥${relatedCourse.price.toFixed(2)}`}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

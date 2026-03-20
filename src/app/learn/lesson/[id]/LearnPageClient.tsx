'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  PlayCircle,
  FileText,
  Clock,
  Lock,
  Unlock,
  Check,
  Loader2,
  BookOpen,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import MarkdownContent from '@/components/markdown-content';

interface Chapter {
  id: number;
  title: string;
  sortOrder: number;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  contentType: string;
  videoUrl: string | null;
  videoPlatform: string | null;
  textContent: string | null;
  markdownContent: string | null;
  isFree: boolean;
  sortOrder: number;
  chapterId: number;
}

interface ProgressData {
  progress: number;
  isCompleted: boolean;
  lastPosition: number | null;
}

interface CourseData {
  id: number;
  title: string;
  slug: string;
  coverImage: string | null;
  price: number;
}

interface LearnPageClientProps {
  lesson: Lesson;
  course: CourseData;
  chapters: Chapter[];
  initialProgress: ProgressData;
  nextLesson: Lesson | null;
  prevLesson: Lesson | null;
  hasAccess: boolean;
  relatedCourses: CourseData[];
}

// 视频嵌入组件
function VideoPlayer({
  lesson,
  onProgress,
  initialPosition,
}: {
  lesson: Lesson;
  onProgress: (position: number) => void;
  initialPosition: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 获取视频嵌入URL
  const getEmbedUrl = useCallback(() => {
    if (!lesson.videoUrl) return '';

    const url = lesson.videoUrl;

    // Bilibili
    if (lesson.videoPlatform === 'bilibili') {
      // 支持 BV 号或链接
      const bvMatch = url.match(/BV[\w]+/);
      if (bvMatch) {
        return `https://player.bilibili.com/player.html?bvid=${bvMatch[0]}&page=1&high_quality=1`;
      }
      // 支持 b23.tv 短链接
      if (url.includes('b23.tv')) {
        return url; // 需要后端解析或使用iframe直接打开
      }
      return url;
    }

    // YouTube
    if (lesson.videoPlatform === 'youtube') {
      const videoId = url.match(/(?:v=|\/)([\w-]{11})/)?.[1];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // 其他直接返回
    return url;
  }, [lesson]);

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden max-h-[60vh] mx-auto max-w-5xl mt-[35px]">
      {lesson.videoPlatform === 'custom' ? (
        <video
          src={lesson.videoUrl || ''}
          controls
          className="w-full h-full"
          onTimeUpdate={(e) => onProgress(Math.floor(e.currentTarget.currentTime))}
          onEnded={() => onProgress(-1)} // -1 表示完成
        />
      ) : (
        <iframe
          ref={iframeRef}
          src={getEmbedUrl()}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      )}
    </div>
  );
}

// 课程大纲侧边栏
function LessonSidebar({
  chapters,
  currentLessonId,
  progressMap,
  course,
  hasAccess,
}: {
  chapters: Chapter[];
  currentLessonId: number;
  progressMap: Record<number, ProgressData>;
  course: CourseData;
  hasAccess: boolean;
}) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set(chapters.map((c) => c.id))
  );

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b bg-muted/50">
        <Link href={`/courses/${course.slug}`}>
          <h3 className="font-semibold hover:text-primary transition-colors line-clamp-2 text-sm leading-tight">
            {course.title}
          </h3>
        </Link>
      </div>
      <div className="p-3">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="mb-3">
            <button
              onClick={() => toggleChapter(chapter.id)}
              className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted rounded-md"
            >
              <span className="text-left">{chapter.title}</span>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  expandedChapters.has(chapter.id) ? 'rotate-90' : ''
                }`}
              />
            </button>
            {expandedChapters.has(chapter.id) && (
              <div className="ml-1 mt-1 space-y-1">
                {chapter.lessons.map((lesson) => {
                  const isCurrent = lesson.id === currentLessonId;
                  const progress = progressMap[lesson.id];
                  const isCompleted = progress?.isCompleted;
                  const canAccess = hasAccess || lesson.isFree;

                  return (
                    <Link
                      key={lesson.id}
                      href={canAccess ? `/learn/lesson/${lesson.id}` : '#'}
                      onClick={(e) => {
                        if (!canAccess) {
                          e.preventDefault();
                          toast.error('该课时需要购买课程后观看');
                        }
                      }}
                    >
                      <div
                        className={`flex items-start gap-2 p-3 text-sm rounded-md ${
                          isCurrent
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        } ${!canAccess ? 'opacity-60' : ''}`}
                      >
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : isCurrent ? (
                            <PlayCircle className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{lesson.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>
                              {lesson.contentType === 'video' ? (
                                <PlayCircle className="h-3 w-3 inline mr-0.5" />
                              ) : (
                                <FileText className="h-3 w-3 inline mr-0.5" />
                              )}
                              {lesson.duration}分钟
                            </span>
                            {!canAccess && <Lock className="h-3 w-3" />}
                            {lesson.isFree && canAccess && (
                              <span className="text-green-600">免费</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 课程列表侧边栏
function CourseListSidebar({
  courses,
  currentCourseId,
}: {
  courses: CourseData[];
  currentCourseId: number;
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          推荐课程
        </h3>
      </div>
      <div className="p-3 space-y-3">
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            暂无推荐课程
          </p>
        ) : (
          courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className={`block p-3 rounded-lg transition-colors ${
                course.id === currentCourseId
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex gap-4">
                <div className="w-32 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                  {course.coverImage ? (
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <BookOpen className="h-10 w-10 text-primary/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <p className="font-semibold text-base line-clamp-2">
                    {course.title}
                  </p>
                  <p className="text-base text-primary font-bold mt-2">
                    ¥{course.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function LearnPageClient({
  lesson,
  course,
  chapters,
  initialProgress,
  nextLesson,
  prevLesson,
  hasAccess,
  relatedCourses,
}: LearnPageClientProps) {
  const [progress, setProgress] = useState<ProgressData>(initialProgress);
  const [isCompleting, setIsCompleting] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<number, ProgressData>>({});
  const progressSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // 获取所有课时的进度
  useEffect(() => {
    if (hasAccess) {
      fetch(`/api/user/progress?courseId=${course.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.progressMap) {
            setProgressMap(data.progressMap);
          }
        })
        .catch(console.error);
    }
  }, [course.id, hasAccess]);

  // 保存学习进度（防抖）
  const saveProgress = useCallback(
    async (updates: Partial<ProgressData>) => {
      if (!hasAccess) return;

      // 清除之前的定时器
      if (progressSaveTimer.current) {
        clearTimeout(progressSaveTimer.current);
      }

      // 设置新的定时器，延迟保存
      progressSaveTimer.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/lessons/${lesson.id}/progress`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...updates,
              lastPosition: updates.lastPosition,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setProgress(data.progress);
          }
        } catch (error) {
          console.error('Failed to save progress:', error);
        }
      }, 3000); // 3秒后保存
    },
    [hasAccess, lesson.id]
  );

  // 标记课时完成
  const handleComplete = async () => {
    if (!hasAccess || isCompleting) return;

    setIsCompleting(true);
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
        toast.success('课时已完成！');
      }
    } catch (error) {
      toast.error('保存失败，请重试');
    } finally {
      setIsCompleting(false);
    }
  };

  // 处理视频进度更新
  const handleVideoProgress = useCallback(
    (position: number) => {
      // position: 当前播放位置（秒），-1 表示播放完成
      if (position === -1) {
        saveProgress({ progress: 100, isCompleted: true });
      } else {
        // 估算进度（假设视频时长是准确的）
        const estimatedProgress = Math.min(
          Math.round((position / (lesson.duration * 60)) * 100),
          95 // 最高95%，必须通过点击完成按钮才能达到100%
        );
        saveProgress({
          progress: estimatedProgress,
          lastPosition: position,
        });
      }
    },
    [lesson.duration, saveProgress]
  );

  // 处理文字课件阅读进度
  const handleTextScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!hasAccess) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const scrollPercent = Math.round(
        ((scrollTop + clientHeight) / scrollHeight) * 100
      );

      saveProgress({
        progress: Math.min(scrollPercent, 95),
        lastPosition: scrollTop,
      });
    },
    [hasAccess, saveProgress]
  );

  // 如果没有访问权限，显示提示
  if (!hasAccess && !lesson.isFree) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* 顶部导航 */}
        <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              <Link href={`/courses/${course.slug}`}>
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  返回课程
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">需要购买课程</h2>
              <p className="text-muted-foreground mb-2">
                {lesson.title}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                该课时需要购买课程后才能观看
              </p>

              <div className="bg-muted rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">课程价格</span>
                  <span className="text-2xl font-bold text-primary">
                    ¥{course.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full" size="lg" asChild>
                  <Link href={`/courses/${course.slug}/purchase`}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    立即购买
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/courses/${course.slug}`}>
                    查看课程详情
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* 左侧：课程大纲 */}
      <div className="w-full lg:w-72 border-r bg-muted/30 hidden lg:block order-first sticky top-0 h-screen overflow-hidden">
        <LessonSidebar
          chapters={chapters}
          currentLessonId={lesson.id}
          progressMap={progressMap}
          course={course}
          hasAccess={hasAccess}
        />
      </div>

      {/* 右侧：课程内容 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航 */}
        <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              <Link href={`/courses/${course.slug}`}>
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  返回
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-5" />
              <h1 className="font-medium text-sm truncate max-w-[200px] lg:max-w-sm">
                {lesson.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {prevLesson ? (
                <Link href={`/learn/lesson/${prevLesson.id}`}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    上一节
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  上一节
                </Button>
              )}
              {nextLesson ? (
                <Link href={`/learn/lesson/${nextLesson.id}`}>
                  <Button variant="outline" size="sm">
                    下一节
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  下一节
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* 课程内容区域 */}
        <div className="flex-1">
          {lesson.contentType === 'video' ? (
            <>
              <VideoPlayer
                lesson={lesson}
                onProgress={handleVideoProgress}
                initialPosition={progress.lastPosition || 0}
              />
              {/* 视频课时：学习进度放在视频正下方 */}
              {hasAccess && (
                <div className="px-4 py-3 bg-muted/50 border-b">
                  <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        学习进度 {progress.progress}%
                      </span>
                      {!progress.isCompleted ? (
                        <Button
                          size="sm"
                          onClick={handleComplete}
                          disabled={isCompleting}
                        >
                          {isCompleting ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          标记完成
                        </Button>
                      ) : (
                        <span className="text-sm text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          已完成
                        </span>
                      )}
                    </div>
                    <Progress value={progress.progress} className="h-2" />
                  </div>
                </div>
              )}
            </>
          ) : null}

          <div className="max-w-5xl mx-auto p-4 lg:p-6">
            {/* 课时信息 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="flex items-center">
                  {lesson.contentType === 'video' ? (
                    <PlayCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <FileText className="h-4 w-4 mr-1" />
                  )}
                  {lesson.contentType === 'video' ? '视频' : '文字'}课时
                </span>
                <span>·</span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {lesson.duration} 分钟
                </span>
                {lesson.isFree && (
                  <>
                    <span>·</span>
                    <span className="text-green-600">免费试看</span>
                  </>
                )}
              </div>
              <h1 className="text-xl lg:text-2xl font-bold mb-2">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-muted-foreground text-sm">{lesson.description}</p>
              )}
            </div>

            {/* 文字课时：学习进度放在内容区 */}
            {lesson.contentType === 'text' && hasAccess && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    学习进度 {progress.progress}%
                  </span>
                  {!progress.isCompleted ? (
                    <Button
                      size="sm"
                      onClick={handleComplete}
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      标记完成
                    </Button>
                  ) : (
                    <span className="text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      已完成
                    </span>
                  )}
                </div>
                <Progress value={progress.progress} className="h-2" />
              </div>
            )}

            {/* 文字课件内容 */}
            {lesson.contentType === 'text' && (
              <div className="pb-8">
                {lesson.markdownContent ? (
                  <MarkdownContent content={lesson.markdownContent} />
                ) : lesson.textContent ? (
                  <div
                    className="prose prose-sm max-w-none"
                    onScroll={handleTextScroll}
                    dangerouslySetInnerHTML={{ __html: lesson.textContent }}
                  />
                ) : (
                  <p className="text-muted-foreground">暂无内容</p>
                )}
              </div>
            )}

            {/* 底部导航 */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              {prevLesson ? (
                <Link href={`/learn/lesson/${prevLesson.id}`}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    上一节
                  </Button>
                </Link>
              ) : (
                <div />
              )}
              {nextLesson ? (
                <Link href={`/learn/lesson/${nextLesson.id}`}>
                  <Button size="sm">
                    下一节
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Button size="sm" disabled>已是最后一节</Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：推荐课程 */}
      <div className="w-full lg:w-96 border-l bg-muted/30 hidden lg:block">
        <CourseListSidebar
          courses={relatedCourses}
          currentCourseId={course.id}
        />
      </div>
    </div>
  );
}

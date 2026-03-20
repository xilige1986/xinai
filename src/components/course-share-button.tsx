'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface CourseShareButtonProps {
  courseTitle: string;
  courseUrl: string;
}

export function CourseShareButton({ courseTitle, courseUrl }: CourseShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // 检查是否支持原生分享API
    if (navigator.share) {
      try {
        await navigator.share({
          title: courseTitle,
          text: `推荐一门好课程：${courseTitle}`,
          url: courseUrl,
        });
        toast.success('分享成功');
      } catch (error) {
        // 用户取消分享，打开弹窗
        setOpen(true);
      }
    } else {
      // 不支持原生分享，打开弹窗
      setOpen(true);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(courseUrl);
      setCopied(true);
      toast.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('复制失败');
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12"
        onClick={handleShare}
      >
        <Share2 className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>分享课程</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              分享 "{courseTitle}" 给朋友
            </p>
            <div className="flex gap-2">
              <Input
                value={courseUrl}
                readOnly
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleCopy}
                className={copied ? 'bg-green-500' : ''}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  '复制'
                )}
              </Button>
            </div>
            <div className="flex justify-center gap-4 pt-2">
              {/* 微信分享二维码占位 */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white mb-1">
                  微
                </div>
                <span className="text-xs text-muted-foreground">微信</span>
              </div>
              {/* QQ分享 */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white mb-1">
                  Q
                </div>
                <span className="text-xs text-muted-foreground">QQ</span>
              </div>
              {/* 微博分享 */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white mb-1">
                  博
                </div>
                <span className="text-xs text-muted-foreground">微博</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

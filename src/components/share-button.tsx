'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  title: string;
  url?: string;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showText?: boolean;
}

export function ShareButton({
  title,
  url,
  variant = 'outline',
  className = '',
  showText = true,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareData = {
      title: title,
      text: `发现一个好用的AI工具：${title}`,
      url: shareUrl,
    };

    // 尝试使用原生分享API（移动端支持较好）
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success('分享成功');
        return;
      } catch (error) {
        // 用户取消分享或分享失败，继续尝试复制链接
      }
    }

    // 复制链接到剪贴板
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('链接已复制到剪贴板');

      // 2秒后恢复图标
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error('复制失败，请手动复制链接');
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleShare}
    >
      {copied ? (
        <Check className="mr-2 h-4 w-4 text-green-500" />
      ) : (
        <Share2 className="mr-2 h-4 w-4" />
      )}
      {showText && (copied ? '已复制' : '分享')}
    </Button>
  );
}

// 用于复制链接的按钮
export function CopyLinkButton({
  url,
  className = '',
}: {
  url?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const linkUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      toast.success('链接已复制到剪贴板');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Link2 className="h-4 w-4" />
      )}
    </Button>
  );
}

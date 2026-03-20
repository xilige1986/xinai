'use client';

import { useState } from 'react';
import { Play, X } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  videoPlatform?: string;
  coverImage?: string;
  title?: string;
  children?: React.ReactNode;
}

// 解析视频URL获取嵌入链接
function getEmbedUrl(url: string, platform?: string): string {
  if (!url) return '';

  // 如果已经是嵌入链接，直接返回
  if (url.includes('/embed/')) return url;

  // YouTube
  if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    // 支持直接输入视频ID（11位字符）
    const youtubeIdRegex = /^[a-zA-Z0-9_-]{11}$/;
    if (youtubeIdRegex.test(url)) {
      return `https://www.youtube.com/embed/${url}`;
    }
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)?.[1];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  // Bilibili
  if (platform === 'bilibili' || url.includes('bilibili.com') || url.includes('b23.tv')) {
    // 如果用户粘贴了完整的iframe代码，提取src
    const iframeMatch = url.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch) {
      const src = iframeMatch[1];
      // 确保URL以https:开头
      return src.startsWith('http') ? src : `https:${src}`;
    }

    // 如果已经是播放器链接，直接使用
    if (url.includes('player.bilibili.com')) {
      return url.startsWith('http') ? url : `https:${url}`;
    }

    // 支持直接输入BV号
    const bvidRegex = /^[Bb][Vv][a-zA-Z0-9]{10}$/;
    if (bvidRegex.test(url)) {
      return `https://player.bilibili.com/player.html?bvid=${url}&page=1&high_quality=1&danmaku=0`;
    }

    // 支持多种B站链接格式
    // https://www.bilibili.com/video/BV1xx411c7mD
    // https://b23.tv/BV1xx411c7mD
    // https://www.bilibili.com/video/BV1k9wDzKEvS/
    const bvid = url.match(/(?:bilibili\.com\/video\/|b23\.tv\/)([Bb][Vv][a-zA-Z0-9]+)/)?.[1];
    if (bvid) {
      return `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0`;
    }

    // 支持带参数的B站链接
    // https://www.bilibili.com/video/BV1k9wDzKEvS/?vd_source=xxx
    const bvidWithParams = url.match(/[Bb][Vv][a-zA-Z0-9]{10}/)?.[0];
    if (bvidWithParams) {
      return `https://player.bilibili.com/player.html?bvid=${bvidWithParams}&page=1&high_quality=1&danmaku=0`;
    }

    // 老版AV号
    const avid = url.match(/av(\d+)/)?.[1];
    if (avid) {
      return `https://player.bilibili.com/player.html?aid=${avid}&page=1&high_quality=1&danmaku=0`;
    }
  }

  // 本地视频或其他平台，直接返回
  return url;
}

export function VideoPlayer({ videoUrl, videoPlatform, coverImage, title, children }: VideoPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!videoUrl) {
    return <>{children}</>;
  }

  const embedUrl = getEmbedUrl(videoUrl, videoPlatform);

  return (
    <>
      {/* 触发区域 */}
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {children || (
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
            {coverImage ? (
              <img
                src={coverImage}
                alt={title || '视频封面'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 text-slate-900 ml-1" fill="currentColor" />
                </div>
              </div>
            )}
            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 text-slate-900 ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 视频弹窗 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 视频嵌入 */}
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={title || '宣传视频'}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              >
                您的浏览器不支持视频播放
              </video>
            )}
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string; // 例如 '16/9', '4/3', '1/1'
  placeholderColor?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 懒加载图片组件
 * 使用 Intersection Observer API 实现图片懒加载
 */
export function LazyImage({
  src,
  alt,
  className,
  containerClassName,
  aspectRatio = '16/9',
  placeholderColor = 'bg-muted',
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 检查浏览器是否支持 IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      // 如果不支持，直接加载图片
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        placeholderColor,
        containerClassName
      )}
      style={{ aspectRatio }}
    >
      {/* 加载占位符 */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <span className="text-sm">加载失败</span>
        </div>
      )}

      {/* 实际图片 */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
}

/**
 * 用于资讯列表的懒加载图片卡片
 */
interface NewsImageCardProps {
  src: string;
  alt: string;
  href?: string;
  className?: string;
  aspectRatio?: string;
}

export function NewsImageCard({
  src,
  alt,
  href,
  className,
  aspectRatio = '16/9',
}: NewsImageCardProps) {
  const content = (
    <LazyImage
      src={src}
      alt={alt}
      aspectRatio={aspectRatio}
      containerClassName={cn('rounded-lg', className)}
      className="hover:scale-105 transition-transform duration-500"
    />
  );

  if (href) {
    return (
      <a href={href} className="block overflow-hidden rounded-lg">
        {content}
      </a>
    );
  }

  return content;
}

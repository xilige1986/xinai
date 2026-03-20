'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

// 获取 CSRF token
async function getCsrfToken() {
  try {
    const response = await fetch('/api/auth/csrf');
    const data = await response.json();
    return data.csrfToken;
  } catch {
    return null;
  }
}

export function LogoutButton({
  variant = 'outline',
  size = 'sm',
  showIcon = true,
  className = '',
}: LogoutButtonProps) {
  const { update } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // 获取 CSRF token
      const csrfToken = await getCsrfToken();

      // 直接发送 POST 请求到 /api/auth/signout
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          csrfToken: csrfToken || '',
          callbackUrl: '/',
          json: 'true',
        }),
      });

      if (response.ok) {
        // 更新 session 状态
        await update(null);
        // 清除本地存储
        localStorage.clear();
        sessionStorage.clear();
        // 强制跳转到首页
        window.location.href = '/';
      } else {
        // 即使请求失败也尝试清除并跳转
        await update(null);
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // 出错时直接刷新页面
      window.location.href = '/';
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoggingOut}
      className={className}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {isLoggingOut ? '退出中...' : '退出'}
    </Button>
  );
}

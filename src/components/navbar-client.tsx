'use client';

import Link from 'next/link';
import { useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Menu, X, Bot, User, Heart, Settings, LogOut, Crown, PlusCircle } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

interface NavItem {
  label: string;
  href: string;
}

interface NavbarClientProps {
  navItems: NavItem[];
  logo: ReactNode;
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

export function NavbarClient({ navItems, logo }: NavbarClientProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';
  const isLoggedIn = status === 'authenticated';
  const userMembership = (session?.user?.membership as string) || 'MEMBER';
  const isVIP = userMembership === 'VIP' || userMembership === 'FOUNDER';

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
    } finally {
      setIsLoggingOut(false);
      setMobileMenuOpen(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/tools?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleMobileSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/tools?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          {logo}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search & Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索工具..."
                className="w-56 pl-9 h-9 rounded-lg bg-muted/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg hover:bg-primary/5 hover:text-primary gap-2"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${isVIP ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-primary to-accent'}`}>
                      {isVIP ? <Crown className="h-3 w-3" /> : (session?.user?.name || session?.user?.username || 'U').slice(0, 1)}
                    </div>
                    <span className="max-w-[80px] truncate">
                      {session?.user?.name || session?.user?.username}
                    </span>
                    {isVIP && (
                      <span className="text-[10px] px-1 py-0.5 bg-amber-100 text-amber-600 rounded">
                        {userMembership === 'FOUNDER' ? '股东' : 'VIP'}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      个人中心
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/favorites" className="cursor-pointer">
                      <Heart className="h-4 w-4 mr-2" />
                      我的收藏
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/contributions" className="cursor-pointer">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      提交贡献
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/settings" className="cursor-pointer">
                          <Settings className="h-4 w-4 mr-2" />
                          网站设置
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Bot className="h-4 w-4 mr-2" />
                          管理后台
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="cursor-pointer text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isLoggingOut ? '退出中...' : '退出登录'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="rounded-lg hover:bg-primary/5 hover:text-primary">
                    登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="rounded-lg gradient-primary hover:opacity-90">
                    注册
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 rounded-lg hover:bg-muted/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 px-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索AI工具..."
                  className="w-full pl-9 rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleMobileSearch}
                />
              </div>

              {isLoggedIn ? (
                <div className="space-y-2 pt-2 border-t">
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      个人中心
                    </Button>
                  </Link>
                  <Link href="/dashboard/favorites" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      <Heart className="h-4 w-4 mr-2" />
                      我的收藏
                    </Button>
                  </Link>
                  <Link href="/dashboard/contributions" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      提交贡献
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start">
                        <Bot className="h-4 w-4 mr-2" />
                        管理后台
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isLoggingOut ? '退出中...' : '退出登录'}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 border-t">
                  <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      登录
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full gradient-primary">
                      注册
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

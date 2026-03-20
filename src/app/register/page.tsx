'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  UserPlus,
  Mail,
  Lock,
  User,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface VerificationSettings {
  emailVerify: boolean;
  phoneVerify: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<VerificationSettings>({
    emailVerify: false,
    phoneVerify: false,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  // 倒计时
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [phoneCountdown, setPhoneCountdown] = useState(0);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    emailCode: '',
    phoneCode: '',
  });

  // 获取验证码设置
  useEffect(() => {
    fetch('/api/auth/verify-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSettings(false));
  }, []);

  // 倒计时效果
  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);

  useEffect(() => {
    if (phoneCountdown > 0) {
      const timer = setTimeout(() => setPhoneCountdown(phoneCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneCountdown]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  // 发送邮箱验证码
  const sendEmailCode = async () => {
    if (!formData.email) {
      setError('请先输入邮箱地址');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '发送失败');
      }

      setEmailCountdown(60);
      setSuccess('验证码已发送到您的邮箱');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || '发送失败，请稍后重试');
    }
  };

  // 发送手机验证码
  const sendPhoneCode = async () => {
    if (!formData.phone) {
      setError('请先输入手机号');
      return;
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('请输入有效的手机号');
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'phone',
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '发送失败');
      }

      setPhoneCountdown(60);
      setSuccess('验证码已发送到您的手机');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || '发送失败，请稍后重试');
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('请输入用户名');
      return false;
    }
    if (formData.username.length < 3) {
      setError('用户名至少3个字符');
      return false;
    }
    if (!formData.email.trim()) {
      setError('请输入邮箱');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址');
      return false;
    }
    // 如果启用了邮箱验证码
    if (settings.emailVerify && !formData.emailCode) {
      setError('请输入邮箱验证码');
      return false;
    }
    // 如果启用了手机验证码
    if (settings.phoneVerify) {
      if (!formData.phone) {
        setError('请输入手机号');
        return false;
      }
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError('请输入有效的手机号');
        return false;
      }
      if (!formData.phoneCode) {
        setError('请输入手机验证码');
        return false;
      }
    }
    if (!formData.password) {
      setError('请输入密码');
      return false;
    }
    if (formData.password.length < 6) {
      setError('密码至少6个字符');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          name: formData.name || formData.username,
          emailCode: formData.emailCode || undefined,
          phoneCode: formData.phoneCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '注册失败');
      }

      setSuccess('注册成功！正在跳转到登录页面...');
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 1500);
    } catch (err: any) {
      setError(err.message || '注册失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-accent/5 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-accent/5 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="p-2 rounded-xl gradient-primary">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">用户注册</span>
          </Link>
          <p className="text-muted-foreground mt-2">
            创建账号，开始您的AI学习之旅
          </p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">注册新账号</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">
                  <User className="h-4 w-4 inline mr-1" />
                  用户名 *
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="请输入用户名"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="h-4 w-4 inline mr-1" />
                  显示名称
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="用于显示的昵称（可选）"
                />
              </div>

              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-1" />
                  邮箱 *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* 邮箱验证码 */}
              {settings.emailVerify && (
                <div className="space-y-2">
                  <Label htmlFor="emailCode">
                    <ShieldCheck className="h-4 w-4 inline mr-1" />
                    邮箱验证码 *
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="emailCode"
                      value={formData.emailCode}
                      onChange={(e) => handleChange('emailCode', e.target.value)}
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      className="flex-1"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={sendEmailCode}
                      disabled={emailCountdown > 0 || !formData.email}
                      className="whitespace-nowrap"
                    >
                      {emailCountdown > 0 ? `${emailCountdown}s` : '获取验证码'}
                    </Button>
                  </div>
                </div>
              )}

              {/* 手机号 */}
              {settings.phoneVerify && (
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Smartphone className="h-4 w-4 inline mr-1" />
                    手机号 *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="请输入11位手机号"
                    maxLength={11}
                    required
                  />
                </div>
              )}

              {/* 手机验证码 */}
              {settings.phoneVerify && (
                <div className="space-y-2">
                  <Label htmlFor="phoneCode">
                    <ShieldCheck className="h-4 w-4 inline mr-1" />
                    手机验证码 *
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="phoneCode"
                      value={formData.phoneCode}
                      onChange={(e) => handleChange('phoneCode', e.target.value)}
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      className="flex-1"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={sendPhoneCode}
                      disabled={phoneCountdown > 0 || !formData.phone}
                      className="whitespace-nowrap"
                    >
                      {phoneCountdown > 0 ? `${phoneCountdown}s` : '获取验证码'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="h-4 w-4 inline mr-1" />
                  密码 *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="至少6个字符"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  <Lock className="h-4 w-4 inline mr-1" />
                  确认密码 *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="再次输入密码"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary hover:opacity-90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    注册中...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    立即注册
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                已有账号？{' '}
                <Link href="/login" className="text-primary hover:underline">
                  立即登录
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

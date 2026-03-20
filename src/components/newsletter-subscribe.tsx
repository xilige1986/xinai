'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export function NewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(data.error || '订阅失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <h3 className="font-semibold text-sm text-green-700">订阅成功！</h3>
        </div>
        <p className="text-xs text-green-600">
          感谢您的订阅，我们会将最新的 AI 资讯发送到您的邮箱。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">订阅AI资讯</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        获取最新的AI行业动态，每周精选推送
      </p>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          type="email"
          placeholder="请输入邮箱地址"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="h-9 text-sm bg-white/50"
        />

        {error && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="sm"
          disabled={loading || !email.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              订阅中...
            </>
          ) : (
            <>
              立即订阅
            </>
          )}
        </Button>
      </form>

      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        随时可取消订阅，我们尊重您的隐私
      </p>
    </div>
  );
}

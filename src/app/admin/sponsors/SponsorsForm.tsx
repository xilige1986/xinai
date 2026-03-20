'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Loader2, Save } from 'lucide-react';
import type { Sponsor } from '@/lib/sponsors';

interface SponsorsFormProps {
  initialSponsors: Sponsor[];
}

export function SponsorsForm({ initialSponsors }: SponsorsFormProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialSponsors);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const addSponsor = () => {
    const newSponsor: Sponsor = {
      id: Date.now().toString(),
      name: '',
      description: '',
      icon: '',
      iconBg: 'from-primary to-primary-dark',
      link: '/tools',
    };
    setSponsors([...sponsors, newSponsor]);
  };

  const updateSponsor = (id: string, field: keyof Sponsor, value: string) => {
    setSponsors(
      sponsors.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeSponsor = (id: string) => {
    setSponsors(sponsors.filter((s) => s.id !== id));
  };

  const moveSponsor = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sponsors.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newSponsors = [...sponsors];
    [newSponsors[index], newSponsors[newIndex]] = [
      newSponsors[newIndex],
      newSponsors[index],
    ];
    setSponsors(newSponsors);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/sponsors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsors }),
      });

      if (!res.ok) throw new Error('保存失败');

      setMessage('保存成功！');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes('成功')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      <div className="space-y-4">
        {sponsors.map((sponsor, index) => (
          <Card key={sponsor.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => moveSponsor(index, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => moveSponsor(index, 'down')}
                    disabled={index === sponsors.length - 1}
                  >
                    ↓
                  </Button>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>工具名称</Label>
                    <Input
                      value={sponsor.name}
                      onChange={(e) =>
                        updateSponsor(sponsor.id, 'name', e.target.value)
                      }
                      placeholder="例如：ChatGPT Plus"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>描述</Label>
                    <Input
                      value={sponsor.description}
                      onChange={(e) =>
                        updateSponsor(sponsor.id, 'description', e.target.value)
                      }
                      placeholder="例如：智能对话助手"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>图标（文字/Emoji）</Label>
                    <Input
                      value={sponsor.icon}
                      onChange={(e) =>
                        updateSponsor(sponsor.id, 'icon', e.target.value)
                      }
                      placeholder="例如：AI 或 🤖"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>链接地址</Label>
                    <Input
                      value={sponsor.link}
                      onChange={(e) =>
                        updateSponsor(sponsor.id, 'link', e.target.value)
                      }
                      placeholder="例如：/tools/chatgpt"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>图标背景渐变（Tailwind 类名）</Label>
                    <Input
                      value={sponsor.iconBg}
                      onChange={(e) =>
                        updateSponsor(sponsor.id, 'iconBg', e.target.value)
                      }
                      placeholder="例如：from-primary to-primary-dark"
                    />
                    <p className="text-xs text-muted-foreground">
                      使用 Tailwind 的渐变类名，如：from-purple-500 to-pink-500
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => removeSponsor(sponsor.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Button onClick={addSponsor} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          添加赞助商
        </Button>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存更改
            </>
          )}
        </Button>
      </div>

      <div className="bg-muted rounded-lg p-4 mt-6">
        <h3 className="font-semibold mb-2">预览效果</h3>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800 p-4 max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-xs px-2 py-0.5 rounded">
              赞助商
            </span>
          </div>
          <h3 className="font-semibold mb-3">推荐工具</h3>
          <div className="space-y-3">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="bg-white dark:bg-background rounded-lg p-3 border border-amber-200/50 dark:border-amber-800/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${sponsor.iconBg} flex items-center justify-center text-white font-bold text-sm`}
                  >
                    {sponsor.icon || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {sponsor.name || '未命名'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sponsor.description || '暂无描述'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

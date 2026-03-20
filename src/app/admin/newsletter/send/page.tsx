'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Send, Mail, Users, Eye, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface NewsItem {
  id: number;
  title: string;
  summary: string | null;
  slug: string;
  coverImage: string | null;
  publishedAt: string;
}

interface SendResult {
  success: number;
  failed: number;
  total: number;
}

export default function NewsletterSendPage() {
  const [activeTab, setActiveTab] = useState('compose');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [result, setResult] = useState<SendResult | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');

  // 获取资讯列表
  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        setNewsList(data.news?.slice(0, 20) || []);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取订阅者数量
  const fetchSubscriberCount = async () => {
    try {
      const res = await fetch('/api/admin/subscribers');
      if (res.ok) {
        const data = await res.json();
        setSubscriberCount(data.subscribers?.filter((s: any) => s.status === 1).length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchSubscriberCount();
  }, []);

  // 生成预览
  const generatePreview = async () => {
    try {
      const res = await fetch(`/api/admin/newsletter/send?newsIds=${selectedNews.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        // 这里可以渲染预览 HTML
        setPreviewHtml('预览已生成');
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  // 发送邮件
  const handleSend = async () => {
    if (!subject.trim()) {
      alert('请输入邮件主题');
      return;
    }

    if (selectedNews.length === 0) {
      alert('请至少选择一篇资讯');
      return;
    }

    if (!confirm(`确定要发送给 ${subscriberCount} 位订阅者吗？`)) {
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          content: content.trim(),
          newsIds: selectedNews,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data.results);
        setActiveTab('result');
      } else {
        alert(data.error || '发送失败');
      }
    } catch (error) {
      alert('网络错误');
    } finally {
      setSending(false);
    }
  };

  // 切换资讯选择
  const toggleNewsSelection = (id: number) => {
    setSelectedNews((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            发送邮件推送
          </h1>
          <p className="text-muted-foreground mt-1">
            向 {subscriberCount} 位订阅者发送资讯邮件
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">返回后台</Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="compose">编写邮件</TabsTrigger>
          <TabsTrigger value="result" disabled={!result}>
            发送结果
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：邮件内容 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    邮件内容
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      邮件主题 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="例如：本周 AI 资讯精选"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      开头文字（可选）
                    </label>
                    <Textarea
                      placeholder="输入邮件正文开头的内容..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>将发送给 {subscriberCount} 位订阅者</span>
                  </div>

                  <Button
                    onClick={handleSend}
                    disabled={sending || !subject.trim() || selectedNews.length === 0}
                    className="w-full"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        发送中...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        发送邮件
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* 发送提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">发送须知</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>邮件将发送给所有已订阅的用户</li>
                  <li>每封邮件包含取消订阅链接</li>
                  <li>建议测试发送后再批量发送</li>
                  <li>需要配置 RESEND_API_KEY 环境变量</li>
                </ul>
              </div>
            </div>

            {/* 右侧：选择资讯 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  选择要推送的资讯
                  {selectedNews.length > 0 && (
                    <Badge variant="secondary">已选 {selectedNews.length} 篇</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : newsList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    暂无可推送的资讯
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {newsList.map((news) => (
                      <div
                        key={news.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedNews.includes(news.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => toggleNewsSelection(news.id)}
                      >
                        <Checkbox
                          checked={selectedNews.includes(news.id)}
                          onCheckedChange={() => toggleNewsSelection(news.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {news.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {news.summary || '暂无摘要'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="result">
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  发送结果
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {result.success}
                    </div>
                    <div className="text-sm text-green-700">发送成功</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {result.failed}
                    </div>
                    <div className="text-sm text-red-700">发送失败</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.total}
                    </div>
                    <div className="text-sm text-blue-700">总计</div>
                  </div>
                </div>

                <Button onClick={() => setActiveTab('compose')} variant="outline">
                  返回编写
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

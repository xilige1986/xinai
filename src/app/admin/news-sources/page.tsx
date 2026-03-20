'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Rss,
  Globe,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';

interface NewsSource {
  id: number;
  name: string;
  type: 'rss' | 'api' | 'manual';
  category: string;
  rssUrl: string | null;
  apiUrl: string | null;
  apiKey: string | null;
  apiParams: any;
  isActive: boolean;
  lastFetchedAt: string | null;
  fetchInterval: number;
  createdAt: string;
}

export default function NewsSourcesPage() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    type: 'rss',
    category: 'AI资讯',
    rssUrl: '',
    apiUrl: '',
    apiKey: '',
    apiParams: '',
    fetchInterval: 60,
    isActive: true,
  });

  // 加载新闻源列表
  const fetchSources = async () => {
    try {
      const res = await fetch('/api/admin/news-sources');
      const data = await res.json();
      if (data.sources) {
        setSources(data.sources);
      }
    } catch (error) {
      toast.error('无法获取新闻源列表');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingSource
        ? `/api/admin/news-sources`
        : '/api/admin/news-sources';
      const method = editingSource ? 'PUT' : 'POST';

      // 处理 apiParams，处理空字符串和无效 JSON
      let apiParams = null;
      if (formData.apiParams && formData.apiParams.trim()) {
        try {
          apiParams = JSON.parse(formData.apiParams);
        } catch (e) {
          toast.error('API 参数 JSON 格式错误');
          setLoading(false);
          return;
        }
      }

      const body: any = {
        name: formData.name,
        type: formData.type,
        category: formData.category,
        rssUrl: formData.rssUrl || null,
        apiUrl: formData.apiUrl || null,
        apiKey: formData.apiKey || null,
        apiParams,
        fetchInterval: formData.fetchInterval,
        isActive: formData.isActive,
      };

      if (editingSource) {
        body.id = editingSource.id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingSource ? '更新成功' : '创建成功');
        resetForm();
        fetchSources();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || '请检查输入信息');
    } finally {
      setLoading(false);
    }
  };

  // 删除新闻源
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个新闻源吗？')) return;

    setLoading(true);
    try {
      console.log('Deleting news source:', id);
      const res = await fetch(`/api/admin/news-sources/${id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', res.status);
      const data = await res.json();
      console.log('Delete response data:', data);

      if (res.ok && data.success) {
        toast.success('删除成功');
        // 立即从列表中移除
        setSources(prev => prev.filter(s => s.id !== id));
      } else {
        throw new Error(data.error || '删除失败');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || '删除失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 触发抓取
  const handleCrawl = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: id }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`成功抓取 ${data.result?.count || 0} 条新闻`);
        fetchSources();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 编辑新闻源
  const handleEdit = (source: NewsSource) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      type: source.type,
      category: source.category,
      rssUrl: source.rssUrl || '',
      apiUrl: source.apiUrl || '',
      apiKey: source.apiKey || '',
      apiParams: source.apiParams ? JSON.stringify(source.apiParams, null, 2) : '',
      fetchInterval: source.fetchInterval,
      isActive: source.isActive,
    });
    setShowForm(true);
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'rss',
      category: 'AI资讯',
      rssUrl: '',
      apiUrl: '',
      apiKey: '',
      apiParams: '',
      fetchInterval: 60,
      isActive: true,
    });
    setEditingSource(null);
    setShowForm(false);
  };

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '从未抓取';
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rss className="h-6 w-6 text-primary" />
            新闻源管理
          </h1>
          <p className="text-muted-foreground mt-1">
            配置 RSS 或 API 新闻源，自动抓取聚合
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFormData({
                name: 'NewsAPI - AI新闻',
                type: 'api',
                category: 'AI资讯',
                rssUrl: '',
                apiUrl: 'https://newsapi.org/v2/everything',
                apiKey: 'ae5b4062a4a741be9146150e751505ba',
                apiParams: '{"q": "artificial intelligence OR AI", "language": "zh", "sortBy": "publishedAt", "pageSize": 20}',
                fetchInterval: 60,
                isActive: true,
              });
              setShowForm(true);
            }}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            快速添加 NewsAPI
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            添加新闻源
          </Button>
        </div>
      </div>

      {/* 添加/编辑表单 */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingSource ? '编辑新闻源' : '添加新闻源'}</CardTitle>
            <CardDescription>
              配置 RSS 订阅地址或 API 接口来抓取新闻
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 名称 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">源站名称</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：机器之心"
                    required
                  />
                </div>

                {/* 类型 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">类型</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rss">RSS 订阅</SelectItem>
                      <SelectItem value="api">API 接口</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 分类 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">分类</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="AI资讯"
                  />
                </div>

                {/* 抓取间隔 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">抓取间隔（分钟）</label>
                  <Input
                    type="number"
                    value={formData.fetchInterval}
                    onChange={(e) => setFormData({ ...formData, fetchInterval: parseInt(e.target.value) })}
                    min={5}
                    max={1440}
                  />
                </div>

                {/* RSS URL */}
                {formData.type === 'rss' && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">RSS 地址</label>
                    <Input
                      value={formData.rssUrl}
                      onChange={(e) => setFormData({ ...formData, rssUrl: e.target.value })}
                      placeholder="https://www.jiqizhixin.com/rss"
                      required={formData.type === 'rss'}
                    />
                  </div>
                )}

                {/* API URL */}
                {formData.type === 'api' && (
                  <>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-medium">API 地址</label>
                      <Input
                        value={formData.apiUrl}
                        onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                        placeholder="https://newsapi.org/v2/everything"
                        required={formData.type === 'api'}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">API Key</label>
                      <Input
                        type="password"
                        value={formData.apiKey}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        placeholder="可选"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">API 参数 (JSON)</label>
                      <Input
                        value={formData.apiParams}
                        onChange={(e) => setFormData({ ...formData, apiParams: e.target.value })}
                        placeholder='{"q": "AI", "language": "zh"}'
                      />
                    </div>
                  </>
                )}

                {/* 状态 */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-border"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    启用自动抓取
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? '保存中...' : editingSource ? '更新' : '创建'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 新闻源列表 */}
      <div className="space-y-4">
        {loading && sources.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
            <Rss className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">暂无新闻源配置</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加第一个新闻源
            </Button>
          </div>
        ) : (
          sources.map((source) => (
            <Card key={source.id} className={source.isActive ? '' : 'opacity-60'}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{source.name}</h3>
                      <Badge variant={source.type === 'rss' ? 'default' : 'secondary'}>
                        {source.type === 'rss' ? (
                          <Rss className="h-3 w-3 mr-1" />
                        ) : (
                          <Globe className="h-3 w-3 mr-1" />
                        )}
                        {source.type.toUpperCase()}
                      </Badge>
                      {source.isActive ? (
                        <Badge variant="outline" className="text-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          启用
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <XCircle className="h-3 w-3 mr-1" />
                          禁用
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      分类：{source.category} · 抓取间隔：{source.fetchInterval}分钟
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {source.rssUrl || source.apiUrl}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      上次抓取：{formatDate(source.lastFetchedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCrawl(source.id)}
                      disabled={loading}
                      title="立即抓取"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(source)}
                      title="编辑"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(source.id)}
                      disabled={loading}
                      className="text-destructive hover:bg-destructive/10"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

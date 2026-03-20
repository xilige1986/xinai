'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Flame,
  Newspaper,
  ExternalLink,
  FolderOpen,
  X,
  Save,
  Trash,
  Rss,
} from 'lucide-react';
import { toast } from 'sonner';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  category: string;
  status: number;
  views: number;
  likes: number;
  isHot: boolean;
  isAggregated: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface Category {
  name: string;
  count: number;
}

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 批量管理状态
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // 分类管理弹窗状态
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.length === news.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(news.map((n) => n.id));
    }
  };

  // 单选
  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 条资讯吗？此操作不可恢复！`)) return;

    setIsBatchDeleting(true);
    try {
      const res = await fetch('/api/admin/news/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`成功删除 ${data.deletedCount} 条资讯`);
        setSelectedIds([]);
        fetchNews();
        fetchCategories();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || '批量删除失败');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // 批量审核通过
  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定要通过选中的 ${selectedIds.length} 条资讯的审核吗？`)) return;

    try {
      const res = await fetch('/api/admin/news/batch-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`成功审核通过 ${data.updatedCount} 条资讯`);
        setSelectedIds([]);
        fetchNews();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || '批量审核失败');
    }
  };

  // 加载资讯列表
  const fetchNews = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());

      const res = await fetch(`/api/admin/news?${params.toString()}`);
      const data = await res.json();
      if (data.news) {
        setNews(data.news);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      toast.error('获取资讯列表失败');
    }
  };

  // 加载分类列表
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/news/categories');
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      toast.error('获取分类列表失败');
    }
  };

  useEffect(() => {
    Promise.all([fetchNews(), fetchCategories()]).finally(() => {
      setLoading(false);
    });
  }, [page]);

  // 搜索筛选
  const handleSearch = () => {
    setLoading(true);
    fetchNews().finally(() => setLoading(false));
  };

  // 删除资讯
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条资讯吗？')) return;

    try {
      const res = await fetch(`/api/news/${id}/delete`, {
        method: 'POST',
      });
      if (res.ok) {
        toast.success('删除成功');
        fetchNews();
        fetchCategories();
      } else {
        throw new Error('删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 审核资讯
  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`/api/news/${id}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        toast.success('审核通过');
        fetchNews();
      } else {
        throw new Error('操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 拒绝资讯
  const handleReject = async (id: number) => {
    try {
      const res = await fetch(`/api/news/${id}/reject`, {
        method: 'POST',
      });
      if (res.ok) {
        toast.success('已拒绝');
        fetchNews();
      } else {
        throw new Error('操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 设置热门
  const handleToggleHot = async (id: number, isHot: boolean) => {
    try {
      const res = await fetch(`/api/news/${id}/toggle-hot`, {
        method: 'POST',
        body: JSON.stringify({ isHot: !isHot }),
      });
      if (res.ok) {
        toast.success(isHot ? '已取消热门' : '已设为热门');
        fetchNews();
      } else {
        throw new Error('操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 添加分类
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('请输入分类名称');
      return;
    }

    setCategoryLoading(true);
    try {
      const res = await fetch('/api/admin/news/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('分类添加成功');
        setNewCategoryName('');
        fetchCategories();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || '添加失败');
    } finally {
      setCategoryLoading(false);
    }
  };

  // 更新分类
  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      toast.error('请输入分类名称');
      return;
    }

    setCategoryLoading(true);
    try {
      const res = await fetch('/api/admin/news/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldName: editingCategory,
          newName: newCategoryName.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('分类更新成功');
        setEditingCategory(null);
        setNewCategoryName('');
        fetchCategories();
        fetchNews();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    } finally {
      setCategoryLoading(false);
    }
  };

  // 删除分类
  const handleDeleteCategory = async (name: string) => {
    if (!confirm(`确定要删除分类 "${name}" 吗？\n注意：该分类下如果有已发布资讯将无法删除。`)) {
      return;
    }

    setCategoryLoading(true);
    try {
      const res = await fetch(`/api/admin/news/categories?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('分类删除成功');
        fetchCategories();
        if (category === name) {
          setCategory('');
          fetchNews();
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    } finally {
      setCategoryLoading(false);
    }
  };

  // 开始编辑分类
  const startEditCategory = (name: string) => {
    setEditingCategory(name);
    setNewCategoryName(name);
  };

  // 取消编辑
  const cancelEditCategory = () => {
    setEditingCategory(null);
    setNewCategoryName('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Newspaper className="h-8 w-8 text-primary" />
            资讯管理
          </h1>
          <p className="text-muted-foreground mt-1">管理网站资讯文章</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button variant="destructive" onClick={handleBatchDelete} disabled={isBatchDeleting}>
                <Trash className="mr-2 h-4 w-4" />
                批量删除 ({selectedIds.length})
              </Button>
              <Button variant="default" onClick={handleBatchApprove} disabled={isBatchDeleting} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                批量通过 ({selectedIds.length})
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setShowCategoryDialog(true)}>
            <FolderOpen className="mr-2 h-4 w-4" />
            管理分类
          </Button>
          <Link href="/admin/news-sources">
            <Button variant="outline">
              <Rss className="mr-2 h-4 w-4" />
              新闻源管理
            </Button>
          </Link>
          <Link href="/admin/news/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              发布资讯
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索资讯标题..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              handleSearch();
            }}
            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="">全部状态</option>
            <option value="0">待审核</option>
            <option value="1">已发布</option>
            <option value="2">已拒绝</option>
          </select>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              handleSearch();
            }}
            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <Button onClick={handleSearch} variant="secondary">筛选</Button>
        </div>
      </div>

      {/* News Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.length === news.length && news.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">浏览</TableHead>
              <TableHead className="text-right">点赞</TableHead>
              <TableHead>发布时间</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : news.length > 0 ? (
              news.map((item) => (
                <TableRow key={item.id} className={selectedIds.includes(item.id) ? 'bg-muted' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.isHot && (
                        <Flame className="h-4 w-4 text-red-500" />
                      )}
                      {item.isAggregated && (
                        <ExternalLink className="h-4 w-4 text-blue-500" title="聚合新闻" />
                      )}
                      <span className="line-clamp-1">{item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.status === 0 && (
                      <Badge variant="outline" className="text-yellow-600">
                        <Clock className="h-3 w-3 mr-1" />
                        待审核
                      </Badge>
                    )}
                    {item.status === 1 && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        已发布
                      </Badge>
                    )}
                    {item.status === 2 && (
                      <Badge variant="default" className="bg-red-600">
                        <XCircle className="h-3 w-3 mr-1" />
                        已拒绝
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{item.views}</TableCell>
                  <TableCell className="text-right">{item.likes}</TableCell>
                  <TableCell>
                    {item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString('zh-CN')
                      : new Date(item.createdAt).toLocaleDateString('zh-CN')
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/news/${item.slug}.html`} target="_blank">
                            <Eye className="mr-2 h-4 w-4" />
                            预览
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/news/${item.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            编辑
                          </Link>
                        </DropdownMenuItem>
                        {/* 审核操作 */}
                        {item.status === 0 && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(item.id)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              通过审核
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReject(item.id)}>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              拒绝
                            </DropdownMenuItem>
                          </>
                        )}
                        {/* 热门操作 */}
                        <DropdownMenuItem onClick={() => handleToggleHot(item.id, item.isHot)}>
                          <Flame className={`mr-2 h-4 w-4 ${item.isHot ? 'text-red-500' : 'text-muted-foreground'}`} />
                          {item.isHot ? '取消热门' : '设为热门'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  暂无资讯数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">总资讯数</div>
          <div className="text-2xl font-bold">{news.length}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">待审核</div>
          <div className="text-2xl font-bold text-yellow-600">
            {news.filter(n => n.status === 0).length}
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">已发布</div>
          <div className="text-2xl font-bold text-green-600">
            {news.filter(n => n.status === 1).length}
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">已拒绝</div>
          <div className="text-2xl font-bold text-red-600">
            {news.filter(n => n.status === 2).length}
          </div>
        </div>
      </div>

      {/* 分类管理弹窗 */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              分类管理
            </DialogTitle>
            <DialogDescription>
              管理资讯分类，可以添加、编辑和删除分类
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* 添加/编辑分类 */}
            <div className="flex gap-2">
              <Input
                placeholder={editingCategory ? '修改分类名称' : '新分类名称'}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={categoryLoading}
              />
              {editingCategory ? (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={cancelEditCategory}
                    disabled={categoryLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleUpdateCategory}
                    disabled={categoryLoading}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleAddCategory}
                  disabled={categoryLoading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加
                </Button>
              )}
            </div>

            {/* 分类列表 */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>分类名称</TableHead>
                    <TableHead className="text-right">资讯数</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <TableRow key={cat.name}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-right">{cat.count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEditCategory(cat.name)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteCategory(cat.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        暂无分类
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

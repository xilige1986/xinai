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
  Star,
  ExternalLink,
  Trash,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';

interface Tool {
  id: number;
  name: string;
  slug: string;
  shortDesc: string;
  imageUrl: string | null;
  pricingType: string;
  status: number;
  sortOrder: number;
  views: number;
  likes: number;
  category?: { name: string };
  subCategory?: { name: string };
}

interface Category {
  id: number;
  name: string;
}

interface AdminToolsPageProps {
  tools: Tool[];
  categories: Category[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export default function AdminToolsPageClient({
  tools: initialTools,
  categories,
  total: initialTotal,
  totalPages: initialTotalPages,
  page: initialPage,
  pageSize: initialPageSize,
}: AdminToolsPageProps) {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  // 搜索和筛选状态
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [categoryId, setCategoryId] = useState<string>('all');

  // 分页状态
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.length === tools.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tools.map((t) => t.id));
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

  // 加载工具列表
  const fetchTools = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status && status !== 'all') params.set('status', status);
      if (categoryId && categoryId !== 'all') params.set('category', categoryId);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());

      const res = await fetch(`/api/admin/tools?${params.toString()}`);
      const data = await res.json();
      if (data.tools) {
        setTools(data.tools);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      toast.error('获取工具列表失败');
    }
  };

  useEffect(() => {
    fetchTools();
  }, [page]);

  // 搜索筛选
  const handleSearch = () => {
    setPage(1);
    setLoading(true);
    fetchTools().finally(() => setLoading(false));
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 个工具吗？此操作不可恢复！`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/tools/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`成功删除 ${data.deletedCount} 个工具`);
        setSelectedIds([]);
        fetchTools();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || '批量删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge variant="secondary" className="text-yellow-600 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            待审核
          </Badge>
        );
      case 1:
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            已发布
          </Badge>
        );
      case 2:
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            已拒绝
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">工具管理</h1>
            <p className="text-sm text-muted-foreground">管理 AI 工具的发布、编辑和排序</p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBatchDelete} disabled={isDeleting}>
              <Trash className="h-4 w-4 mr-2" />
              批量删除 ({selectedIds.length})
            </Button>
          )}
          <Link href="/admin/tools/ai-content">
            <Button variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              AI 内容
            </Button>
          </Link>
          <Link href="/admin/tools/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加工具
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索工具名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); handleSearch(); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="0">待审核</SelectItem>
              <SelectItem value="1">已发布</SelectItem>
              <SelectItem value="2">已拒绝</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryId} onValueChange={(value) => { setCategoryId(value); setPage(1); handleSearch(); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="全部分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} variant="secondary">
            筛选
          </Button>
        </div>
      </div>

      {/* Tools Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.length === tools.length && tools.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[80px]">排序</TableHead>
              <TableHead>工具信息</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>定价</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">数据</TableHead>
              <TableHead className="w-[140px] text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : tools.length > 0 ? (
              tools.map((tool) => (
                <TableRow key={tool.id} className={selectedIds.includes(tool.id) ? 'bg-muted' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(tool.id)}
                      onCheckedChange={() => toggleSelect(tool.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span className="text-sm font-medium">{tool.sortOrder}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {tool.imageUrl ? (
                        <img
                          src={tool.imageUrl}
                          alt={tool.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {tool.name[0]}
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/tool/${tool.slug}`}
                          target="_blank"
                          className="font-medium hover:text-primary hover:underline transition-colors"
                        >
                          {tool.name}
                        </Link>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {tool.shortDesc}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{tool.category?.name}</p>
                      {tool.subCategory && (
                        <p className="text-muted-foreground text-xs">{tool.subCategory.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {tool.pricingType === 'Free' && '免费'}
                      {tool.pricingType === 'Paid' && '付费'}
                      {tool.pricingType === 'Freemium' && '免费增值'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(tool.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm">
                      <p className="text-muted-foreground">👁 {tool.views}</p>
                      <p className="text-muted-foreground">❤️ {tool.likes}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/tool/${tool.slug}`} target="_blank">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="查看">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/tools/${tool.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="编辑">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="更多">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/tool/${tool.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              在新窗口打开
                            </Link>
                          </DropdownMenuItem>
                          {tool.status === 0 && (
                            <>
                              <form action={`/api/tools/${tool.id}/approve`} method="POST">
                                <button type="submit" className="w-full">
                                  <DropdownMenuItem>
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                    通过审核
                                  </DropdownMenuItem>
                                </button>
                              </form>
                              <form action={`/api/tools/${tool.id}/reject`} method="POST">
                                <button type="submit" className="w-full">
                                  <DropdownMenuItem>
                                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                    拒绝
                                  </DropdownMenuItem>
                                </button>
                              </form>
                            </>
                          )}
                          <form action={`/api/tools/${tool.id}/delete`} method="POST">
                            <button type="submit" className="w-full">
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            </button>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无工具数据
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
    </div>
  );
}

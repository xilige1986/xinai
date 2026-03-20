'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Coins,
  Gift,
  Users,
  Share2,
  BookOpen,
  Award,
  MinusCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

interface PointsLog {
  id: number;
  points: number;
  type: string;
  typeLabel: {
    label: string;
    color: string;
    icon: string;
  };
  description: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'ADMIN_ADD', label: '管理员奖励' },
  { value: 'ADMIN_DEDUCT', label: '管理员扣除' },
  { value: 'REFERRAL', label: '推广奖励' },
  { value: 'MULTI_LEVEL_REFERRAL', label: '多级推广奖励' },
  { value: 'COURSE_UNLOCK', label: '课程解锁' },
  { value: 'CONTRIBUTION', label: '贡献奖励' },
];

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    gift: <Gift className="h-4 w-4" />,
    minus: <MinusCircle className="h-4 w-4" />,
    users: <Users className="h-4 w-4" />,
    share: <Share2 className="h-4 w-4" />,
    'book-open': <BookOpen className="h-4 w-4" />,
    award: <Award className="h-4 w-4" />,
    circle: <Circle className="h-4 w-4" />,
  };
  return icons[iconName] || <Circle className="h-4 w-4" />;
};

export default function PointsPage() {
  const [logs, setLogs] = useState<PointsLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [stats, setStats] = useState<Stats>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const fetchLogs = async (page: number = 1, type: string = 'all') => {
    setLoading(true);
    try {
      let url = `/api/user/points?page=${page}&limit=20`;
      if (type && type !== 'all') {
        url += `&type=${type}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        toast.error('获取积分记录失败');
      }
    } catch (error) {
      console.error('Fetch logs error:', error);
      toast.error('网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, filterType);
  }, [filterType]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchLogs(newPage, filterType);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">积分记录</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">当前积分</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.balance}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">累计收入</p>
                  <p className="text-3xl font-bold text-green-600">+{stats.totalIncome}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">累计支出</p>
                  <p className="text-3xl font-bold text-red-600">-{stats.totalExpense}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">筛选类型：</span>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Points Log List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              积分明细
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">加载中...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Coins className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>暂无积分记录</p>
                <p className="text-sm mt-1">通过推广、贡献等方式获取积分</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            log.points > 0
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {getIcon(log.typeLabel.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{log.typeLabel.label}</span>
                            <Badge
                              variant={log.points > 0 ? 'default' : 'destructive'}
                              className={
                                log.points > 0
                                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                  : ''
                              }
                            >
                              {log.points > 0 ? '+' : ''}
                              {log.points}
                            </Badge>
                          </div>
                          {log.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {log.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground">
                      共 {pagination.total} 条记录，第 {pagination.page}/{pagination.pages} 页
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                      >
                        下一页
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3">积分说明</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                通过邀请好友注册可获得推广积分奖励
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                创始股东可享受多级推广奖励（2级、3级）
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                积分可用于解锁课程、兑换权益等
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">4.</span>
                管理员可能会根据活动或规则调整您的积分
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

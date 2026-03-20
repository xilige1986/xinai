'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, CheckCircle, XCircle, Trash2, Download } from 'lucide-react';
import Link from 'next/link';

interface Subscriber {
  id: number;
  email: string;
  name: string | null;
  status: number;
  source: string;
  createdAt: string;
}

export default function SubscribersPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });

  const fetchSubscribers = async (status: string) => {
    setLoading(true);
    try {
      const statusMap: Record<string, number> = {
        active: 1,
        inactive: 0,
        all: -1,
      };
      const url = status === 'all'
        ? '/api/admin/subscribers'
        : `/api/admin/subscribers?status=${statusMap[status]}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers);
      }
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [activeRes, inactiveRes, allRes] = await Promise.all([
        fetch('/api/admin/subscribers?status=1'),
        fetch('/api/admin/subscribers?status=0'),
        fetch('/api/admin/subscribers'),
      ]);
      const [active, inactive, all] = await Promise.all([
        activeRes.json(),
        inactiveRes.json(),
        allRes.json(),
      ]);
      setStats({
        active: active.total,
        inactive: inactive.total,
        total: all.total,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchSubscribers(activeTab);
    fetchStats();
  }, [activeTab]);

  const handleToggleStatus = async (subscriber: Subscriber) => {
    try {
      const newStatus = subscriber.status === 1 ? 0 : 1;
      const res = await fetch(`/api/subscribe?email=${encodeURIComponent(subscriber.email)}`, {
        method: newStatus === 0 ? 'DELETE' : 'POST',
      });
      if (res.ok) {
        fetchSubscribers(activeTab);
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDelete = async (subscriber: Subscriber) => {
    if (!confirm('确定要删除这个订阅者吗？')) return;
    try {
      const res = await fetch(`/api/admin/subscribers/${subscriber.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchSubscribers(activeTab);
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete subscriber:', error);
    }
  };

  const exportEmails = () => {
    const emails = filteredSubscribers.map(s => s.email).join('\n');
    const blob = new Blob([emails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="bg-green-500">已订阅</Badge>;
      case 0:
        return <Badge variant="secondary">已取消</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            邮件订阅管理
          </h1>
          <p className="text-muted-foreground mt-1">管理资讯邮件订阅者</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportEmails}>
            <Download className="mr-2 h-4 w-4" />
            导出邮箱
          </Button>
          <Link href="/admin">
            <Button variant="outline">返回后台</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已订阅</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">已取消</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="搜索邮箱或姓名..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="active">
            已订阅 ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            已取消 ({stats.inactive})
          </TabsTrigger>
          <TabsTrigger value="all">
            全部 ({stats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暂无{activeTab === 'active' ? '已订阅' : activeTab === 'inactive' ? '已取消' : ''}用户</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSubscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="flex items-center justify-between p-4 bg-card rounded-lg border"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{subscriber.email}</span>
                      {getStatusBadge(subscriber.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {subscriber.name && <span className="mr-4">姓名: {subscriber.name}</span>}
                      <span>来源: {subscriber.source}</span>
                      <span className="ml-4">
                        订阅时间: {new Date(subscriber.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(subscriber)}
                    >
                      {subscriber.status === 1 ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1 text-red-500" />
                          取消订阅
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                          恢复订阅
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleDelete(subscriber)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

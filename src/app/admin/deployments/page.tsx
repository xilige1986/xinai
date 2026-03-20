'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Fingerprint,
  Server,
  Activity,
  Globe,
  Clock,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface Deployment {
  id: number;
  fingerprint: string;
  domain: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  reportCount: number;
  version: string;
  isActive: boolean;
}

interface DeploymentStats {
  currentFingerprint: string;
  stats: {
    total: number;
    active: number;
    recent: number;
  };
  current: Deployment | null;
  deployments: Deployment[];
}

export default function DeploymentsPage() {
  const [data, setData] = useState<DeploymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/deployments');
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(result);
    } catch (error) {
      toast.error('获取部署统计失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredDeployments = data?.deployments.filter((d) =>
    d.fingerprint.toLowerCase().includes(search.toLowerCase()) ||
    d.domain?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">加载中...</div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Fingerprint className="h-6 w-6 text-primary" />
            部署统计
          </h1>
          <p className="text-muted-foreground mt-1">
            追踪项目部署情况，统计使用数据
          </p>
        </div>
      </div>

      {/* Current Deployment */}
      {data?.current && (
        <Card className="mb-6 border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              当前部署
              <Badge variant="default" className="bg-green-500">当前</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">指纹</p>
                <p className="font-mono text-sm break-all">{data.current.fingerprint}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">域名</p>
                <p className="font-medium">{data.current.domain || 'localhost'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">版本</p>
                <p className="font-medium">{data.current.version}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">上报次数</p>
                <p className="font-medium">{data.current.reportCount}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                首次部署: {formatDate(data.current.firstSeenAt)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                最后活跃: {formatDate(data.current.lastSeenAt)} ({getTimeAgo(data.current.lastSeenAt)})
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总部署数</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">所有时间</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">活跃部署</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.stats.active || 0}</div>
            <p className="text-xs text-muted-foreground">7天内有上报</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">近期新增</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data?.stats.recent || 0}</div>
            <p className="text-xs text-muted-foreground">30天内新增</p>
          </CardContent>
        </Card>
      </div>

      {/* Deployments List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>部署列表</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索指纹或域名..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDeployments.length > 0 ? (
              filteredDeployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className={`p-4 rounded-lg border ${
                    deployment.fingerprint === data?.currentFingerprint
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                          {deployment.fingerprint.slice(0, 16)}...
                        </code>
                        {deployment.fingerprint === data?.currentFingerprint && (
                          <Badge variant="default" className="bg-primary">当前</Badge>
                        )}
                        {deployment.isActive ? (
                          <Badge variant="outline" className="text-green-500">活跃</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400">停用</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">域名:</span>{' '}
                          <span className="truncate">{deployment.domain || 'localhost'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">版本:</span>{' '}
                          {deployment.version}
                        </div>
                        <div>
                          <span className="text-muted-foreground">上报:</span>{' '}
                          {deployment.reportCount}次
                        </div>
                        <div>
                          <span className="text-muted-foreground">最后活跃:</span>{' '}
                          {getTimeAgo(deployment.lastSeenAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无部署数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* License Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">开源许可信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>本项目采用 AGPL-3.0 许可证开源</p>
            <p>商业使用需获得授权，违者将追究法律责任</p>
            <p>部署统计仅用于了解项目使用情况，不包含任何用户数据</p>
            <p className="pt-2">
              <a
                href="https://github.com/xilige1986/xinai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                查看源码 →
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

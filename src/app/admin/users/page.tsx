'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Users,
  Crown,
  User,
  Star,
  Loader2,
  Search,
  ChevronLeft,
  Shield,
  Coins,
  Share2,
  Gift,
  Clock,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface UserData {
  id: number;
  username: string;
  email: string;
  name: string | null;
  role: string;
  membership: string;
  status: number;
  createdAt: string;
  avatar: string | null;
  points: number;
  referralCount: number;
}

interface ReferralDetail {
  user: {
    id: number;
    username: string;
    name: string | null;
    avatar: string | null;
    membership: string;
    createdAt: string;
  };
  referralInfo: {
    referralCode: string | null;
    referralLink: string | null;
    referralCount: number;
    points: number;
    referrer: {
      id: number;
      username: string;
      name: string | null;
    } | null;
  };
  stats: {
    level1: { count: number; points: number };
    level2: { count: number; points: number };
    level3: { count: number; points: number };
    totalPoints: number;
  };
  records: {
    level1: Array<{
      id: number;
      referredUser: {
        id: number;
        username: string;
        name: string | null;
        avatar: string | null;
        membership: string;
        createdAt: string;
      };
      points: number;
      status: number;
      createdAt: string;
    }>;
    level2: Array<{
      id: number;
      level: 2;
      referredUser: {
        id: number;
        username: string;
        name: string | null;
        avatar: string | null;
        membership: string;
        createdAt: string;
      };
      points: number;
      status: number;
      createdAt: string;
    }>;
    level3: Array<{
      id: number;
      level: 3;
      referredUser: {
        id: number;
        username: string;
        name: string | null;
        avatar: string | null;
        membership: string;
        createdAt: string;
      };
      points: number;
      status: number;
      createdAt: string;
    }>;
  };
}

const membershipConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  MEMBER: {
    label: '普通会员',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: <User className="h-3 w-3" />,
  },
  VIP: {
    label: 'VIP会员',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: <Crown className="h-3 w-3" />,
  },
  FOUNDER: {
    label: '创始股东',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: <Star className="h-3 w-3" />,
  },
};

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    member: 0,
    vip: 0,
    founder: 0,
    admin: 0,
  });
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newMembership, setNewMembership] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'membership' | 'points' | 'referral'>('membership');

  // 积分管理
  const [newPoints, setNewPoints] = useState<number>(0);
  const [pointsReason, setPointsReason] = useState('');

  // 推广详情
  const [referralDetail, setReferralDetail] = useState<ReferralDetail | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);

  const fetchUsers = async (membershipFilter: string) => {
    setLoading(true);
    try {
      let url = '/api/admin/users';
      if (membershipFilter !== 'all') {
        url += `?membership=${membershipFilter}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/users/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchUsers(activeTab);
    fetchStats();
  }, [activeTab]);

  const handleUpdateMembership = async () => {
    if (!selectedUser || !newMembership) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/membership`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membership: newMembership }),
      });
      if (res.ok) {
        fetchUsers(activeTab);
        fetchStats();
        setDialogOpen(false);
        setSelectedUser(null);
        setNewMembership('');
      } else {
        const error = await res.json();
        alert(error.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update membership:', error);
      alert('更新失败');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePoints = async () => {
    if (!selectedUser || typeof newPoints !== 'number') return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/points`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: newPoints, reason: pointsReason }),
      });
      if (res.ok) {
        const result = await res.json();
        fetchUsers(activeTab);
        setDialogOpen(false);
        setSelectedUser(null);
        setNewPoints(0);
        setPointsReason('');
        alert(`积分更新成功！原积分: ${result.previousPoints}, 变动: ${result.change > 0 ? '+' : ''}${result.change}`);
      } else {
        const error = await res.json();
        alert(error.error || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update points:', error);
      alert('更新失败');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchReferralDetail = async (userId: number) => {
    setReferralLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/referral`);
      if (res.ok) {
        const data = await res.json();
        setReferralDetail(data);
      } else {
        alert('获取推广详情失败');
      }
    } catch (error) {
      console.error('Failed to fetch referral detail:', error);
      alert('获取推广详情失败');
    } finally {
      setReferralLoading(false);
    }
  };

  const openMembershipDialog = (user: UserData) => {
    setSelectedUser(user);
    setNewMembership(user.membership);
    setDialogType('membership');
    setDialogOpen(true);
  };

  const openPointsDialog = (user: UserData) => {
    setSelectedUser(user);
    setNewPoints(user.points || 0);
    setPointsReason('');
    setDialogType('points');
    setDialogOpen(true);
  };

  const openReferralDialog = async (user: UserData) => {
    setSelectedUser(user);
    setDialogType('referral');
    setDialogOpen(true);
    await fetchReferralDetail(user.id);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getMembershipBadge = (membership: string) => {
    const config = membershipConfig[membership] || membershipConfig.MEMBER;
    return (
      <Badge className={`${config.bgColor} ${config.color} border-0`}>
        <span className="flex items-center gap-1">
          {config.icon}
          {config.label}
        </span>
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <Badge variant="default" className="bg-red-500">
          <Shield className="h-3 w-3 mr-1" />
          管理员
        </Badge>
      );
    }
    return <Badge variant="secondary">普通用户</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            用户管理
          </h1>
          <p className="text-muted-foreground mt-1">管理系统用户及会员分组</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            返回后台
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">普通会员</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.member}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">VIP会员</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.vip}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">创始股东</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.founder}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">管理员</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.admin}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索用户名、邮箱或姓名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">全部 ({stats.total})</TabsTrigger>
          <TabsTrigger value="MEMBER">普通会员 ({stats.member})</TabsTrigger>
          <TabsTrigger value="VIP">VIP会员 ({stats.vip})</TabsTrigger>
          <TabsTrigger value="FOUNDER">创始股东 ({stats.founder})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暂无用户</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-card rounded-lg border"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{user.username}</span>
                      {getMembershipBadge(user.membership)}
                      {getRoleBadge(user.role)}
                      {user.status === 0 && (
                        <Badge variant="destructive">已禁用</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="mr-4">邮箱: {user.email}</span>
                      {user.name && <span className="mr-4">姓名: {user.name}</span>}
                      <span className="mr-4 flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        积分: {user.points || 0}
                      </span>
                      {user.referralCount > 0 && (
                        <span className="mr-4 flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          推广: {user.referralCount}人
                        </span>
                      )}
                      <span>
                        注册时间: {new Date(user.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openReferralDialog(user)}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      推广详情
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPointsDialog(user)}
                    >
                      <Coins className="h-4 w-4 mr-1" />
                      修改积分
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openMembershipDialog(user)}
                    >
                      <Crown className="h-4 w-4 mr-1" />
                      修改分组
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={dialogType === 'referral' ? 'max-w-4xl max-h-[80vh] overflow-y-auto' : ''}>
          {dialogType === 'membership' && (
            <>
              <DialogHeader>
                <DialogTitle>修改用户分组</DialogTitle>
                <DialogDescription>
                  为用户 <span className="font-medium">{selectedUser?.username}</span> 选择新的会员分组
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select value={newMembership} onValueChange={setNewMembership}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择会员分组" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-600" />
                        普通会员 - 仅可访问免费课程
                      </span>
                    </SelectItem>
                    <SelectItem value="VIP">
                      <span className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-600" />
                        VIP会员 - 可访问所有课程
                      </span>
                    </SelectItem>
                    <SelectItem value="FOUNDER">
                      <span className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-purple-600" />
                        创始股东 - 可访问所有课程 + 收益/贡献
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">取消</Button>
                </DialogClose>
                <Button onClick={handleUpdateMembership} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  确认修改
                </Button>
              </DialogFooter>
            </>
          )}

          {dialogType === 'points' && (
            <>
              <DialogHeader>
                <DialogTitle>修改用户积分</DialogTitle>
                <DialogDescription>
                  为用户 <span className="font-medium">{selectedUser?.username}</span> 调整积分余额
                  <br />
                  <span className="text-sm text-muted-foreground">当前积分: {selectedUser?.points || 0}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">新积分值</label>
                  <Input
                    type="number"
                    min={0}
                    value={newPoints}
                    onChange={(e) => setNewPoints(parseInt(e.target.value) || 0)}
                    placeholder="输入新的积分值"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    变动: {newPoints - (selectedUser?.points || 0) > 0 ? '+' : ''}{newPoints - (selectedUser?.points || 0)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">调整原因（可选）</label>
                  <Input
                    value={pointsReason}
                    onChange={(e) => setPointsReason(e.target.value)}
                    placeholder="例如：活动奖励、补偿等"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">取消</Button>
                </DialogClose>
                <Button onClick={handleUpdatePoints} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  确认修改
                </Button>
              </DialogFooter>
            </>
          )}

          {dialogType === 'referral' && (
            <>
              <DialogHeader>
                <DialogTitle>用户推广详情</DialogTitle>
                <DialogDescription>
                  查看 <span className="font-medium">{selectedUser?.username}</span> 的推广情况
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {referralLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : referralDetail ? (
                  <div className="space-y-6">
                    {/* 推广信息概览 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">推广码</p>
                              <p className="text-xl font-bold font-mono">
                                {referralDetail.referralInfo.referralCode || '未生成'}
                              </p>
                            </div>
                            <Share2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">推广人数</p>
                              <p className="text-xl font-bold">{referralDetail.referralInfo.referralCount}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">推广获得积分</p>
                              <p className="text-xl font-bold text-amber-600">
                                {referralDetail.stats.totalPoints}
                              </p>
                            </div>
                            <Gift className="h-8 w-8 text-amber-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 推荐人信息 */}
                    {referralDetail.referralInfo.referrer && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">推荐人</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                              {(referralDetail.referralInfo.referrer.name || referralDetail.referralInfo.referrer.username).slice(0, 1)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {referralDetail.referralInfo.referrer.name || referralDetail.referralInfo.referrer.username}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{referralDetail.referralInfo.referrer.username}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 推广统计 */}
                    {referralDetail.user.membership === 'FOUNDER' && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Star className="h-4 w-4 text-purple-600" />
                            创始股东多级推广统计
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                              <p className="text-sm text-muted-foreground">1级推广（直接）</p>
                              <p className="text-2xl font-bold">{referralDetail.stats.level1.count}</p>
                              <p className="text-sm text-muted-foreground">
                                收益 {referralDetail.stats.level1.points} 积分
                              </p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                              <p className="text-sm text-muted-foreground">2级推广（间接）</p>
                              <p className="text-2xl font-bold">{referralDetail.stats.level2.count}</p>
                              <p className="text-sm text-muted-foreground">
                                收益 {referralDetail.stats.level2.points} 积分
                              </p>
                            </div>
                            <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                              <p className="text-sm text-muted-foreground">3级推广（间接）</p>
                              <p className="text-2xl font-bold">{referralDetail.stats.level3.count}</p>
                              <p className="text-sm text-muted-foreground">
                                收益 {referralDetail.stats.level3.points} 积分
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 推广链接 */}
                    {referralDetail.referralInfo.referralLink && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">推广链接</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Input
                              value={referralDetail.referralInfo.referralLink}
                              readOnly
                              className="bg-muted font-mono text-sm"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(referralDetail.referralInfo.referralLink!);
                                alert('推广链接已复制');
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 推广记录 */}
                    {referralDetail.records.level1.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            直接推广记录（1级）
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {referralDetail.records.level1.map((record) => (
                              <div
                                key={record.id}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                                    {(record.referredUser.name || record.referredUser.username).slice(0, 1)}
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {record.referredUser.name || record.referredUser.username}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-green-600">+{record.points} 积分</p>
                                  <p className="text-xs text-muted-foreground">
                                    {record.status === 1 ? '已到账' : '处理中'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 多级推广记录 */}
                    {referralDetail.user.membership === 'FOUNDER' &&
                      (referralDetail.records.level2.length > 0 || referralDetail.records.level3.length > 0) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Star className="h-4 w-4 text-purple-600" />
                            多级推广记录（2级/3级）
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {[...referralDetail.records.level2, ...referralDetail.records.level3].map((record) => (
                              <div
                                key={record.id}
                                className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                    {(record.referredUser.name || record.referredUser.username).slice(0, 1)}
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {record.referredUser.name || record.referredUser.username}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                                      <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                        record.level === 2
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-pink-100 text-pink-700'
                                      }`}>
                                        {record.level}级
                                      </span>
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-purple-600">+{record.points} 积分</p>
                                  <p className="text-xs text-muted-foreground">
                                    {record.status === 1 ? '已到账' : '处理中'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {referralDetail.records.level1.length === 0 &&
                      referralDetail.records.level2.length === 0 &&
                      referralDetail.records.level3.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Share2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>暂无推广记录</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>获取推广详情失败</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">关闭</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

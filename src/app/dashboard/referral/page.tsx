'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Users,
  Gift,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface ReferralRecord {
  id: number;
  level: number;
  referredUser: {
    id: number;
    username: string;
    name: string | null;
    avatar: string | null;
  };
  points: number;
  status: number;
  createdAt: string;
}

interface LevelStats {
  enabled: boolean;
  count: number;
  points: number;
  rewardPerReferral: number;
}

interface ReferralData {
  enabled: boolean;
  referralCode: string;
  referralLink: string;
  isFounder: boolean;
  level2Enabled: boolean;
  level3Enabled: boolean;
  stats: {
    totalReferrals: number;
    totalPoints: number;
    rewardPoints: number;
    level2: LevelStats | null;
    level3: LevelStats | null;
  };
  records: ReferralRecord[];
  multiLevelRecords: ReferralRecord[];
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const res = await fetch('/api/user/referral');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        toast({
          title: '获取数据失败',
          description: '请稍后重试',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '网络错误',
        description: '请检查网络连接',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: type === 'code' ? '推广码已复制' : '推广链接已复制',
      description: '快去分享给好友吧！',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">我的推广</h1>
          </div>
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">我的推广</h1>
          </div>
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Share2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">推广功能暂未开启</h3>
              <p className="text-muted-foreground">敬请期待后续更新</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold">我的推广</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">成功邀请</p>
                  <p className="text-3xl font-bold">{data.stats.totalReferrals}</p>
                  {data.isFounder && data.stats.level2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      +{data.stats.level2.count + (data.stats.level3?.count || 0)} 间接邀请
                    </p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">累计积分</p>
                  <p className="text-3xl font-bold text-amber-600">{data.stats.totalPoints}</p>
                  {data.isFounder && data.stats.level2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      含 {data.stats.level2.points + (data.stats.level3?.points || 0)} 多级奖励
                    </p>
                  )}
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Gift className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">每邀请奖励</p>
                  <p className="text-3xl font-bold text-green-600">+{data.stats.rewardPoints}</p>
                  {data.isFounder && (
                    <p className="text-xs text-green-600 mt-1">
                      创始股东享3级奖励
                    </p>
                  )}
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Share2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 创始股东专属：多级推广统计 */}
        {data.isFounder && (
          <Card className="mb-8 border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Users className="h-5 w-5" />
                创始股东专属：3级推广收益
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1级推广 */}
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">1级推广（直接）</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">直接邀请</span>
                  </div>
                  <p className="text-2xl font-bold">{data.stats.totalReferrals}</p>
                  <p className="text-sm text-muted-foreground">
                    收益 {data.stats.totalPoints - (data.stats.level2?.points || 0) - (data.stats.level3?.points || 0)} 积分
                  </p>
                  <p className="text-xs text-purple-600 mt-1">+{data.stats.rewardPoints} 积分/人</p>
                </div>

                {/* 2级推广 */}
                <div className={`rounded-lg p-4 border ${data.level2Enabled ? 'bg-white border-purple-100' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">2级推广（间接）</span>
                    {!data.level2Enabled && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">已禁用</span>}
                  </div>
                  <p className="text-2xl font-bold">{data.stats.level2?.count || 0}</p>
                  <p className="text-sm text-muted-foreground">
                    收益 {data.stats.level2?.points || 0} 积分
                  </p>
                  <p className="text-xs text-purple-600 mt-1">+{data.stats.level2?.rewardPerReferral || 5} 积分/人</p>
                </div>

                {/* 3级推广 */}
                <div className={`rounded-lg p-4 border ${data.level3Enabled ? 'bg-white border-purple-100' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">3级推广（间接）</span>
                    {!data.level3Enabled && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">已禁用</span>}
                  </div>
                  <p className="text-2xl font-bold">{data.stats.level3?.count || 0}</p>
                  <p className="text-sm text-muted-foreground">
                    收益 {data.stats.level3?.points || 0} 积分
                  </p>
                  <p className="text-xs text-purple-600 mt-1">+{data.stats.level3?.rewardPerReferral || 3} 积分/人</p>
                </div>
              </div>

              <div className="mt-4 text-sm text-purple-600 bg-purple-100/50 p-3 rounded-lg">
                <p className="flex items-start gap-2">
                  <span>💡</span>
                  <span>
                    作为创始股东，您不仅可以获得直接邀请的奖励，还能获得下级用户邀请的间接奖励！
                    <br />
                    例如：您邀请A，A邀请B，B邀请C，您能获得A的1级奖励 + B的2级奖励 + C的3级奖励。
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referral Code & Link */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              我的推广信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Referral Code */}
            <div>
              <label className="text-sm font-medium mb-2 block">推广码</label>
              <div className="flex gap-2">
                <Input
                  value={data.referralCode}
                  readOnly
                  className="font-mono text-lg bg-muted"
                />
                <Button
                  onClick={() => copyToClipboard(data.referralCode, 'code')}
                  variant="outline"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Referral Link */}
            <div>
              <label className="text-sm font-medium mb-2 block">推广链接</label>
              <div className="flex gap-2">
                <Input
                  value={data.referralLink}
                  readOnly
                  className="bg-muted"
                />
                <Button
                  onClick={() => copyToClipboard(data.referralLink, 'link')}
                  variant="outline"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  const shareText = `快来加入AI工具库！使用我的推广码 ${data.referralCode} 注册，我们都能获得积分奖励！${data.referralLink}`;
                  copyToClipboard(shareText, 'link');
                }}
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                一键复制分享文案
              </Button>
              <Link href={`/register?ref=${data.referralCode}`} target="_blank">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  预览注册页
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Referral Records */}
        <Card>
          <CardHeader>
            <CardTitle>推广记录</CardTitle>
          </CardHeader>
          <CardContent>
            {data.records.length > 0 || data.multiLevelRecords.length > 0 ? (
              <div className="space-y-4">
                {/* 1级推广记录 */}
                {data.records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                        {(record.referredUser.name || record.referredUser.username).slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {record.referredUser.name || record.referredUser.username}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">1级</span>
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

                {/* 多级推广记录（仅创始股东可见） */}
                {data.isFounder && data.multiLevelRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-purple-100 bg-purple-50/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                        {(record.referredUser.name || record.referredUser.username).slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {record.referredUser.name || record.referredUser.username}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
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
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">还没有推广记录</p>
                <p className="text-sm text-muted-foreground mt-1">
                  分享您的推广链接，邀请好友注册即可获得积分奖励！
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3">推广小贴士</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                将推广链接分享到社交媒体、微信群、朋友圈等
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                好友通过您的链接注册成功后，您即可获得 {data.stats.rewardPoints} 积分
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                积分可用于兑换课程、抵扣购买等（功能即将上线）
              </li>
              {data.isFounder ? (
                <>
                  <li className="flex items-start gap-2 text-purple-600">
                    <span>💎</span>
                    <span>创始股东专属：您还能获得2级、3级间接推广奖励！</span>
                  </li>
                  <li className="flex items-start gap-2 text-purple-600">
                    <span>🎁</span>
                    <span>
                      您的下级用户邀请他人，您可获得 {data.stats.level2?.rewardPerReferral || 5} 积分（2级）；
                      下下级邀请他人，您可获得 {data.stats.level3?.rewardPerReferral || 3} 积分（3级）
                    </span>
                  </li>
                </>
              ) : (
                <li className="flex items-start gap-2 text-amber-600">
                  <span>⭐</span>
                  <span>成为创始股东即可解锁3级推广收益，让下级帮您赚钱！</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

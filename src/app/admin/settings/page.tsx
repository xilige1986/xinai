'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Settings,
  Gift,
  Globe,
  Mail,
  FileText,
  Shield,
  Upload,
  ImageIcon,
  X,
  Users,
  Crown,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

interface SiteSettings {
  siteName: string;
  siteDomain: string;
  siteDescription: string;
  siteKeywords: string;
  siteEmail: string;
  siteCopyright: string;
  footerText: string;
  siteIcp: string;
  siteIcpLink: string;
  siteLogo: string;
  siteFavicon: string;
  // 推广设置
  referralEnabled: string;
  referralRewardPoints: string;
  // 多级推广设置
  referralLevel2Enabled: string;
  referralLevel3Enabled: string;
  referralLevel2Reward: string;
  referralLevel3Reward: string;
  referralFounderOnly: string;
  // 注册验证设置
  registerEmailVerify: string;
  registerPhoneVerify: string;
}

const defaultSettings: SiteSettings = {
  siteName: 'AI工具库',
  siteDomain: 'localhost:3000',
  siteDescription: '发现优质AI工具，提升工作效率',
  siteKeywords: 'AI工具,人工智能,AI应用,AI软件',
  siteEmail: '',
  siteCopyright: '',
  footerText: '',
  siteIcp: '',
  siteIcpLink: '',
  siteLogo: '',
  siteFavicon: '',
  // 推广设置
  referralEnabled: 'true',
  referralRewardPoints: '10',
  // 多级推广设置
  referralLevel2Enabled: 'true',
  referralLevel3Enabled: 'true',
  referralLevel2Reward: '5',
  referralLevel3Reward: '3',
  referralFounderOnly: 'true',
  // 注册验证设置
  registerEmailVerify: 'false',
  registerPhoneVerify: 'false',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [logoPreview, setLogoPreview] = useState('');
  const [faviconPreview, setFaviconPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const mergedSettings = { ...defaultSettings, ...data.settings };
        setSettings(mergedSettings);
        setLogoPreview(mergedSettings.siteLogo || '');
        setFaviconPreview(mergedSettings.siteFavicon || '');
      }
    } catch (error) {
      toast.error('获取设置失败', {
        description: '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('保存成功', {
          description: '设置已更新，刷新页面后可看到最新效果',
        });
      } else {
        throw new Error(data.error || `保存失败 (${res.status})`);
      }
    } catch (error: any) {
      console.error('Save settings error:', error);
      toast.error('保存失败', {
        description: error.message || '请稍后重试',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `上传失败 (${response.status})`);
      }

      const data = await response.json();
      const imageUrl = data.url || data.imageUrl;

      if (!imageUrl) {
        throw new Error('返回数据格式错误');
      }

      if (type === 'logo') {
        setLogoPreview(imageUrl);
        updateSetting('siteLogo', imageUrl);
      } else {
        setFaviconPreview(imageUrl);
        updateSetting('siteFavicon', imageUrl);
      }

      toast.success('上传成功', {
        description: '记得点击"保存设置"按钮保存更改',
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('图片上传失败', {
        description: err.message || '请稍后重试',
      });
    }
  };

  const handleRemoveImage = (type: 'logo' | 'favicon') => {
    if (type === 'logo') {
      setLogoPreview('');
      updateSetting('siteLogo', '');
    } else {
      setFaviconPreview('');
      updateSetting('siteFavicon', '');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">网站设置</h1>
        </div>
        <div className="text-center py-20">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            网站设置
          </h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="seo">SEO设置</TabsTrigger>
          <TabsTrigger value="legal">备案信息</TabsTrigger>
          <TabsTrigger value="referral">推广设置</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="basic">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  基础设置
                </CardTitle>
                <CardDescription>
                  设置网站的名称、域名、联系信息等
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="siteName">网站名称 *</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => updateSetting('siteName', e.target.value)}
                    placeholder="AI工具库"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    显示在网站标题和导航栏的名称
                  </p>
                </div>
                <div>
                  <Label htmlFor="siteDomain">网站域名</Label>
                  <Input
                    id="siteDomain"
                    value={settings.siteDomain}
                    onChange={(e) => updateSetting('siteDomain', e.target.value)}
                    placeholder="example.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    网站的主域名，用于生成链接
                  </p>
                </div>
                <div>
                  <Label htmlFor="siteEmail">联系邮箱</Label>
                  <Input
                    id="siteEmail"
                    type="email"
                    value={settings.siteEmail}
                    onChange={(e) => updateSetting('siteEmail', e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Logo & Favicon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  品牌标识
                </CardTitle>
                <CardDescription>
                  上传网站的 Logo 和 Favicon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo 上传 */}
                <div>
                  <Label>网站 Logo</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {logoPreview ? (
                      <div className="relative">
                        <div className="w-[164px] h-[36px] rounded-lg border overflow-hidden bg-white">
                          <img
                            src={logoPreview}
                            alt="Logo"
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('logo')}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-[164px] h-[36px] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center bg-muted/50">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors w-fit">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">上传 Logo</span>
                        <input
                          type="file"
                          accept="image/png,image/svg+xml,image/webp"
                          onChange={(e) => handleLogoUpload(e, 'logo')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Favicon 上传 */}
                <div>
                  <Label>网站 Favicon</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {faviconPreview ? (
                      <div className="relative">
                        <div className="w-16 h-16 rounded-lg border overflow-hidden bg-white">
                          <img
                            src={faviconPreview}
                            alt="Favicon"
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('favicon')}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center bg-muted/50">
                        <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors w-fit">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">上传 Favicon</span>
                        <input
                          type="file"
                          accept="image/x-icon,image/png,image/svg+xml"
                          onChange={(e) => handleLogoUpload(e, 'favicon')}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        推荐 ICO/PNG 格式，建议尺寸 32x32px
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEO 设置 */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                SEO 设置
              </CardTitle>
              <CardDescription>
                设置网站的搜索引擎优化信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="siteDescription">网站描述</Label>
                <textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => updateSetting('siteDescription', e.target.value)}
                  placeholder="发现优质AI工具，提升工作效率"
                  rows={4}
                  className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  用于SEO和搜索引擎展示，建议150字以内
                </p>
              </div>
              <Separator />
              <div>
                <Label htmlFor="siteKeywords">网站关键词</Label>
                <Input
                  id="siteKeywords"
                  value={settings.siteKeywords}
                  onChange={(e) => updateSetting('siteKeywords', e.target.value)}
                  placeholder="AI工具,人工智能,AI应用,AI软件"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  多个关键词用英文逗号分隔
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 备案信息 */}
        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                备案信息
              </CardTitle>
              <CardDescription>
                设置网站的ICP备案信息（中国大陆网站必填）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteIcp">备案号</Label>
                <Input
                  id="siteIcp"
                  value={settings.siteIcp}
                  onChange={(e) => updateSetting('siteIcp', e.target.value)}
                  placeholder="京ICP备12345678号"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  工业和信息化部颁发的ICP备案号
                </p>
              </div>
              <div>
                <Label htmlFor="siteIcpLink">备案链接</Label>
                <Input
                  id="siteIcpLink"
                  value={settings.siteIcpLink}
                  onChange={(e) => updateSetting('siteIcpLink', e.target.value)}
                  placeholder="https://beian.miit.gov.cn"
                />
              </div>
              <Separator />
              <div>
                <Label htmlFor="siteCopyright">版权信息</Label>
                <Input
                  id="siteCopyright"
                  value={settings.siteCopyright}
                  onChange={(e) => updateSetting('siteCopyright', e.target.value)}
                  placeholder="© 2024 AI工具库 版权所有"
                />
              </div>
              <div>
                <Label htmlFor="footerText">底部文本</Label>
                <textarea
                  id="footerText"
                  value={settings.footerText}
                  onChange={(e) => updateSetting('footerText', e.target.value)}
                  placeholder="本站所有内容仅供参考"
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 推广设置 */}
        <TabsContent value="referral">
          <div className="space-y-6">
            {/* 基础推广设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  基础推广设置
                </CardTitle>
                <CardDescription>
                  配置用户推广功能和1级奖励
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="referralEnabled" className="text-base">启用推广功能</Label>
                    <p className="text-sm text-muted-foreground">
                      关闭后用户将无法使用推广功能
                    </p>
                  </div>
                  <Switch
                    id="referralEnabled"
                    checked={settings.referralEnabled === 'true'}
                    onCheckedChange={(checked) =>
                      updateSetting('referralEnabled', checked ? 'true' : 'false')
                    }
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="referralRewardPoints">1级推广奖励积分</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      直接邀请好友注册获得的积分
                    </p>
                    <Input
                      id="referralRewardPoints"
                      type="number"
                      min={1}
                      max={1000}
                      value={settings.referralRewardPoints}
                      onChange={(e) => updateSetting('referralRewardPoints', e.target.value)}
                      placeholder="10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 多级推广设置 */}
            <Card className="border-purple-200">
              <CardHeader className="bg-purple-50/50">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Users className="h-5 w-5" />
                  多级推广设置
                </CardTitle>
                <CardDescription>
                  配置2级、3级推广奖励，仅限创始股东享受
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* 创始股东限制 */}
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5 text-amber-600" />
                    <div>
                      <Label htmlFor="referralFounderOnly" className="text-base font-medium">仅限创始股东</Label>
                      <p className="text-sm text-muted-foreground">
                        开启后只有创始股东才能享受2级、3级推广奖励
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="referralFounderOnly"
                    checked={settings.referralFounderOnly === 'true'}
                    onCheckedChange={(checked) =>
                      updateSetting('referralFounderOnly', checked ? 'true' : 'false')
                    }
                  />
                </div>

                <Separator />

                {/* 2级推广设置 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">2级推广（间接邀请）</Label>
                      <p className="text-sm text-muted-foreground">
                        您邀请的人再邀请其他人，您获得的奖励
                      </p>
                    </div>
                    <Switch
                      checked={settings.referralLevel2Enabled === 'true'}
                      onCheckedChange={(checked) =>
                        updateSetting('referralLevel2Enabled', checked ? 'true' : 'false')
                      }
                    />
                  </div>
                  {settings.referralLevel2Enabled === 'true' && (
                    <div>
                      <Label htmlFor="referralLevel2Reward">2级奖励积分</Label>
                      <Input
                        id="referralLevel2Reward"
                        type="number"
                        min={0}
                        max={100}
                        value={settings.referralLevel2Reward}
                        onChange={(e) => updateSetting('referralLevel2Reward', e.target.value)}
                        placeholder="5"
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* 3级推广设置 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">3级推广（间接邀请）</Label>
                      <p className="text-sm text-muted-foreground">
                        您邀请的人的下级再邀请其他人，您获得的奖励
                      </p>
                    </div>
                    <Switch
                      checked={settings.referralLevel3Enabled === 'true'}
                      onCheckedChange={(checked) =>
                        updateSetting('referralLevel3Enabled', checked ? 'true' : 'false')
                      }
                    />
                  </div>
                  {settings.referralLevel3Enabled === 'true' && (
                    <div>
                      <Label htmlFor="referralLevel3Reward">3级奖励积分</Label>
                      <Input
                        id="referralLevel3Reward"
                        type="number"
                        min={0}
                        max={100}
                        value={settings.referralLevel3Reward}
                        onChange={(e) => updateSetting('referralLevel3Reward', e.target.value)}
                        placeholder="3"
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 推广说明 */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  推广机制说明
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><strong>1级推广：</strong>您直接邀请的好友注册，您获得奖励（所有用户）</p>
                <p><strong>2级推广：</strong>您邀请的好友再邀请其他人，您获得奖励（{settings.referralFounderOnly === 'true' ? '仅创始股东' : '所有用户'}）</p>
                <p><strong>3级推广：</strong>您邀请的好友的下级再邀请其他人，您获得奖励（{settings.referralFounderOnly === 'true' ? '仅创始股东' : '所有用户'}）</p>
                <Separator className="my-3" />
                <p className="text-purple-600">
                  💡 示例：A邀请B，B邀请C，C邀请D<br />
                  - A获得B的1级奖励<br />
                  - A获得C的2级奖励（如A是{settings.referralFounderOnly === 'true' ? '创始股东' : '推广用户'}）<br />
                  - A获得D的3级奖励（如A是{settings.referralFounderOnly === 'true' ? '创始股东' : '推广用户'}）
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* 注册验证设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  注册验证设置
                </CardTitle>
                <CardDescription>
                  配置用户注册时的验证码验证选项
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 邮箱验证码 */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <Label htmlFor="registerEmailVerify" className="text-base font-medium">邮箱验证码</Label>
                      <p className="text-sm text-muted-foreground">
                        开启后注册时需要验证邮箱
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="registerEmailVerify"
                    checked={settings.registerEmailVerify === 'true'}
                    onCheckedChange={(checked) =>
                      updateSetting('registerEmailVerify', checked ? 'true' : 'false')
                    }
                  />
                </div>

                <Separator />

                {/* 手机验证码 */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <div>
                      <Label htmlFor="registerPhoneVerify" className="text-base font-medium">手机验证码</Label>
                      <p className="text-sm text-muted-foreground">
                        开启后注册时需要验证手机号
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="registerPhoneVerify"
                    checked={settings.registerPhoneVerify === 'true'}
                    onCheckedChange={(checked) =>
                      updateSetting('registerPhoneVerify', checked ? 'true' : 'false')
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* 配置说明 */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  配置说明
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><strong>邮箱验证码：</strong>使用 Resend 邮件服务发送验证码，需要配置 RESEND_API_KEY</p>
                <p><strong>手机验证码：</strong>需要配置短信服务商（阿里云SMS），需要 SMS_ACCESS_KEY_ID 和 SMS_ACCESS_KEY_SECRET</p>
                <Separator className="my-3" />
                <p className="text-amber-600">
                  ⚠️ 注意：验证码有效期为10分钟，发送频率限制为1分钟一次
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

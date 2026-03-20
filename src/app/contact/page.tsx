import type { Metadata } from 'next';
import { Mail, MapPin, Phone, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: '联系我们 - AI工具库',
  description: '有任何问题或建议？欢迎通过以下方式联系我们，我们将尽快回复。',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">联系我们</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            有任何问题、建议或合作意向？我们期待听到您的声音。
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card p-8 rounded-xl border text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">电子邮件</h3>
              <p className="text-sm text-muted-foreground mb-2">商务合作</p>
              <a href="mailto:business@example.com" className="text-primary hover:underline">
                business@example.com
              </a>
            </div>

            <div className="bg-card p-8 rounded-xl border text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">用户反馈</h3>
              <p className="text-sm text-muted-foreground mb-2">问题与建议</p>
              <a href="mailto:support@example.com" className="text-primary hover:underline">
                support@example.com
              </a>
            </div>

            <div className="bg-card p-8 rounded-xl border text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">客服热线</h3>
              <p className="text-sm text-muted-foreground mb-2">工作日 9:00-18:00</p>
              <span className="text-primary">400-xxx-xxxx</span>
            </div>

            <div className="bg-card p-8 rounded-xl border text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">办公地址</h3>
              <p className="text-sm text-muted-foreground">
                中国 · 北京<br />
                海淀区xxx路xxx号
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">常见问题</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-card p-6 rounded-xl border">
              <h3 className="font-semibold mb-2">如何提交新的AI工具？</h3>
              <p className="text-muted-foreground">
                您可以通过首页的"提交工具"按钮，填写工具信息进行提交。我们的编辑团队会在3个工作日内审核。
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border">
              <h3 className="font-semibold mb-2">如何申请成为工具开发者合作伙伴？</h3>
              <p className="text-muted-foreground">
                请发送邮件至 business@example.com，注明您的公司名称和合作意向，我们会尽快与您联系。
              </p>
            </div>
            <div className="bg-card p-6 rounded-xl border">
              <h3 className="font-semibold mb-2">发现网站上的信息有误怎么办？</h3>
              <p className="text-muted-foreground">
                欢迎通过 support@example.com 告知我们，我们会及时核实并更新。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-6">关注我们</h2>
          <p className="text-muted-foreground mb-8">
            关注我们的社交媒体，获取最新的AI工具资讯和使用技巧。
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#"
              className="w-12 h-12 bg-card border rounded-full flex items-center justify-center hover:border-primary transition-colors"
            >
              <span className="text-lg">微</span>
            </a>
            <a
              href="#"
              className="w-12 h-12 bg-card border rounded-full flex items-center justify-center hover:border-primary transition-colors"
            >
              <span className="text-lg">博</span>
            </a>
            <a
              href="#"
              className="w-12 h-12 bg-card border rounded-full flex items-center justify-center hover:border-primary transition-colors"
            >
              <span className="text-lg">知</span>
            </a>
            <a
              href="#"
              className="w-12 h-12 bg-card border rounded-full flex items-center justify-center hover:border-primary transition-colors"
            >
              <span className="text-lg">B</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

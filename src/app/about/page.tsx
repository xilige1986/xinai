import type { Metadata } from 'next';
import { Sparkles, Target, Users, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: '关于我们 - AI工具库',
  description: '了解AI工具库的使命、愿景和团队，我们致力于帮助用户发现和使用优质AI工具。',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">关于我们</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI工具库是您的AI工具导航专家，致力于帮助每个人找到合适的AI工具，提升工作效率。
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">我们的使命</h2>
              <p className="text-lg text-muted-foreground mb-4">
                在AI技术快速发展的今天，每天都有新的AI工具涌现。我们的使命是帮助用户在这个信息爆炸的时代，
                快速找到真正有用、可靠的AI工具。
              </p>
              <p className="text-lg text-muted-foreground">
                我们不仅提供工具目录，还提供详细的使用指南、评测和社区讨论，
                让每个用户都能充分发挥AI工具的潜力。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-xl border">
                <Sparkles className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">1000+</h3>
                <p className="text-sm text-muted-foreground">收录AI工具</p>
              </div>
              <div className="bg-card p-6 rounded-xl border">
                <Users className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">10万+</h3>
                <p className="text-sm text-muted-foreground">月活跃用户</p>
              </div>
              <div className="bg-card p-6 rounded-xl border">
                <Target className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">50+</h3>
                <p className="text-sm text-muted-foreground">应用场景</p>
              </div>
              <div className="bg-card p-6 rounded-xl border">
                <Zap className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">98%</h3>
                <p className="text-sm text-muted-foreground">用户满意度</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">我们的价值观</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl border">
              <h3 className="text-xl font-semibold mb-4">中立客观</h3>
              <p className="text-muted-foreground">
                我们独立评测每一款工具，不受商业利益影响，只为给用户最真实的推荐。
              </p>
            </div>
            <div className="bg-card p-8 rounded-xl border">
              <h3 className="text-xl font-semibold mb-4">用户至上</h3>
              <p className="text-muted-foreground">
                以用户需求为核心，持续优化产品体验，让找AI工具变得简单高效。
              </p>
            </div>
            <div className="bg-card p-8 rounded-xl border">
              <h3 className="text-xl font-semibold mb-4">持续创新</h3>
              <p className="text-muted-foreground">
                紧跟AI技术前沿，第一时间收录新工具，为用户带来最新最全的选择。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">加入我们</h2>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-lg text-muted-foreground mb-6">
              我们是一支充满激情的团队，致力于让AI技术普惠每个人。
              如果你也对AI充满热情，欢迎加入我们！
            </p>
            <a
              href="mailto:contact@example.com"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              联系我们
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

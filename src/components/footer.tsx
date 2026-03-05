import Link from 'next/link';
import { Bot, Mail, Github, Twitter } from 'lucide-react';

const footerLinks = {
  产品: [
    { label: 'AI工具', href: '/tools' },
    { label: '职能分类', href: '/functions' },
    { label: '精品课程', href: '/courses' },
    { label: '提交工具', href: '/submit' },
  ],
  分类: [
    { label: 'AI绘画', href: '/tools/ai-painting' },
    { label: 'AI写作', href: '/tools/ai-writing' },
    { label: '代码辅助', href: '/tools/code-assistant' },
    { label: '聊天机器人', href: '/tools/chatbot' },
  ],
  关于: [
    { label: '关于我们', href: '/about' },
    { label: '联系方式', href: '/contact' },
    { label: '隐私政策', href: '/privacy' },
    { label: '使用条款', href: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-xl gradient-primary">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                AI工具库
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              聚合全球优质AI工具，为个人和企业提供专业的AI工具导航与技能学习平台。
              助力您在AI时代保持竞争力。
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href="mailto:contact@aitools.com"
                className="p-2.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4 text-foreground">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 AI工具库. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <span className="text-red-500">♥</span> for AI enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { Bot, Mail, Github, Twitter } from 'lucide-react';
import { prisma } from '@/lib/db';
import { defaultSettings } from '@/lib/site-settings';

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    take: 8,
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

async function getSiteSettings() {
  try {
    const settings = await prisma.siteSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return { ...defaultSettings, ...settingsMap };
  } catch {
    return defaultSettings;
  }
}

const staticLinks = {
  产品: [
    { label: 'AI工具', href: '/tools' },
    { label: '使用场景', href: '/functions' },
    { label: '精品课程', href: '/courses' },
    { label: '提交工具', href: '/submit' },
  ],
  关于: [
    { label: '关于我们', href: '/about' },
    { label: '联系方式', href: '/contact' },
    { label: '隐私政策', href: '/privacy' },
    { label: '使用条款', href: '/terms' },
  ],
};

export async function Footer() {
  const categories = await getCategories();
  const settings = await getSiteSettings();

  const categoryLinks = categories.map((cat) => ({
    label: cat.name,
    href: `/tools/category/${cat.slug}`,
  }));

  const footerLinks = {
    ...staticLinks,
    分类: categoryLinks.length > 0 ? categoryLinks : staticLinks.产品,
  };

  const currentYear = new Date().getFullYear();
  const siteName = settings.siteName || defaultSettings.siteName;
  const siteLogo = settings.siteLogo || defaultSettings.siteLogo;
  const siteEmail = settings.siteEmail;
  const siteIcp = settings.siteIcp;
  const siteIcpLink = settings.siteIcpLink;
  const siteCopyright = settings.siteCopyright;
  const footerText = settings.footerText;

  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand - Left side on PC */}
          <div className="lg:col-span-5">
            <Link href="/" className="flex flex-col gap-3 mb-5">
              {siteLogo && siteLogo !== '/logo.svg' ? (
                <div className="w-[164px] h-[36px] overflow-hidden flex items-center justify-center">
                  <Image
                    src={siteLogo}
                    alt={siteName}
                    width={164}
                    height={36}
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl gradient-primary">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                    {siteName}
                  </span>
                </div>
              )}
              {/* 站点名称另起一行 */}
              <span className="text-lg font-semibold text-foreground">
                {siteName}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              {settings.siteDescription || defaultSettings.siteDescription}
            </p>
            <div className="flex gap-3 mt-6">
              {siteEmail && (
                <a
                  href={`mailto:${siteEmail}`}
                  className="p-2.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  title={siteEmail}
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="p-2.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="p-2.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links - Right side on PC, horizontal layout */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-3 gap-6 lg:gap-8 lg:justify-end">
              {Object.entries(footerLinks).map(([category, links]) => (
                <div key={category}>
                  <h3 className="font-semibold mb-3 lg:mb-4 text-foreground text-sm lg:text-base">{category}</h3>
                  <ul className="space-y-2 lg:space-y-3">
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
          </div>
        </div>

        <div className="border-t border-border/50 mt-10 lg:mt-12 pt-6 lg:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 text-sm text-muted-foreground">
            {siteCopyright ? (
              <span>{siteCopyright}</span>
            ) : (
              <span>© {currentYear} {siteName}. All rights reserved.</span>
            )}
            {siteIcp && (
              <>
                <span className="hidden md:inline">·</span>
                {siteIcpLink ? (
                  <a
                    href={siteIcpLink}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="hover:text-primary transition-colors"
                  >
                    {siteIcp}
                  </a>
                ) : (
                  <span>{siteIcp}</span>
                )}
              </>
            )}
          </div>
          {footerText ? (
            <p className="text-sm text-muted-foreground">
              {footerText}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Made with <span className="text-red-500">♥</span> for AI enthusiasts
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}

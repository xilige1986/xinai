import Link from 'next/link';
import Image from 'next/image';
import { NavbarClient } from './navbar-client';
import { prisma } from '@/lib/db';
import { defaultSettings } from '@/lib/site-settings';

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

const navItems = [
  { label: '首页', href: '/' },
  { label: 'AI工具', href: '/tools' },
  { label: '使用场景', href: '/functions' },
  { label: 'AI资讯', href: '/news' },
  { label: '课程', href: '/courses' },
  { label: '提交工具', href: '/submit' },
];

export async function Navbar() {
  const settings = await getSiteSettings();
  const siteName = settings.siteName || defaultSettings.siteName;
  const siteLogo = settings.siteLogo || defaultSettings.siteLogo;

  // Logo 组件
  const Logo = () => (
    <Link href="/" className="flex items-center">
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
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72v.78a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5.72c-.6-.34-1-.98-1-1.72a2 2 0 0 1 2-2h4z"/>
              <path d="M9 22V12h6v10"/>
              <path d="M7 12h10"/>
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            {siteName}
          </span>
        </div>
      )}
    </Link>
  );

  return <NavbarClient navItems={navItems} logo={<Logo />} />;
}

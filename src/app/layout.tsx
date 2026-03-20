import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Providers } from "./providers";
import { getSiteSettings, defaultSettings } from "@/lib/site-settings";
import { initNewsCrawlScheduler } from "@/lib/news-crawl-scheduler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 动态生成 metadata
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.siteName || defaultSettings.siteName;
  const siteDescription = settings.siteDescription || defaultSettings.siteDescription;
  const siteKeywords = settings.siteKeywords || defaultSettings.siteKeywords;
  const siteDomain = settings.siteDomain || defaultSettings.siteDomain;
  const siteFavicon = settings.siteFavicon || defaultSettings.siteFavicon;

  return {
    metadataBase: new URL('https://www.okrvv.cn'), // 搬到这里来
    title: {
      default: `${siteName} - ${siteDescription}`,
      template: `%s - ${siteName}`,
    },
    description: siteDescription,
    keywords: siteKeywords,
    authors: [{ name: siteName }],
    icons: {
      icon: siteFavicon,
      shortcut: siteFavicon,
    },
    openGraph: {
      title: `${siteName} - ${siteDescription}`,
      description: siteDescription,
      type: "website",
      locale: "zh_CN",
      siteName: siteName,
      url: `https://${siteDomain}`,
    },
  };
}

// 初始化新闻抓取服务（只执行一次）
initNewsCrawlScheduler();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

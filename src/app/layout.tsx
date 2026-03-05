import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI工具库 - 发现最实用的AI工具与课程",
  description: "聚合全球优质AI工具，提供AI绘画、AI写作、代码辅助等分类导航。配套专业AI技能课程，助力个人与企业AI转型。",
  keywords: "AI工具,人工智能,AI绘画,AI写作,ChatGPT,AI课程,AI导航",
  authors: [{ name: "AI工具库" }],
  openGraph: {
    title: "AI工具库 - 发现最实用的AI工具与课程",
    description: "聚合全球优质AI工具，提供AI绘画、AI写作、代码辅助等分类导航",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

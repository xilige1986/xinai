import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';

  // 获取所有已发布的资讯
  const news = await prisma.news.findMany({
    where: { status: 1 },
    select: { slug: true, updatedAt: true },
  });

  // 获取所有已发布的工具
  const tools = await prisma.tool.findMany({
    where: { status: 1 },
    select: { slug: true, updatedAt: true },
  });

  // 获取所有分类
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });

  // 构建 sitemap XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 首页 -->
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- 工具列表页 -->
  <url>
    <loc>${baseUrl}/tools</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- 资讯列表页 -->
  <url>
    <loc>${baseUrl}/news</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- 分类页面 -->
  ${categories.map((cat) => `
  <url>
    <loc>${baseUrl}/tools/category/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  `).join('')}

  <!-- 工具详情页 -->
  ${tools.map((tool) => `
  <url>
    <loc>${baseUrl}/tool/${tool.slug}</loc>
    <lastmod>${tool.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  `).join('')}

  <!-- 资讯详情页 -->
  ${news.map((item) => `
  <url>
    <loc>${baseUrl}/news/${item.slug}.html</loc>
    <lastmod>${item.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  `).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

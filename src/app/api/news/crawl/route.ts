import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Parser from 'rss-parser';

const rssParser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml, */*',
  },
  requestOptions: {
    rejectUnauthorized: false,
  },
});

// 抓取单个RSS源
async function fetchRSS(source: any) {
  try {
    if (!source.rssUrl) {
      throw new Error('RSS URL is empty');
    }

    console.log('Fetching RSS:', source.rssUrl);

    const feed = await rssParser.parseURL(source.rssUrl);
    console.log('RSS Feed fetched:', feed.title, 'Items:', feed.items?.length || 0);

    let fetchedCount = 0;
    const newsItems = [];

    if (!feed.items || feed.items.length === 0) {
      throw new Error('RSS feed 没有条目');
    }

    for (const item of feed.items.slice(0, 20)) {
      // 获取字段映射
      const mapping = source.fieldMapping || {};
      const title = item[mapping.title || 'title'] || item.title;
      const link = item[mapping.link || 'link'] || item.link;
      const pubDate = item[mapping.pubDate || 'pubDate'] || item.pubDate;
      const description = item[mapping.description || 'content'] || item.content || item.description || '';

      if (!title || !link) continue;

      // 检查是否已存在
      const existing = await prisma.news.findFirst({
        where: {
          sourceUrl: link,
        },
      });

      if (!existing) {
        // 生成slug
        const slug = title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 100);

        // 创建新闻
        const news = await prisma.news.create({
          data: {
            title: title.substring(0, 200),
            slug: `${slug}-${Date.now().toString(36)}`,
            summary: description.substring(0, 500),
            content: null, // 聚合新闻不存正文
            category: source.category,
            author: item.creator || item.author || source.name,
            source: source.name,
            sourceUrl: link,
            isAggregated: true, // 标记为聚合新闻
            status: 1, // 直接发布
            publishedAt: pubDate ? new Date(pubDate) : new Date(),
          },
        });

        newsItems.push(news);
        fetchedCount++;
      }
    }

    console.log(`RSS fetch completed. Fetched ${fetchedCount} articles`);

    // 更新源信息
    await prisma.newsSource.update({
      where: { id: source.id },
      data: {
        lastFetchedAt: new Date(),
      },
    });

    // 记录日志
    await prisma.newsCrawlLog.create({
      data: {
        sourceId: source.id,
        sourceType: 'rss',
        status: 'success',
        message: `成功抓取 ${fetchedCount} 条新闻`,
        fetchedCount,
      },
    });

    return {
      success: true,
      count: fetchedCount,
      items: newsItems,
    };
  } catch (error: any) {
    console.error('RSS fetch error:', error);

    // 记录错误日志
    try {
      await prisma.newsCrawlLog.create({
        data: {
          sourceId: source.id,
          sourceType: 'rss',
          status: 'error',
          message: '抓取失败',
          errorMessage: error.message || String(error),
          fetchedCount: 0,
        },
      });
    } catch (logError) {
      console.error('Failed to create error log:', logError);
    }

    throw error;
  }
}

// 抓取API源
async function fetchAPI(source: any) {
  try {
    if (!source.apiUrl) {
      throw new Error('API URL is empty');
    }

    // 构建请求参数
    const params = new URLSearchParams();

    // NewsAPI 特定处理
    const isNewsAPI = source.apiUrl.includes('newsapi.org');

    if (isNewsAPI) {
      // NewsAPI 必需参数
      const apiParams = source.apiParams || {};

      // 如果没有查询参数，使用默认查询
      if (!apiParams.q && !apiParams.query) {
        params.append('q', 'artificial intelligence OR AI OR technology');
      }

      // 设置默认语言
      if (!apiParams.language) {
        params.append('language', 'en');
      }

      // 设置默认排序
      if (!apiParams.sortBy) {
        params.append('sortBy', 'publishedAt');
      }

      // 设置默认页大小
      if (!apiParams.pageSize) {
        params.append('pageSize', '20');
      }

      // 设置默认时间范围（最近7天，免费版只能获取最近一个月）
      if (!apiParams.from) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 7);
        params.append('from', fromDate.toISOString().split('T')[0]);
      }

      // 添加用户提供的其他参数
      if (source.apiParams) {
        Object.entries(source.apiParams as object).forEach(([key, value]) => {
          if (key !== 'apiKey' && key !== 'api_key') { // 避免重复添加 apiKey
            params.append(key, String(value));
          }
        });
      }

      // NewsAPI 必需使用 apiKey 作为参数名（区分大小写）
      if (source.apiKey) {
        params.append('apiKey', source.apiKey);
      }
    } else {
      // 通用 API 处理
      if (source.apiParams) {
        Object.entries(source.apiParams as object).forEach(([key, value]) => {
          params.append(key, String(value));
        });
      }

      if (source.apiKey) {
        params.append('apiKey', source.apiKey);
      }
    }

    const url = `${source.apiUrl}?${params.toString()}`;
    console.log('Fetching API URL:', url.replace(source.apiKey || '', '***'));

    const headers: any = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
      timeout: 15000,
    } as any);

    const responseText = await response.text();

    if (!response.ok) {
      console.error('API Error Response:', responseText);
      throw new Error(`API响应错误: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON:', responseText.substring(0, 500));
      throw new Error('API返回的不是有效的JSON');
    }

    console.log('API Response status:', data.status);
    console.log('API Response totalResults:', data.totalResults);

    // NewsAPI 返回 code 和 message 表示错误
    if (data.status === 'error' || data.code) {
      throw new Error(`NewsAPI错误: ${data.code} - ${data.message}`);
    }

    // 根据API类型解析数据
    let articles: any[] = [];
    if (data.articles) {
      articles = data.articles;
    } else if (data.data) {
      articles = data.data;
    } else if (data.results) {
      articles = data.results;
    } else if (data.items) {
      articles = data.items;
    } else if (Array.isArray(data)) {
      articles = data;
    }

    console.log('Parsed articles:', articles.length);

    if (articles.length === 0) {
      console.warn('No articles found in API response');
    } else {
      // 打印第一条数据的结构，帮助调试
      console.log('First article sample:', JSON.stringify(articles[0], null, 2).substring(0, 500));
    }

    let fetchedCount = 0;

    for (const article of articles.slice(0, 20)) {
      const mapping = source.fieldMapping || {};
      const title = article[mapping.title || 'title'];
      const link = article[mapping.url || 'url'] || article[mapping.link || 'link'];
      const description = article[mapping.description || 'description'] || article.summary || article.content || article.snippet || '';
      const pubDate = article[mapping.publishedAt || 'publishedAt'] || article.publishedAt || article.pubDate || article.date || article.timestamp;

      if (!title || !link) {
        console.log('Skipping article without title or link:', article);
        continue;
      }

      // 检查是否已存在
      const existing = await prisma.news.findFirst({
        where: {
          sourceUrl: link,
        },
      });

      if (existing) {
        console.log('Article already exists:', title);
        continue;
      }

      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);

      console.log('Creating news:', title.substring(0, 50));

      await prisma.news.create({
        data: {
          title: title.substring(0, 200),
          slug: `${slug}-${Date.now().toString(36)}`,
          summary: description.substring(0, 500),
          content: null, // 聚合新闻不存正文
          category: source.category,
          author: article.author || source.name,
          source: source.name,
          sourceUrl: link,
          isAggregated: true, // 标记为聚合新闻
          status: 1,
          publishedAt: pubDate ? new Date(pubDate) : new Date(),
        },
      });

      fetchedCount++;
    }

    console.log(`API fetch completed. Fetched ${fetchedCount} articles`);

    // 更新源信息
    await prisma.newsSource.update({
      where: { id: source.id },
      data: {
        lastFetchedAt: new Date(),
      },
    });

    // 记录日志
    await prisma.newsCrawlLog.create({
      data: {
        sourceId: source.id,
        sourceType: 'api',
        status: 'success',
        message: `成功抓取 ${fetchedCount} 条新闻`,
        fetchedCount,
      },
    });

    return {
      success: true,
      count: fetchedCount,
    };
  } catch (error: any) {
    console.error('API fetch error:', error);

    // 记录错误日志
    try {
      await prisma.newsCrawlLog.create({
        data: {
          sourceId: source.id,
          sourceType: 'api',
          status: 'error',
          message: '抓取失败',
          errorMessage: error.message || String(error),
          fetchedCount: 0,
        },
      });
    } catch (logError) {
      console.error('Failed to create error log:', logError);
    }

    throw error;
  }
}

// 抓取所有源
export async function GET(request: NextRequest) {
  try {
    // 获取需要抓取的源（超过 fetchInterval 时间未抓取）
    const sources = await prisma.newsSource.findMany({
      where: {
        isActive: true,
        OR: [
          { lastFetchedAt: null },
          {
            lastFetchedAt: {
              lt: new Date(Date.now() - 60 * 60 * 1000), // 1小时前
            },
          },
        ],
      },
    });

    const results = [];

    for (const source of sources) {
      try {
        if (source.type === 'rss' && source.rssUrl) {
          const result = await fetchRSS(source);
          results.push({ sourceId: source.id, type: 'rss', ...result });
        } else if (source.type === 'api' && source.apiUrl) {
          const result = await fetchAPI(source);
          results.push({ sourceId: source.id, type: 'api', ...result });
        }
      } catch (error: any) {
        results.push({
          sourceId: source.id,
          type: source.type,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalFetched: results.reduce((sum, r) => sum + (r.count || 0), 0),
    });
  } catch (error) {
    console.error('Crawl all sources error:', error);
    return NextResponse.json(
      { error: '抓取失败' },
      { status: 500 }
    );
  }
}

// 手动触发单个源抓取
export async function POST(request: NextRequest) {
  try {
    const { sourceId } = await request.json();

    if (!sourceId) {
      return NextResponse.json(
        { error: '需要提供sourceId' },
        { status: 400 }
      );
    }

    const source = await prisma.newsSource.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return NextResponse.json(
        { error: '新闻源不存在' },
        { status: 404 }
      );
    }

    if (!source.isActive) {
      return NextResponse.json(
        { error: '新闻源已禁用' },
        { status: 400 }
      );
    }

    let result;
    if (source.type === 'rss' && source.rssUrl) {
      result = await fetchRSS(source);
    } else if (source.type === 'api' && source.apiUrl) {
      result = await fetchAPI(source);
    } else {
      return NextResponse.json(
        { error: '不支持的新闻源类型' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Crawl single source error:', error);
    return NextResponse.json(
      { error: error.message || '抓取失败' },
      { status: 500 }
    );
  }
}

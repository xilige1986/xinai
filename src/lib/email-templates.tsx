import * as React from 'react';

interface NewsletterEmailProps {
  subject: string;
  content: string;
  newsItems: Array<{
    title: string;
    summary: string;
    slug: string;
    coverImage?: string | null;
  }>;
  unsubscribeUrl: string;
}

export const NewsletterEmail: React.FC<NewsletterEmailProps> = ({
  subject,
  content,
  newsItems,
  unsubscribeUrl,
}) => {
  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        backgroundColor: '#f5f5f5',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '30px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              color: '#ffffff',
              fontSize: '24px',
              margin: '0 0 10px 0',
            }}
          >
            AI 工具库资讯
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '14px',
              margin: 0,
            }}
          >
            每周精选 AI 行业动态
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '30px' }}>
          {content && (
            <div
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#333333',
                marginBottom: '30px',
              }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          {/* News Items */}
          {newsItems.length > 0 && (
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  color: '#333333',
                  marginBottom: '20px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #667eea',
                }}
              >
                本期精选
              </h2>

              {newsItems.map((news, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '25px',
                    paddingBottom: '25px',
                    borderBottom:
                      index < newsItems.length - 1 ? '1px solid #eeeeee' : 'none',
                  }}
                >
                  {news.coverImage && (
                    <img
                      src={news.coverImage}
                      alt={news.title}
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '6px',
                        marginBottom: '12px',
                      }}
                    />
                  )}
                  <h3
                    style={{
                      fontSize: '16px',
                      color: '#333333',
                      margin: '0 0 8px 0',
                    }}
                  >
                    <a
                      href={`\${SITE_URL}/news/\${news.slug}.html`}
                      style={{
                        color: '#667eea',
                        textDecoration: 'none',
                      }}
                    >
                      {news.title}
                    </a>
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#666666',
                      lineHeight: '1.5',
                      margin: 0,
                    }}
                  >
                    {news.summary}
                  </p>
                  <a
                    href={`https://yourdomain.com/news/${news.slug}.html`}
                    style={{
                      display: 'inline-block',
                      marginTop: '10px',
                      fontSize: '13px',
                      color: '#667eea',
                      textDecoration: 'none',
                    }}
                  >
                    阅读全文 →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '20px 30px',
            textAlign: 'center',
            borderTop: '1px solid #eeeeee',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: '#999999',
              margin: '0 0 10px 0',
            }}
          >
            此邮件由 AI 工具库自动发送
          </p>
          <a
            href={unsubscribeUrl}
            style={{
              fontSize: '12px',
              color: '#999999',
              textDecoration: 'underline',
            }}
          >
            取消订阅
          </a>
        </div>
      </div>
    </div>
  );
};

// 渲染邮件为 HTML 字符串
export function renderNewsletterEmail(props: NewsletterEmailProps): string {
  const { subject, content, newsItems, unsubscribeUrl } = props;

  // 网站域名（从环境变量读取）
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const newsItemsHtml = newsItems
    .map(
      (news, index) => `
    <div style="margin-bottom: 25px; padding-bottom: 25px; ${
      index < newsItems.length - 1 ? 'border-bottom: 1px solid #eeeeee;' : ''
    }">
      ${
        news.coverImage
          ? `<img src="${news.coverImage}" alt="${news.title}" style="width: 100%; height: auto; border-radius: 6px; margin-bottom: 12px;">`
          : ''
      }
      <h3 style="font-size: 16px; color: #333333; margin: 0 0 8px 0;">
        <a href="\${SITE_URL}/news/\${news.slug}.html" style="color: #667eea; text-decoration: none;">
          \${news.title}
        </a>
      </h3>
      <p style="font-size: 14px; color: #666666; line-height: 1.5; margin: 0;">
        ${news.summary}
      </p>
      <a href="\${SITE_URL}/news/\${news.slug}.html" style="display: inline-block; margin-top: 10px; font-size: 13px; color: #667eea; text-decoration: none;">
        阅读全文 →
      </a>
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 10px 0;">AI 工具库资讯</h1>
      <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">每周精选 AI 行业动态</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      ${content ? `<div style="font-size: 16px; line-height: 1.6; color: #333333; margin-bottom: 30px;">${content}</div>` : ''}

      ${newsItems.length > 0 ? `
        <div>
          <h2 style="font-size: 18px; color: #333333; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">本期精选</h2>
          ${newsItemsHtml}
        </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="font-size: 12px; color: #999999; margin: 0 0 10px 0;">此邮件由 AI 工具库自动发送</p>
      <a href="${unsubscribeUrl}" style="font-size: 12px; color: #999999; text-decoration: underline;">取消订阅</a>
    </div>
  </div>
</body>
</html>
  `;
}

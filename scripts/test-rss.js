const Parser = require('rss-parser');

const rssParser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml, */*',
  },
});

async function testRSS() {
  const url = 'https://sanhua.himrr.com/daily-news/feed';
  console.log('Testing RSS:', url);

  try {
    const feed = await rssParser.parseURL(url);
    console.log('Feed title:', feed.title);
    console.log('Feed items count:', feed.items?.length || 0);

    if (feed.items && feed.items.length > 0) {
      console.log('First item:', {
        title: feed.items[0].title,
        link: feed.items[0].link,
        pubDate: feed.items[0].pubDate,
        content: feed.items[0].content?.substring(0, 200),
      });
    }
  } catch (error) {
    console.error('RSS Error:', error.message);
  }
}

testRSS();

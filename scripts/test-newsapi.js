// 测试 NewsAPI 连接
async function testNewsAPI() {
  const apiKey = 'ae5b4062a4a741be9146150e751505ba';
  const url = `https://newsapi.org/v2/everything?q=artificial+intelligence&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;

  console.log('Testing NewsAPI...');
  console.log('URL:', url.replace(apiKey, '***'));

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const text = await response.text();
    console.log('Response body:', text.substring(0, 1000));

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('Parsed data:', {
        status: data.status,
        totalResults: data.totalResults,
        articlesCount: data.articles?.length || 0,
      });

      if (data.articles && data.articles.length > 0) {
        console.log('First article:', JSON.stringify(data.articles[0], null, 2));
      }
    } else {
      console.error('API Error:', text);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testNewsAPI();

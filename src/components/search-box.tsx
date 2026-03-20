'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Bot, Globe, MessageCircle, Image as ImageIcon, Sparkles, Lightbulb } from 'lucide-react';

interface SearchEngine {
  id: string;
  name: string;
  icon: React.ReactNode;
  searchUrl: string; // 支持搜索查询的URL，{query} 会被替换为搜索词
  directOpen?: boolean; // 是否只能直接打开（不支持URL传参搜索）
  directOpenUrl?: string; // 直接打开时的URL（如果有输入关键词，则用searchUrl）
}

interface SearchCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  engines: SearchEngine[];
}

const searchCategories: SearchCategory[] = [
  {
    id: 'common',
    name: '常用',
    icon: <Lightbulb className="h-4 w-4" />,
    engines: [
      {
        id: 'internal',
        name: '站内',
        icon: <Bot className="h-4 w-4" />,
        searchUrl: '/tools?search={query}',
      },
      {
        id: 'baidu',
        name: '百度',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://www.baidu.com/s?wd={query}',
      },
      {
        id: 'bing',
        name: 'Bing',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://www.bing.com/search?q={query}',
      },
      {
        id: 'google',
        name: 'Google',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://www.google.com/search?q={query}',
      },
      {
        id: 'perplexity',
        name: 'Perplexity',
        icon: <Sparkles className="h-4 w-4" />,
        searchUrl: 'https://www.perplexity.ai/search?q={query}',
      },
    ],
  },
  {
    id: 'ai',
    name: 'AI',
    icon: <Sparkles className="h-4 w-4" />,
    engines: [
      {
        id: 'deepseek',
        name: 'DeepSeek',
        icon: <Sparkles className="h-4 w-4" />,
        // DeepSeek 支持通过 URL 参数预填充问题
        searchUrl: 'https://chat.deepseek.com/?q={query}',
        // 如果没有输入关键词，就打开首页
        directOpenUrl: 'https://chat.deepseek.com/',
      },
      {
        id: 'doubao',
        name: '豆包',
        icon: <MessageCircle className="h-4 w-4" />,
        // 豆包暂不支持 URL 参数搜索，只能打开首页
        searchUrl: 'https://www.doubao.com/chat/',
        directOpen: true,
      },
      {
        id: 'qianwen',
        name: '通义千问',
        icon: <Globe className="h-4 w-4" />,
        // 通义支持 URL 参数
        searchUrl: 'https://tongyi.aliyun.com/qianwen/?chatConfig={"inputSearch":true,"searchQuery":"{query}"}',
        directOpenUrl: 'https://tongyi.aliyun.com/qianwen/',
      },
      {
        id: 'chatgpt',
        name: 'ChatGPT',
        icon: <Sparkles className="h-4 w-4" />,
        // ChatGPT 支持 prompt 参数
        searchUrl: 'https://chat.openai.com/?q={query}',
        directOpenUrl: 'https://chat.openai.com/',
      },
      {
        id: 'gemini',
        name: 'Gemini',
        icon: <Sparkles className="h-4 w-4" />,
        // Gemini 支持 text 参数
        searchUrl: 'https://gemini.google.com/?text={query}',
        directOpenUrl: 'https://gemini.google.com/',
      },
      {
        id: 'claude',
        name: 'Claude',
        icon: <Sparkles className="h-4 w-4" />,
        // Claude 支持 prompt 参数
        searchUrl: 'https://claude.ai/new?q={query}',
        directOpenUrl: 'https://claude.ai/new',
      },
    ],
  },
  {
    id: 'community',
    name: '社区',
    icon: <MessageCircle className="h-4 w-4" />,
    engines: [
      {
        id: 'github',
        name: 'GitHub',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://github.com/search?q={query}',
      },
      {
        id: 'zhihu',
        name: '知乎',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://www.zhihu.com/search?type=content&q={query}',
      },
      {
        id: 'huggingface',
        name: 'Hugging Face',
        icon: <Sparkles className="h-4 w-4" />,
        searchUrl: 'https://huggingface.co/search/full-text?q={query}',
      },
      {
        id: 'reddit',
        name: 'Reddit',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://www.reddit.com/search/?q={query}',
      },
      {
        id: 'douban',
        name: '豆瓣',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://www.douban.com/search?q={query}',
      },
    ],
  },
  {
    id: 'images',
    name: '图片',
    icon: <ImageIcon className="h-4 w-4" />,
    engines: [
      {
        id: 'bing-images',
        name: 'Bing图片',
        icon: <ImageIcon className="h-4 w-4" />,
        searchUrl: 'https://www.bing.com/images/search?q={query}',
      },
      {
        id: 'google-images',
        name: 'Google图片',
        icon: <ImageIcon className="h-4 w-4" />,
        searchUrl: 'https://www.google.com/search?tbm=isch&q={query}',
      },
      {
        id: 'baidu-images',
        name: '百度图片',
        icon: <ImageIcon className="h-4 w-4" />,
        searchUrl: 'https://image.baidu.com/search/index?tn=baiduimage&word={query}',
      },
      {
        id: 'unsplash',
        name: 'Unsplash',
        icon: <ImageIcon className="h-4 w-4" />,
        searchUrl: 'https://unsplash.com/s/photos/{query}',
      },
      {
        id: 'yige',
        name: '文心一格',
        icon: <ImageIcon className="h-4 w-4" />,
        searchUrl: 'https://yige.baidu.com/',
        directOpen: true,
      },
    ],
  },
  {
    id: 'life',
    name: '生活',
    icon: <Sparkles className="h-4 w-4" />,
    engines: [
      {
        id: 'taobao',
        name: '淘宝',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://s.taobao.com/search?q={query}',
      },
      {
        id: 'jd',
        name: '京东',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://search.jd.com/Search?keyword={query}',
      },
      {
        id: 'xiachufang',
        name: '下厨房',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://www.xiachufang.com/search/?keyword={query}',
      },
      {
        id: 'bilibili',
        name: 'B站',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://search.bilibili.com/all?keyword={query}',
      },
      {
        id: '12306',
        name: '12306',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://www.12306.cn/',
        directOpen: true,
      },
      {
        id: 'kuaidi100',
        name: '快递100',
        icon: <Globe className="h-4 w-4" />,
        searchUrl: 'https://www.kuaidi100.com/',
        directOpen: true,
      },
    ],
  },
];

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('common');
  const [activeEngine, setActiveEngine] = useState('internal');

  const currentCategory = searchCategories.find((c) => c.id === activeCategory) || searchCategories[0];
  const currentEngine = currentCategory.engines.find((e) => e.id === activeEngine) || currentCategory.engines[0];

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const category = searchCategories.find((c) => c.id === categoryId);
    if (category) {
      setActiveEngine(category.engines[0].id);
    }
  };

  const handleEngineChange = (engineId: string) => {
    setActiveEngine(engineId);
  };

  const performSearch = () => {
    if (!currentEngine) return;

    // 只能直接打开的网站（如豆包、文心一格、12306等）
    if (currentEngine.directOpen) {
      window.open(currentEngine.searchUrl, '_blank');
      return;
    }

    // 有搜索功能的AI模型
    if (activeCategory === 'ai') {
      if (query.trim()) {
        // 输入了关键词，尝试用URL参数打开并预填充
        const searchUrl = currentEngine.searchUrl.replace('{query}', encodeURIComponent(query.trim()));
        window.open(searchUrl, '_blank');
      } else {
        // 没有输入关键词，打开首页
        const url = currentEngine.directOpenUrl || currentEngine.searchUrl;
        window.open(url, '_blank');
      }
      return;
    }

    // 其他需要关键词的搜索
    if (!query.trim()) return;

    const searchUrl = currentEngine.searchUrl.replace('{query}', encodeURIComponent(query.trim()));

    // 站内搜索
    if (currentEngine.id === 'internal') {
      router.push(searchUrl);
    } else {
      // 外部搜索
      window.open(searchUrl, '_blank');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  // 获取当前placeholder
  const getPlaceholder = () => {
    if (activeCategory === 'ai') {
      if (currentEngine.directOpen) {
        return `点击搜索打开 ${currentEngine.name}`;
      }
      return `输入问题问 ${currentEngine.name}，或直接点击搜索打开`;
    }
    if (currentEngine.directOpen) {
      return `点击搜索打开 ${currentEngine.name}`;
    }
    return `在 ${currentEngine.name} 中搜索...`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* 分类标签 */}
      <div className="flex items-center justify-center gap-1 mb-3 flex-wrap">
        {searchCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
              activeCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* 搜索框 */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder={getPlaceholder()}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-32 h-14 rounded-full border-input bg-card shadow-lg text-base focus-visible:ring-primary/50"
          />
          <Button
            type="submit"
            size="lg"
            className="absolute right-2 h-10 px-6 rounded-full gradient-primary hover:opacity-90 transition-opacity"
          >
            <Search className="h-4 w-4 mr-1" />
            {currentEngine.directOpen ? '打开' : activeCategory === 'ai' ? '提问' : '搜索'}
          </Button>
        </div>
      </form>

      {/* 搜索引擎选择 */}
      <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
        {currentCategory.engines.map((engine) => (
          <button
            key={engine.id}
            onClick={() => handleEngineChange(engine.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${
              activeEngine === engine.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {engine.name}
          </button>
        ))}
      </div>
    </div>
  );
}

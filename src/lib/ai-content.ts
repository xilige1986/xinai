import { prisma } from './db';
import { spawn } from 'child_process';

export interface ToolForAI {
  id: number;
  name: string;
  shortDesc: string;
  description: string;
  websiteUrl: string;
  pricingType: string;
  category?: { name: string } | null;
  subCategory?: { name: string } | null;
  useCase?: { name: string } | null;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * 使用 curl 命令发送请求到 DeepSeek API（带重试）
 */
async function makeRequestWithRetry(payload: object, apiKey: string, maxRetries = 3): Promise<DeepSeekResponse> {
  const body = JSON.stringify(payload);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AI Generate] Request attempt ${attempt}/${maxRetries}`);

      const result = await new Promise<string>((resolve, reject) => {
        const curlPath = process.platform === 'win32' ? 'C:\\Windows\\System32\\curl.exe' : 'curl';
        const curl = spawn(curlPath, [
          '-s',
          '-X', 'POST',
          'https://api.deepseek.com/v1/chat/completions',
          '-H', `Authorization: Bearer ${apiKey}`,
          '-H', 'Content-Type: application/json',
          '-d', body,
          '--max-time', '30',
        ], {
          timeout: 35000,
        });

        let stdout = '';
        let stderr = '';

        curl.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        curl.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        curl.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`curl failed with code ${code}: ${stderr || 'Unknown error'}`));
          } else {
            resolve(stdout);
          }
        });

        curl.on('error', (error) => {
          reject(error);
        });
      });

      if (!result) {
        throw new Error('Empty response from curl');
      }

      return JSON.parse(result);
    } catch (error) {
      console.log(`[AI Generate] Request failed (attempt ${attempt}/${maxRetries}):`, error instanceof Error ? error.message : error);

      if (attempt === maxRetries) {
        throw error;
      }

      // 等待 1 秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('所有重试都失败了');
}

/**
 * 使用 DeepSeek 生成工具介绍内容
 */
export async function generateToolAIContent(tool: ToolForAI): Promise<{
  content: string;
  summary: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
}> {
  console.log('[AI Generate] generateToolAIContent called for:', tool.name);

  const apiKey = process.env.DEEPSEEK_API_KEY;
  console.log('[AI Generate] API Key exists:', !!apiKey);

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const prompt = `为AI工具"${tool.name}"生成介绍，控制在500-800字。

基本信息：
- 一句话描述：${tool.shortDesc}
- 分类：${tool.category?.name || 'AI工具'}${tool.subCategory ? `/${tool.subCategory.name}` : ''}
- 场景：${tool.useCase?.name || '通用'}
- 定价：${getPricingLabel(tool.pricingType)}

按以下5个部分输出（用##标题）：

## 工具是什么
简要介绍这个工具是什么，解决什么问题（100字左右）

## 应用场景
列举3-5个典型使用场景

## 主要功能
用bullet list列出4-6个核心功能

## 收费方式
说明免费额度、付费方案、价格区间

## 常见问题
列举2-3个新手常见问题及简要解答

要求：语言简洁直白，避免空话废话，直接输出内容。`;

  console.log('[AI Generate] Sending request to DeepSeek API...');

  try {
    const data = await makeRequestWithRetry({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个简洁高效的AI工具介绍撰写助手，擅长用简单直白的语言快速介绍产品。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1200,
    }, apiKey, 3);

    console.log('[AI Generate] DeepSeek API response received');

    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      throw new Error('DeepSeek API 返回空内容');
    }

    console.log('[AI Generate] Content received, length:', content.length);

    // 提取摘要（前150字）
    const summary = extractSummary(content, 150);

    // 计算成本
    const promptTokens = data.usage?.prompt_tokens || estimateTokens(prompt);
    const completionTokens = data.usage?.completion_tokens || estimateTokens(content);
    const cost = (promptTokens + completionTokens) * 0.000001;

    return {
      content,
      summary,
      promptTokens,
      completionTokens,
      cost,
    };
  } catch (error) {
    console.error('[AI Generate] Error in generateToolAIContent:', error);
    if (error instanceof Error) {
      if (error.message.includes('ECONNRESET') || error.message.includes('closed') || error.message.includes('curl')) {
        throw new Error('网络连接失败，请检查网络或稍后重试');
      }
      throw error;
    }
    throw new Error('生成内容时发生未知错误');
  }
}

/**
 * 为工具生成或更新AI内容
 */
export async function generateAndSaveAIContent(
  toolId: number,
  generatedBy: 'system' | 'manual' = 'system'
): Promise<{ success: boolean; message: string }> {
  console.log('[AI Generate] generateAndSaveAIContent called, toolId:', toolId);

  // 获取工具信息
  console.log('[AI Generate] Fetching tool details...');
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    include: {
      category: true,
      subCategory: true,
      useCase: true,
    },
  });

  if (!tool) {
    console.log('[AI Generate] Tool not found in database');
    return { success: false, message: '工具不存在' };
  }

  console.log('[AI Generate] Tool found:', tool.name);
  console.log('[AI Generate] Calling generateToolAIContent...');

  try {
    // 调用AI生成内容
    const result = await generateToolAIContent(tool);
    console.log('[AI Generate] Content generated successfully');

    // 保存到数据库
    console.log('[AI Generate] Saving to database...');
    await prisma.toolAIContent.upsert({
      where: { toolId },
      update: {
        content: result.content,
        summary: result.summary,
        modelName: 'deepseek-chat',
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        cost: result.cost,
        version: { increment: 1 },
        generatedBy,
      },
      create: {
        toolId,
        content: result.content,
        summary: result.summary,
        modelName: 'deepseek-chat',
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        cost: result.cost,
        generatedBy,
      },
    });

    console.log('[AI Generate] Saved to database successfully');
    return {
      success: true,
      message: `AI内容生成成功，消耗 ${result.promptTokens + result.completionTokens} tokens，成本约 ¥${result.cost.toFixed(4)}`,
    };
  } catch (error) {
    console.error('[AI Generate] Error in generateAndSaveAIContent:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成失败',
    };
  }
}

/**
 * 获取工具的AI内容
 */
export async function getToolAIContent(toolId: number) {
  return await prisma.toolAIContent.findUnique({
    where: { toolId },
  });
}

// 辅助函数
function getPricingLabel(pricingType: string): string {
  const map: Record<string, string> = {
    Free: '免费',
    Paid: '付费',
    Freemium: '免费增值',
    'Free-Trial': '免费试用',
  };
  return map[pricingType] || pricingType;
}

function extractSummary(content: string, maxLength: number = 150): string {
  // 移除 markdown 标记，提取纯文本
  const plainText = content
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\n/g, ' ')
    .trim();

  return plainText.slice(0, maxLength) + (plainText.length > maxLength ? '...' : '');
}

function estimateTokens(text: string): number {
  // 粗略估算：中文字符约1.5 tokens，英文单词约1 token
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = text.split(/\s+/).length;
  return Math.ceil(chineseChars * 1.5 + englishWords);
}

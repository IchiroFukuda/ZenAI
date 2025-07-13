import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

// ログ配列から要約・分析・タグ・提案を生成
export async function generateAIOutputsFromLogs(logs: string[]) {
  const joined = logs.map((c, i) => `【${i + 1}】${c}`).join('\n');
  const prompts = [
    { type: 'summary', prompt: `以下はあるテーマに関する発言の履歴です。全体を簡潔に要約してください。\n${joined}` },
    { type: 'analysis', prompt: `以下はあるテーマに関する発言の履歴です。内容を分析し、重要なポイントや特徴を述べてください。\n${joined}` },
    { type: 'tags', prompt: `以下はあるテーマに関する発言の履歴です。内容に関連するキーワードやタグを3つ程度、カンマ区切りで抽出してください。\n${joined}` },
    { type: 'suggestion', prompt: `以下はあるテーマに関する発言の履歴です。次に取るべきアクションや提案を1つ述べてください。\n${joined}` },
  ];
  const results = await Promise.all(
    prompts.map(async ({ type, prompt }) => {
      const res = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 256,
      });
      return {
        type,
        content: res.choices[0]?.message?.content?.trim() || '',
      };
    })
  );
  return results;
} 

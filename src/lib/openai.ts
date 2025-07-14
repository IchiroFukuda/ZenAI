import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

// ログ配列から要約・分析・タグ・提案を生成
export async function generateAIOutputsFromLogs(logs: string[]) {
  const joined = logs.map((c, i) => `【${i + 1}】${c}`).join('\n');
  const prompts = [
    {
      type: 'summary',
      prompt: `以下はある者の心の声の記録です。  
  その流れを静かに読み解き、  
  内に秘められた本質的なテーマや問いを、  
  要約してください。  
  
  ${joined}`,
    },
    {
      type: 'analysis',
      prompt: `以下はある者の言葉の記録です。  
  その奥に流れる感情や思考の特徴を、  
  静かに観察し、冷静に分析をしてください。
  語尾はである調でお願いします。
  
  ${joined}`,
    },
    {
      type: 'tags',
      prompt: `以下はある者の心の動きの記録です。  
  それを静かに眺め、  
  繰り返し現れる言葉や、根底にある想いを、  
  禅語や抽象的なキーワードとして  
  3つまで抽出してください。カンマ区切りで。  
  
  ${joined}`,
    },
    {
      type: 'suggestion',
      prompt: `以下はある者の心の流れです。  
  これを静かに読み、もし言葉を残すとしたら、  
  どのような問いや示唆を与えるでしょうか。  
  禅僧が弟子に残すように、語尾をである調にして述べてください。
  
  ${joined}`,
    },
  ];
  
  const results = await Promise.all(
    prompts.map(async ({ type, prompt }) => {
      const res = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      });
      return {
        type,
        content: res.choices[0]?.message?.content?.trim() || '',
      };
    })
  );
  return results;
} 

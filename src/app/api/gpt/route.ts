import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { supabase } from "@/lib/supabaseClient";
import { generateAIOutputsFromLogs } from "@/lib/openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { message, thoughtId, userId } = await req.json();
    
    // 過去の思考履歴を取得
    let thoughtHistory = "";
    if (userId && thoughtId) {
      try {
        const { data: logs, error } = await supabase
          .from("logs")
          .select("message, gpt_thought")
          .eq("thought_id", thoughtId)
          .order("created_at", { ascending: true });
        
        if (error) {
          console.error("🔍 API: 思考履歴取得エラー", error);
        } else {
          if (logs && logs.length > 0) {
            thoughtHistory = "これまでの思考履歴:\n";
            logs.forEach((log, index) => {
              thoughtHistory += `${index + 1}. ユーザー: ${log.message}\n`;
              if (log.gpt_thought) {
                thoughtHistory += `   zenAIの裏思考: ${log.gpt_thought}\n`;
              }
            });
            thoughtHistory += "\n";
          }
        }
      } catch (error) {
        console.error("🔍 API: 思考履歴取得で例外発生", error);
      }
    }

    // GPT-4oがコメントアウトされているため、デフォルト値を設定
    const gptThought = "...";
    const summary = "";
    const tags = "";

    // AIアウトプット（要約・タグ・分析・提案）の生成・保存
    let aiOutputs: Array<{ type: string; content: string }> = [];
    if (userId && thoughtId) {
      try {
        // 支払い方法追加後に true に変更
        const ENABLE_AI_OUTPUTS = true;
        
        if (ENABLE_AI_OUTPUTS) {
          // thought_idに紐づく全ログを取得（最新20件に制限）
          const { data: allLogs, error: logsError } = await supabase
            .from("logs")
            .select("message")
            .eq("thought_id", thoughtId)
            .order("created_at", { ascending: true });
          
          if (!logsError && allLogs && allLogs.length > 0) {
            const recentLogs = allLogs.slice(-20); // 最新20件のみ
            const logMessages = recentLogs.map((l: any) => l.message);
            
            // AIアウトプット生成
            aiOutputs = await generateAIOutputsFromLogs(logMessages);
            
            // 既存のai_outputsを削除（thought_id単位）
            await supabase
              .from("ai_outputs")
              .delete()
              .eq("thought_id", thoughtId);
            
            // 新しいAIアウトプットを保存
            const aiOutputRows = aiOutputs.map((output: any) => ({
              user_id: userId,
              thought_id: thoughtId,
              type: output.type,
              content: output.content,
            }));
            
            await supabase
              .from("ai_outputs")
              .insert(aiOutputRows);
          }
        }
        
      } catch (error) {
        console.error("🔍 API: AIアウトプット生成・保存エラー", error);
      }
    }
    
    return NextResponse.json({ gptThought, summary, tags, aiOutputs });
    
  } catch (error) {
    console.error("🔍 API: 例外発生", error);
    // OpenAI APIのレート制限エラーを特別にハンドリング
    if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
      return NextResponse.json({ 
        error: "AIの処理が混雑しています。しばらく待ってから再度お試しください。",
        detail: "Rate limit exceeded"
      }, { status: 429 });
    }
    
    // エラーが発生した場合は空のレスポンスを返す
    return NextResponse.json({ gptThought: "" });
  }
} 
 
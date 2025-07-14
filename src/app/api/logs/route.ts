import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateAIOutputsFromLogs } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { thought_id, user_id, message } = await req.json();
    if (!thought_id || !user_id || !message) {
      return NextResponse.json({ error: "thought_id, user_id, messageは必須です" }, { status: 400 });
    }

    // 1. 新しいログを追加
    const { data: newLog, error: logError } = await supabaseAdmin
      .from("logs")
      .insert([{ thought_id, user_id, message }])
      .select()
      .single();
    if (logError || !newLog) {
      console.error("API logs POST - ログ保存エラー:", logError);
      return NextResponse.json({ error: "ログ保存失敗", detail: logError?.message }, { status: 500 });
    }

    // 2. thought_idに紐づく全ログを取得
    const { data: logs, error: logsError } = await supabaseAdmin
      .from("logs")
      .select("message")
      .eq("thought_id", thought_id)
      .order("created_at", { ascending: true });
    if (logsError || !logs || logs.length === 0) {
      console.error("API logs POST - ログ取得エラー:", logsError);
      return NextResponse.json({ error: "ログ取得失敗", detail: logsError?.message }, { status: 500 });
    }
    
    // 最新の20件のみを使用（トークン数制限対策）
    // logsにすれば全件表示
    const recentLogs = logs.slice(-20);
    const logMessages = recentLogs.map((l: any) => l.message);

    // 3. AIアウトプット生成
    const aiOutputs = await generateAIOutputsFromLogs(logMessages);

    // 4. 既存のai_outputs（thought_idで削除）は不要なので削除
    // ここは何もせず、既存データは残す

    // 5. 生成結果を保存
    // aiOutputs配列から各typeのcontentを抽出
    const summary = aiOutputs.find((o: any) => o.type === 'summary')?.content || '';
    const tags = aiOutputs.find((o: any) => o.type === 'tags')?.content || '';
    const analysis = aiOutputs.find((o: any) => o.type === 'analysis')?.content || '';
    const suggestion = aiOutputs.find((o: any) => o.type === 'suggestion')?.content || '';

    // 既存レコードがあってもupdateせず、常にinsertのみ
    const { error: insertError } = await supabaseAdmin
      .from("ai_outputs")
      .insert([{ user_id, thought_id, summary, tags, analysis, suggestion }]);
    if (insertError) {
      console.error("AIアウトプットinsertエラー:", insertError);
      return NextResponse.json({ error: "AIアウトプット保存失敗", detail: insertError.message }, { status: 500 });
    }

    // 6. レスポンスで最新AIアウトプットを返却
    return NextResponse.json({ ai_outputs: aiOutputs });
  } catch (error) {
    console.error("API logs POST - 予期しないエラー:", error);
    
    // OpenAI APIのレート制限エラーを特別にハンドリング
    if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
      return NextResponse.json({ 
        error: "AIの処理が混雑しています。しばらく待ってから再度お試しください。",
        detail: "Rate limit exceeded"
      }, { status: 429 });
    }
    
    return NextResponse.json({ error: "サーバーエラー", detail: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
} 

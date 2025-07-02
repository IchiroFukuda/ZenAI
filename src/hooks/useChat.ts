import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Log {
  id: string;
  message: string;
  gpt_thought?: string;
  summary?: string;
  tags?: string;
  created_at?: string;
  thought_id?: string;
}

export function useChat(user: any, currentThoughtId: string | null) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuraVisible, setIsAuraVisible] = useState(false);

  // セッション切り替え時にそのセッションの全発言を取得
  useEffect(() => {
    if (!user || !currentThoughtId) {
      setLogs([]);
      return;
    }
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("thought_id", currentThoughtId)
        .order("created_at", { ascending: true });
      if (error) {
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    };
    fetchLogs();
  }, [user, currentThoughtId]);

  const createNewThought = async () => {
    if (!user) return null;
    const now = new Date();
    const title = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日の記録`;
    const { data, error } = await supabase
      .from("thoughts")
      .insert([{ title, user_id: user.id }])
      .select()
      .single();
    if (error) {
      console.error("Error creating thought:", error);
      return null;
    }
    return data.id;
  };

  const handleSend = async (
    message: string,
    isNewSession: boolean,
    onThoughtIdChange: (id: string) => void
  ) => {
    // 新しい発言を即時logsに追加
    const newLog: Log = {
      id: Math.random().toString(36).slice(2),
      message,
      created_at: new Date().toISOString(),
    };
    setLogs(prev => [...prev, newLog]);

    // オーラLottieを送信時だけ表示
    setIsAuraVisible(true);
    setTimeout(() => setIsAuraVisible(false), 10000);

    // 裏思考の生成と保存（非同期・バックグラウンド処理）
    const generateAndSaveThought = async () => {
      setLoading(true);
      try {
        let thoughtId = currentThoughtId;
        let logId = null;

        // 新規記録フラグが立っている場合のみ新しい記録を作成
        if (user && isNewSession) {
          const newThoughtId = await createNewThought();
          if (newThoughtId) {
            onThoughtIdChange(newThoughtId);
            thoughtId = newThoughtId;
          }
        }

        if (user && thoughtId) {
          const { data, error } = await supabase.from("logs").insert([
            { message, user_id: user.id, thought_id: thoughtId }
          ]).select().single();
          logId = data?.id;
        }

        const res = await fetch("/api/gpt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, thoughtId, userId: user?.id }),
        });
        
        const responseData = await res.json();
        const { gptThought, summary, tags } = responseData;
        
        if (user && logId) {
          await supabase.from("logs").update({ 
            gpt_thought: gptThought, summary, tags 
          }).eq("id", logId);
          
          if (thoughtId) {
            await supabase.from("thoughts")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", thoughtId);
          }
        } else {
          const localLogs = JSON.parse(localStorage.getItem("zenai-local-logs") || "[]");
          localLogs.unshift({
            message, gpt_thought: gptThought, summary, tags, created_at: new Date().toISOString(),
          });
          localStorage.setItem("zenai-local-logs", JSON.stringify(localLogs.slice(0, 20)));
        }
      } catch (error) {
        console.error("Error during background thought generation:", error);
      } finally {
        setLoading(false);
      }
    };
    generateAndSaveThought();
  };

  return {
    logs,
    loading,
    isAuraVisible,
    handleSend,
    createNewThought,
  };
} 

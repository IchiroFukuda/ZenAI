"use client";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ThoughtManager from "@/components/ThoughtManager";

export default function MainPage() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentThoughtId, setCurrentThoughtId] = useState<string | null>(null);
  const [isNewSession, setIsNewSession] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // ユーザーが変わった時に最新の思考セッションを自動選択
  useEffect(() => {
    if (user && !currentThoughtId) {
      loadLatestThought();
    }
  }, [user, currentThoughtId]);

  const loadLatestThought = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("thoughts")
      .select("id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    
    if (data && !error) {
      setCurrentThoughtId(data.id);
    }
  };

  const createNewThought = async () => {
    if (!user) return null;
    
    const title = `新しい思考セッション ${new Date().toLocaleString("ja-JP")}`;
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

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    
    let thoughtId = currentThoughtId;
    let logId = null;
    let message = input.trim();

    // 新規セッションフラグが立っている場合のみ新しいセッションを作成
    if (user && isNewSession) {
      thoughtId = await createNewThought();
      setCurrentThoughtId(thoughtId);
      setIsNewSession(false);
    }

    if (user && thoughtId) {
      // ログイン時のみ保存
      const { data, error } = await supabase.from("logs").insert([
        { message, user_id: user.id, thought_id: thoughtId }
      ]).select().single();
      logId = data?.id;
    }

    // AI裏思考生成（過去の思考履歴を含む）
    const res = await fetch("/api/gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message, 
        thoughtId, 
        userId: user?.id 
      }),
    });
    
    const responseData = await res.json();
    
    const { gptThought, summary, tags } = responseData;
    
    if (user && logId) {
      // ログイン時のみ保存
      await supabase.from("logs").update({ 
        gpt_thought: gptThought, 
        summary, 
        tags 
      }).eq("id", logId);
      
      // 思考セッションの更新日時を更新
      if (thoughtId) {
        await supabase.from("thoughts")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", thoughtId);
      }
    } else {
      // 未ログイン時はlocalStorageに保存
      const localLogs = JSON.parse(localStorage.getItem("zenai-local-logs") || "[]");
      localLogs.unshift({
        message,
        gpt_thought: gptThought,
        summary,
        tags,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("zenai-local-logs", JSON.stringify(localLogs.slice(0, 20)));
    }
    
    setInput("");
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleThoughtSelect = (thoughtId: string | null) => {
    setCurrentThoughtId(thoughtId);
    setIsNewSession(false);
  };

  const handleNewThought = () => {
    setIsNewSession(true);
    setCurrentThoughtId(null);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans" style={{ fontFamily: 'Inter, Noto Sans JP, sans-serif' }}>
      {/* サイドバー（思考管理） */}
      <div className="w-80 border-r border-blue-100 p-6 bg-blue-25">
        <ThoughtManager
          currentThoughtId={currentThoughtId}
          onThoughtSelect={handleThoughtSelect}
          onNewThought={handleNewThought}
        />
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center w-full max-w-4xl px-6">
          {/* 現在の思考セッションタイトル */}
          {user && currentThoughtId && !isNewSession && (
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-blue-700">
                現在の思考セッション
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                思考履歴を踏まえた裏思考を生成します
              </p>
            </div>
          )}

          {/* 新規セッション開始の案内 */}
          {user && isNewSession && (
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-blue-700">
                新しい思考セッションを開始
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                最初の思考を入力してください
              </p>
            </div>
          )}

          {/* 仏像画像 */}
          <div className="mb-12 flex items-center justify-center w-full">
            <div className="relative w-64 h-96 flex items-center justify-center">
              <Image
                src="/robot_transparent.png"
                alt="仏像ロボット"
                width={320}
                height={480}
                className="object-contain select-none pointer-events-none"
                priority
              />
            </div>
          </div>

          {/* 入力フォーム */}
          <form
            className="w-full max-w-2xl mx-auto bg-white/90 border border-blue-100 shadow-lg rounded-2xl px-6 py-6 flex items-center gap-3"
            style={{ boxShadow: "0 4px 24px 0 #b3d8f633" }}
            onSubmit={e => { e.preventDefault(); handleSend(); }}
          >
            <textarea
              ref={inputRef}
              className="flex-1 min-h-[48px] max-h-40 px-0 py-2 bg-transparent border-none outline-none text-lg text-blue-900 placeholder:text-blue-200 font-light resize-none"
              placeholder="Enter a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={1}
              style={{fontFamily: 'inherit'}}
            />
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 transition text-blue-700 font-semibold shadow-none border-none text-base"
              aria-label="Send"
              disabled={loading}
            >
              {loading ? "送信中..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 

"use client";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ThoughtManager from "@/components/ThoughtManager";
import Lottie from "lottie-react";
import aura from "@/assets/aura01.json";

// Log型を定義
interface Log {
  id: string;
  message: string;
  gpt_thought?: string;
  summary?: string;
  tags?: string;
  created_at?: string;
  thought_id?: string;
}

export default function MainPage() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentThoughtId, setCurrentThoughtId] = useState<string | null>(null);
  const [isNewSession, setIsNewSession] = useState(false);
  const [isNod, setIsNod] = useState(false);
  const [isAuraVisible, setIsAuraVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // ユーザーが変わった時に最新の記録を自動選択
  useEffect(() => {
    if (user && !currentThoughtId) {
      loadLatestThought();
    }
  }, [user, currentThoughtId]);

  // 初回オンボーディング判定
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const onboarded = localStorage.getItem('zenai-onboarded');
      if (!onboarded) {
        setShowOnboarding(true);
      }
    }
  }, []);

  useEffect(() => {
    console.log('logs updated:', logs);
  }, [logs]);

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

  const handleSend = () => {
    const message = input.trim();
    if (!message) return;
    console.log('handleSend message:', message);

    // 新しい発言を即時logsに追加（先頭に）
    const newLog: Log = {
      id: Math.random().toString(36).slice(2), // 仮ID
      message,
      created_at: new Date().toISOString(),
    };
    setLogs(prev => {
      const updated = [...prev, newLog];
      console.log('setLogs updated:', updated);
      return updated;
    });

    setInput("");   // 入力欄を即クリア
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'; // textareaの高さをリセット
    }
    inputRef.current?.focus();

    // --- オーラLottieを送信時だけ表示 ---
    setIsAuraVisible(true);
    setTimeout(() => setIsAuraVisible(false), 10000);

    // --- 裏思考の生成と保存（非同期・バックグラウンド処理） ---
    const generateAndSaveThought = async () => {
      setLoading(true); // 送信ボタンを無効化
      try {
        let thoughtId = currentThoughtId;
        let logId = null;

        // 新規記録フラグが立っている場合のみ新しい記録を作成
        if (user && isNewSession) {
          const newThoughtId = await createNewThought();
          if (newThoughtId) {
            setCurrentThoughtId(newThoughtId);
            setIsNewSession(false);
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
        setLoading(false); // 処理完了後、送信ボタンを有効化
      }
    };
    generateAndSaveThought(); // 非同期処理を開始（完了を待たない）
  };

  const handleThoughtSelect = (thoughtId: string | null) => {
    setCurrentThoughtId(thoughtId);
    setIsNewSession(false);
  };

  const handleNewThought = () => {
    setIsNewSession(true);
    setCurrentThoughtId(null);
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenai-onboarded', '1');
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans" style={{ fontFamily: 'Inter, Noto Sans JP, sans-serif' }}>
      {/* オンボーディングオーバーレイ */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-10 max-w-md w-full text-center relative">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">ZenAIの世界へようこそ</h2>
            <p className="text-gray-700 mb-4">ここではAIは何も語りません。</p>
            <p className="text-gray-500 mb-4">ただAIはあなたの言葉を聞き、理解します。AIの意見を聞きたい場合は、記録ページを開いてください。</p>
            <button
              className="mt-4 px-6 py-2 bg-blue-100 text-blue-700 rounded-xl font-semibold hover:bg-blue-200 transition"
              onClick={handleCloseOnboarding}
            >
              はじめる
            </button>
          </div>
        </div>
      )}
      {/* サイドバー（記録一覧） */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-0'} overflow-hidden border-r border-blue-100 bg-blue-25 relative`}>
        {/* サイドバー開閉ボタン（閉じる） */}
        {isSidebarOpen && (
          <button
            className="absolute -right-4 top-6 z-10 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full shadow hover:bg-blue-200 transition"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="サイドバーを閉じる"
          >
            <span className="text-xl">&#60;</span>
          </button>
        )}
        {isSidebarOpen && (
          <div className="p-6">
            <ThoughtManager
              currentThoughtId={currentThoughtId}
              onThoughtSelect={handleThoughtSelect}
              onNewThought={handleNewThought}
            />
          </div>
        )}
      </div>
      {/* サイドバーが閉じているときだけ「開く」ボタンを画面左端中央に表示 */}
      {!isSidebarOpen && (
        <button
          className="fixed left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full shadow hover:bg-blue-200 transition"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="サイドバーを開く"
        >
          <span className="text-xl">&#62;</span>
        </button>
      )}

      {/* メインコンテンツ 2カラムレイアウト */}
      <div className="flex-1 flex flex-row items-stretch min-h-screen">
        {/* 左カラム：自分の発言リスト＋入力欄 */}
        <div className="flex flex-col justify-end w-1/2 max-w-xl border-r border-blue-100 bg-white/80 relative">
          {/* 発言リスト */}
          <div className="flex-1 overflow-y-auto px-6 pt-8 pb-32 space-y-4">
            {logs && logs.length > 0 ? (
              logs.map((log, idx) => (
                <div key={log.id || idx} className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-blue-900 text-base shadow-sm">
                  {log.message}
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-8">まだ発言はありません。</div>
            )}
          </div>
          {/* 入力フォーム（下部固定） */}
          <form
            className="w-full bg-white/90 border-t border-blue-100 shadow-lg px-6 py-4 flex items-center gap-3 fixed left-1/2 bottom-4 -translate-x-1/2 z-30 max-w-xl rounded-2xl"
            style={{ boxShadow: "0 4px 24px 0 #b3d8f633" }}
            onSubmit={e => { e.preventDefault(); handleSend(); }}
          >
            <textarea
              ref={inputRef}
              className="flex-1 px-0 py-2 bg-transparent border-none outline-none text-lg text-blue-900 placeholder:text-blue-200 font-light resize-none"
              placeholder="Enter a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={1}
              style={{fontFamily: 'inherit', minHeight: 32, maxHeight: 240, overflow: 'auto'}}
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
        {/* 右カラム：仏像画像＋オーラ演出 */}
        <div className="flex-1 flex flex-col items-center justify-center relative bg-white">
          <div className="relative w-64 h-96 flex items-center justify-center">
            {/* オーラLottieアニメーション（背景、送信時だけ・大きく薄く） */}
            {isAuraVisible && (
              <div className="absolute left-1/2 top-1/2 z-0 pointer-events-none" style={{ width: "150%", height: "150%", transform: "translate(-50%, -50%)" }}>
                <Lottie animationData={aura} loop autoplay style={{ width: "100%", height: "100%", opacity: 0.2 }} />
              </div>
            )}
            {/* 仏像画像（前面） */}
            <Image
              src="/robot_transparent.png"
              alt="仏像ロボット"
              width={320}
              height={480}
              className="object-contain select-none pointer-events-none transition-transform duration-300"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
} 

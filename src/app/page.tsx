"use client";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ThoughtManager from "@/components/ThoughtManager";
import Lottie from "lottie-react";
import aura from "@/assets/aura01.json";
import { useRef as useComponentRef } from "react";

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
  // --- 追加: 発言リストの自動スクロール用ref ---
  const logsEndRef = useRef<HTMLDivElement>(null);
  const thoughtManagerRef = useComponentRef<any>(null);

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

  // --- 追加: セッション切り替え時にそのセッションの全発言を取得 ---
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

  // --- 追加: logsが更新されるたびに一番下までスクロール ---
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const maxHeight = window.innerHeight * 0.5;
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, maxHeight) + 'px';
    }
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

  const handleNewThought = async () => {
    if (!user) return;
    const newThoughtId = await createNewThought();
    if (newThoughtId) {
      setCurrentThoughtId(newThoughtId);
      setIsNewSession(false);
      // サイドバーのリストを即時更新
      if (thoughtManagerRef.current && thoughtManagerRef.current.loadThoughts) {
        await thoughtManagerRef.current.loadThoughts();
      }
    }
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenai-onboarded', '1');
    }
  };

  return (
    <div className="flex-1 flex bg-white font-sans relative" style={{ fontFamily: 'Inter, Noto Sans JP, sans-serif' }}>
      {/* 仏像背景（右寄せ） */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none flex items-end justify-end">
        <div className="relative" style={{ width: "40vw", height: "90vh" }}>
          {/* オーラLottieアニメーション（送信時だけ・仏像の背後） */}
          {isAuraVisible && (
            <div
              className="absolute"
              style={{
                right: 0,
                bottom: 0,
                width: "40vw",
                height: "90vh",
                transform: "translate(10%, 0)",
                zIndex: 0,
              }}
            >
              <Lottie
                animationData={aura}
                loop
                autoplay
                style={{ width: "100%", height: "100%", opacity: 0.3 }}
              />
            </div>
          )}
          <Image
            src="/robot_transparent.png"
            alt="仏像ロボット"
            width={600}
            height={900}
            className="absolute object-contain opacity-40 w-full h-full"
            priority
            style={{
              right: 0,
              bottom: 0,
              transform: "translate(10%, 0)",
              zIndex: 1,
            }}
          />
        </div>
      </div>
      {/* サイドバー（記録一覧） */}
      <div className={`z-10 h-screen w-80 overflow-y-auto border-r border-blue-100 bg-blue-25 relative`}>
        <div className="p-6 h-full flex flex-col">
          <ThoughtManager
            ref={thoughtManagerRef}
            currentThoughtId={currentThoughtId}
            onThoughtSelect={handleThoughtSelect}
            onNewThought={handleNewThought}
          />
        </div>
      </div>
      {/* メインコンテンツ（チャット欄左寄せ） */}
      <div className="flex-1 flex flex-col items-start justify-center min-h-screen z-10 pl-12">
        {/* 発言リスト */}
        <div className="w-full max-w-xl max-h-[70vh] overflow-y-auto px-6 pt-8 space-y-4 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 bg-transparent rounded-xl shadow-lg">
          {logs && logs.length > 0 ? (
            logs.map((log, idx) => (
              <div key={log.id || idx} className="bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 text-blue-900 text-base shadow-sm backdrop-blur-sm">
                {log.message}
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-8">まだ発言はありません。</div>
          )}
          {/* --- 追加: スクロール位置制御用ダミーdiv --- */}
          <div ref={logsEndRef} />
        </div>
        {/* 入力フォーム（下部固定・左寄せ） */}
        <form
          className="w-full max-w-xl bg-white/90 border-t border-blue-100 shadow-lg px-6 py-4 flex items-center gap-3 fixed left-0 bottom-8 z-20 rounded-2xl ml-80"
          style={{ boxShadow: "0 4px 24px 0 #b3d8f633" }}
          onSubmit={e => { e.preventDefault(); handleSend(); }}
        >
          <textarea
            ref={inputRef}
            className="flex-1 px-0 py-2 bg-transparent border-none outline-none text-lg text-blue-900 placeholder:text-blue-200 font-light resize-none"
            placeholder="Enter a message..."
            value={input}
            onChange={handleInputChange}
            rows={1}
            style={{fontFamily: 'inherit', minHeight: 32, maxHeight: '50vh', overflow: 'auto'}}
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
      {/* オンボーディングオーバーレイ（最前面） */}
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
    </div>
  );
} 

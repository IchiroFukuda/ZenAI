"use client";
import { useRef, useState, useEffect } from "react";

interface Log {
  id: string;
  message: string;
  gpt_thought?: string;
  summary?: string;
  tags?: string;
  created_at?: string;
  thought_id?: string;
}

interface ChatInterfaceProps {
  logs: Log[];
  loading: boolean;
  onSend: (message: string) => void;
  sidebarOpen?: boolean;
}

export default function ChatInterface({ logs, loading, onSend, sidebarOpen = false }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [emptyMessageIndex, setEmptyMessageIndex] = useState(0);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const emptyMessages = [
    "静けさの中へ",
    "ここで何かを発してみましょう",
    "...私は聞いています"
  ];

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // 空のメッセージのフェード効果
  useEffect(() => {
    if (logs.length === 0) {
      const fadeOut = () => {
        setFadeOpacity(0);
        setTimeout(() => {
          setEmptyMessageIndex((prev) => (prev + 1) % emptyMessages.length);
          setFadeOpacity(1);
        }, 1000); // フェードアウト完了後にメッセージ変更
      };

      const interval = setInterval(fadeOut, 7000);

      return () => clearInterval(interval);
    }
  }, [logs.length]);

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

    onSend(message);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 発言リスト */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {logs && logs.length > 0 ? (
          <div className="pt-8 space-y-4">
            <div className="w-full max-w-xl mx-auto space-y-4">
              {logs.map((log, idx) => (
                <div key={log.id || idx} className="bg-blue-50/30 border border-blue-100/50 rounded-xl px-4 py-3 text-blue-900 text-base shadow-sm backdrop-blur-sm">
                  <div className="whitespace-pre-line">{log.message}</div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div 
              className="text-gray-400 text-center transition-opacity duration-1000"
              style={{ opacity: fadeOpacity }}
            >
              {emptyMessages[emptyMessageIndex]}
            </div>
          </div>
        )}
      </div>
      
      {/* 入力フォーム */}
      <div className="flex-shrink-0 px-6 pb-8">
        <form
          className={`w-full max-w-xl mx-auto bg-white/90 border border-blue-100 shadow-lg px-6 py-4 flex items-center gap-3 rounded-2xl`}
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
    </div>
  );
} 

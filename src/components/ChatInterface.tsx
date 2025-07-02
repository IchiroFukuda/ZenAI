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
}

export default function ChatInterface({ logs, loading, onSend }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

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
        <div ref={logsEndRef} />
      </div>
      
      {/* 入力フォーム */}
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
  );
} 

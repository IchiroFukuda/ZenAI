"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function MainPage() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const { data, error } = await supabase.from("logs").insert([
      { message: input.trim() }
    ]).select().single();

    setInput("");
    inputRef.current?.focus();

    if (error) {
      console.error("Supabase insert error:", error);
    }
    if (data && data.id) {
      try {
        // サーバーAPI経由でGPT呼び出し
        const res = await fetch("/api/gpt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: data.message }),
        });
        const { gptThought } = await res.json();
        const { error: updateError } = await supabase.from("logs").update({ gpt_thought: gptThought }).eq("id", data.id);
        if (updateError) {
          console.error("Supabase update error:", updateError);
        }
      } catch (e) {
        console.error("OpenAI error:", e);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans" style={{ fontFamily: 'Inter, Noto Sans JP, sans-serif' }}>
      <div className="flex flex-col items-center w-full">
        {/* 仏像画像（鮮明に表示） */}
        <div className="mb-12 flex items-center justify-center w-full">
          <div className="relative w-64 h-96 flex items-center justify-center">
            <Image
              src="/robot.png"
              alt="仏像ロボット"
              width={320}
              height={480}
              className="object-contain select-none pointer-events-none"
              priority
            />
          </div>
        </div>
        {/* カード風フォーム（幅拡大） */}
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
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
} 

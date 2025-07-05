"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NavBar({ onSidebarToggle, className }: { onSidebarToggle?: () => void, className?: string }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  // デバッグ用：props全体をログ出力
  console.log('NavBar props:', { onSidebarToggle, user });

  // デバッグ用：onSidebarToggleの値が変更された時のログ
  useEffect(() => {
    console.log('NavBar - onSidebarToggle changed:', onSidebarToggle);
  }, [onSidebarToggle]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ボタン群
  const navButtons = (
    <>
      <Link href="/" className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${pathname === "/" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-blue-50"}`}>思考する</Link>
      <Link href="/logs" className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${pathname === "/logs" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-blue-50"}`}>ログ一覧</Link>
    </>
  );

  return (
    <>
      <nav className={`w-full flex justify-between items-center py-4 bg-white border-b border-blue-50 mb-2 shadow-sm sticky top-0 z-20 px-2 sm:px-6 ${className ?? ''}`}>
        {/* ハンバーガーメニュー（PC/スマホ共通） */}
        {onSidebarToggle && (
          <button
            className="mr-2 bg-white border border-blue-100 rounded-lg w-10 h-10 flex items-center justify-center shadow-md"
            onClick={() => {
              console.log('ハンバーガーメニュークリック');
              console.log('onSidebarToggle:', onSidebarToggle);
              onSidebarToggle();
            }}
            aria-label="サイドバーを開閉"
          >
            <span className="text-xl">≡</span>
          </button>
        )}
        {/* PC用ナビゲーションボタン */}
        <div className="gap-2 sm:gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-100 scrollbar-track-blue-50 hidden md:flex">
          {navButtons}
        </div>
        <div className="ml-auto flex items-center">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="https://buymeacoffee.com/zenai"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 sm:px-3 py-1 rounded border border-blue-200 bg-white text-blue-700 text-xs font-semibold hover:bg-blue-50 transition flex items-center gap-1 whitespace-nowrap"
                style={{ textDecoration: 'none' }}
              >
                <span>☕ 開発を支援</span>
              </a>
              <button onClick={handleLogout} className="px-2 sm:px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition whitespace-nowrap">ログアウト</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="https://buymeacoffee.com/zenai"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 sm:px-3 py-1 rounded border border-blue-200 bg-white text-blue-700 text-xs font-semibold hover:bg-blue-50 transition flex items-center gap-1 whitespace-nowrap"
                style={{ textDecoration: 'none' }}
              >
                <span>☕ 開発を支援</span>
              </a>
              <Link href="/login" className="px-3 sm:px-4 py-1 sm:py-2 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition text-sm sm:text-base whitespace-nowrap">ログイン</Link>
            </div>
          )}
        </div>
      </nav>
      {/* スマホ用ナビゲーションボタン（ナビゲーションバー下） */}
      <div className="flex md:hidden gap-2 px-2 pb-2 justify-center">
        {navButtons}
      </div>
    </>
  );
} 
 
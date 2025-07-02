"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

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

  return (
    <nav className="w-full flex justify-between items-center py-4 bg-white border-b border-blue-50 mb-8 shadow-sm sticky top-0 z-20 px-6">
      <div className="flex gap-4">
        <Link href="/" className={`px-4 py-2 rounded-lg font-medium transition-colors ${pathname === "/" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-blue-50"}`}>思考する</Link>
        <Link href="/logs" className={`px-4 py-2 rounded-lg font-medium transition-colors ${pathname === "/logs" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-blue-50"}`}>ログ一覧</Link>
      </div>
      <div>
        {user ? (
          <div className="flex items-center gap-3">
            <a
              href="https://buymeacoffee.com/zenai"
              target="_blank"
              rel="noopener noreferrer"
              className="mr-2 px-3 py-1 rounded border border-blue-200 bg-white text-blue-700 text-xs font-semibold hover:bg-blue-50 transition flex items-center gap-1"
              style={{ textDecoration: 'none' }}
            >
              <span>☕ 開発を支援</span>
            </a>
            <span className="text-xs text-gray-500">{user.email}</span>
            <button onClick={handleLogout} className="px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition">ログアウト</button>
          </div>
        ) : (
          <>
            <a
              href="https://buymeacoffee.com/zenai"
              target="_blank"
              rel="noopener noreferrer"
              className="mr-2 px-3 py-1 rounded border border-blue-200 bg-white text-blue-700 text-xs font-semibold hover:bg-blue-50 transition flex items-center gap-1"
              style={{ textDecoration: 'none' }}
            >
              <span>☕ 開発を支援</span>
            </a>
            <Link href="/login" className="px-4 py-2 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition">ログイン</Link>
          </>
        )}
      </div>
    </nav>
  );
} 
 
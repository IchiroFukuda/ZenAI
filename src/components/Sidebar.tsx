"use client";
import ThoughtManager from "@/components/ThoughtManager";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  user?: any;
  sidebarOpen: boolean;
  onClose?: () => void;
  currentThoughtId?: string | null;
  onThoughtSelect?: (id: string | null) => void;
  onNewThought?: () => Promise<void>;
  thoughtManagerRef?: React.RefObject<any>;
  showNewButton?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  sidebarOpen,
  onClose,
  currentThoughtId,
  onThoughtSelect,
  onNewThought,
  thoughtManagerRef,
  showNewButton = true,
}) => {
  const pathname = usePathname();

  if (!sidebarOpen) return null;

  // ナビゲーションボタン
  const navButtons = (
    <>
      <Link href="/" className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${pathname === "/" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-blue-50"}`}>思考する</Link>
      <Link href="/logs" className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${pathname === "/logs" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-blue-50"}`}>ログ一覧</Link>
    </>
  );

  return (
    <div className="fixed left-0 top-16 z-10 h-[calc(100vh-4rem)] w-80 md:w-80 w-64 overflow-y-auto border-r border-blue-100 bg-blue-25 flex flex-col">
      {/* スマホ用ナビゲーションボタン */}
      <div className="flex md:hidden gap-2 p-4 border-b border-blue-100">
        {navButtons}
      </div>
      
      <div className="p-4 md:p-6 flex-1 flex flex-col">
        <ThoughtManager
          ref={thoughtManagerRef}
          currentThoughtId={currentThoughtId as string | null}
          onThoughtSelect={onThoughtSelect as (id: string | null) => void}
          onNewThought={onNewThought as () => Promise<void>}
          showNewButton={showNewButton}
        />
      </div>
      {/* サイドバー下部にメールアドレス */}
      {user && (
        <div className="w-full text-xs text-gray-400 text-center pb-4 break-all px-4">
          {user.email}
        </div>
      )}
    </div>
  );
};

export default Sidebar; 

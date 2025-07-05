"use client";
import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import Sidebar from "@/components/Sidebar";
import React from "react";

export default function ClientLayout({
  children,
  user,
  currentThoughtId,
  onThoughtSelect,
  onNewThought,
  thoughtManagerRef,
  showNewButton = true,
}: {
  children: React.ReactNode;
  user: any;
  currentThoughtId: string | null;
  onThoughtSelect: (id: string | null) => void;
  onNewThought: () => Promise<void>;
  thoughtManagerRef: React.RefObject<any>;
  showNewButton?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // クライアントサイドでのみ画面幅をチェック
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <NavBar onSidebarToggle={() => setSidebarOpen(v => !v)} className="fixed top-0 left-0 w-full z-30 h-16" />
      <div className="flex flex-1 pt-16">
        {sidebarOpen && (
          <Sidebar
            sidebarOpen={sidebarOpen}
            user={user}
            currentThoughtId={currentThoughtId}
            onThoughtSelect={onThoughtSelect}
            onNewThought={onNewThought}
            thoughtManagerRef={thoughtManagerRef}
            showNewButton={showNewButton}
          />
        )}
        <main className={`flex-1 overflow-y-auto ${sidebarOpen ? 'pl-64 md:pl-80' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
} 

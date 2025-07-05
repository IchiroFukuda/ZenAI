"use client";
import { useState } from "react";
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
}: {
  children: React.ReactNode;
  user: any;
  currentThoughtId: string | null;
  onThoughtSelect: (id: string | null) => void;
  onNewThought: () => Promise<void>;
  thoughtManagerRef: React.RefObject<any>;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  // childrenにsidebarOpenプロパティを追加
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { sidebarOpen } as any);
    }
    return child;
  });

  return (
    <div className="flex flex-col h-screen">
      <NavBar onSidebarToggle={() => setSidebarOpen(v => !v)} className="fixed top-0 left-0 w-full z-20 h-16" />
      <div className="flex flex-1 pt-16">
        <Sidebar
          sidebarOpen={sidebarOpen}
          user={user}
          currentThoughtId={currentThoughtId}
          onThoughtSelect={onThoughtSelect}
          onNewThought={onNewThought}
          thoughtManagerRef={thoughtManagerRef}
        />
        <main className="flex-1 h-full overflow-y-auto">
          {childrenWithProps}
        </main>
      </div>
    </div>
  );
} 

import ThoughtManager from "@/components/ThoughtManager";
import React from "react";

interface SidebarProps {
  user?: any;
  sidebarOpen: boolean;
  onClose?: () => void;
  currentThoughtId?: string | null;
  onThoughtSelect?: (id: string | null) => void;
  onNewThought?: () => Promise<void>;
  thoughtManagerRef?: React.RefObject<any>;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  sidebarOpen,
  onClose,
  currentThoughtId,
  onThoughtSelect,
  onNewThought,
  thoughtManagerRef,
}) => {
  if (!sidebarOpen) return null;
  return (
    <div className="fixed left-0 top-16 z-10 h-[calc(100vh-4rem)] w-80 overflow-y-auto border-r border-blue-100 bg-blue-25 flex flex-col">
      <div className="p-6 flex-1 flex flex-col">
        <ThoughtManager
          ref={thoughtManagerRef}
          currentThoughtId={currentThoughtId as string | null}
          onThoughtSelect={onThoughtSelect as (id: string | null) => void}
          onNewThought={onNewThought as () => Promise<void>}
        />
      </div>
      {/* サイドバー下部にメールアドレス */}
      {user && (
        <div className="w-full text-xs text-gray-400 text-center pb-4 break-all">
          {user.email}
        </div>
      )}
    </div>
  );
};

export default Sidebar; 
